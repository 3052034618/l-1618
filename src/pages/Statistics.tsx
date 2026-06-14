import { useState, useMemo, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  Download,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import { StatCard } from "@/components/business/StatCard";
import {
  activityTypeMap,
  formatDate,
} from "@/utils/formatters";
import { exportMonthlyReport } from "@/utils/pdfExport";
import type { MonthlyReport, VolunteerStats, ActivityStats } from "@/types";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

export function Statistics() {
  const activities = useActivityStore((s) => s.activities);
  const signups = useActivityStore((s) => s.signups);
  const serviceHours = useActivityStore((s) => s.serviceHours);
  const volunteers = useVolunteerStore((s) => s.volunteers);
  const getActivityById = useActivityStore((s) => s.getActivityById);
  const getVolunteerById = useVolunteerStore((s) => s.getVolunteerById);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    activities.forEach((a) => {
      const month = a.createdAt.substring(0, 7);
      months.add(month);
    });
    serviceHours.forEach((h) => {
      const month = h.serviceDate.substring(0, 7);
      months.add(month);
    });
    months.add(defaultMonth);
    return Array.from(months)
      .sort((a, b) => b.localeCompare(a))
      .map((m) => ({ value: m, label: m.replace("-", "年") + "月" }));
  }, [activities, serviceHours, defaultMonth]);

  const report: MonthlyReport = useMemo(() => {
    const monthActivities = activities.filter(
      (a) => a.createdAt.startsWith(selectedMonth) || a.startTime.startsWith(selectedMonth)
    );

    const monthHours = serviceHours.filter((h) => h.serviceDate.startsWith(selectedMonth));
    const monthSignups = signups.filter((s) => {
      const activity = getActivityById(s.activityId);
      return activity?.startTime.startsWith(selectedMonth);
    });

    const volunteerIdsInMonth = new Set(monthHours.map((h) => h.volunteerId));
    const approvedVolunteers = volunteers.filter((v) => v.status === "approved");

    const byTypeMap: Record<string, ActivityStats> = {};
    monthActivities.forEach((activity) => {
      const type = activity.type;
      if (!byTypeMap[type]) {
        byTypeMap[type] = { activityType: type, count: 0, totalHours: 0 };
      }
      byTypeMap[type].count += 1;
      const activityHours = monthHours.filter((h) => h.activityId === activity.id);
      byTypeMap[type].totalHours += activityHours.reduce((sum, h) => sum + h.hours, 0);
    });

    const volunteerStatsMap: Record<string, VolunteerStats> = {};
    monthHours.forEach((h) => {
      if (!volunteerStatsMap[h.volunteerId]) {
        const v = getVolunteerById(h.volunteerId);
        volunteerStatsMap[h.volunteerId] = {
          volunteerId: h.volunteerId,
          volunteerName: v?.realName || "未知",
          activityCount: 0,
          totalHours: 0,
          participationRate: 0,
        };
      }
      volunteerStatsMap[h.volunteerId].totalHours += h.hours;
      volunteerStatsMap[h.volunteerId].activityCount += 1;
    });

    const totalMonthActivities = monthActivities.filter(
      (a) => a.status === "completed" || a.status === "ongoing"
    ).length;

    Object.values(volunteerStatsMap).forEach((v) => {
      v.participationRate = totalMonthActivities > 0 ? v.activityCount / totalMonthActivities : 0;
    });

    const topVolunteers = Object.values(volunteerStatsMap)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10);

    const totalHours = monthHours.reduce((sum, h) => sum + h.hours, 0);
    const activeVolunteers = volunteerIdsInMonth.size;
    const totalVolunteers = approvedVolunteers.length;

    return {
      month: selectedMonth,
      totalActivities: monthActivities.length,
      totalVolunteers: activeVolunteers,
      totalHours,
      avgHoursPerVolunteer: activeVolunteers > 0 ? Math.round((totalHours / activeVolunteers) * 10) / 10 : 0,
      participationRate: totalVolunteers > 0 ? activeVolunteers / totalVolunteers : 0,
      byType: Object.values(byTypeMap),
      topVolunteers,
    };
  }, [activities, serviceHours, signups, volunteers, selectedMonth, getActivityById, getVolunteerById]);

  const barChartData = useMemo(() => {
    return report.byType.map((item) => ({
      name: activityTypeMap[item.activityType as keyof typeof activityTypeMap] || item.activityType,
      活动数量: item.count,
      总工时: item.totalHours,
    }));
  }, [report.byType]);

  const pieChartData = useMemo(() => {
    return report.byType.map((item) => ({
      name: activityTypeMap[item.activityType as keyof typeof activityTypeMap] || item.activityType,
      value: item.count,
    }));
  }, [report.byType]);

  const handleExportPDF = async () => {
    await exportMonthlyReport(report);
  };

  const volunteerColumns = [
    {
      key: "rank",
      title: "排名",
      width: "w-16",
      render: (row: VolunteerStats) => {
        const index = report.topVolunteers.findIndex((v) => v.volunteerId === row.volunteerId);
        return (
          <div className="flex items-center gap-1.5">
            {index < 3 ? (
              <Badge
                variant={index === 0 ? "warning" : index === 1 ? "gray" : "primary"}
                className="gap-1"
              >
                <Award className="w-3 h-3" />
                {index + 1}
              </Badge>
            ) : (
              <span className="text-gray-500 font-medium">{index + 1}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "volunteerName",
      title: "姓名",
      render: (row: VolunteerStats) => (
        <span className="font-medium">{row.volunteerName}</span>
      ),
    },
    {
      key: "activityCount",
      title: "参与次数",
      render: (row: VolunteerStats) => <span>{row.activityCount} 次</span>,
    },
    {
      key: "totalHours",
      title: "总工时",
      render: (row: VolunteerStats) => (
        <span className="font-semibold text-primary-600">{row.totalHours} h</span>
      ),
    },
    {
      key: "participationRate",
      title: "参与率",
      render: (row: VolunteerStats) => (
        <span>{(row.participationRate * 100).toFixed(0)}%</span>
      ),
    },
  ];

  return (
    <AppLayout title="统计报表">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">月度运营报告</h2>
          <div className="w-44">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
            />
          </div>
        </div>
        <Button leftIcon={<Download className="w-4 h-4" />} onClick={handleExportPDF}>
          导出 PDF 报告
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="活动总数"
          value={report.totalActivities}
          icon={<Calendar className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          title="参与志愿者"
          value={report.totalVolunteers}
          icon={<Users className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="总服务工时"
          value={`${report.totalHours}h`}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          title="平均参与率"
          value={`${(report.participationRate * 100).toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>按活动类型统计</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="活动数量" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="总工时" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  暂无数据
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>活动类型分布</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  暂无数据
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>志愿者服务排行榜</CardTitle>
        </CardHeader>
        <CardBody className="!p-0">
          <Table
            columns={volunteerColumns}
            data={report.topVolunteers}
            rowKey={(row) => row.volunteerId}
            emptyText="本月暂无志愿者服务记录"
          />
        </CardBody>
      </Card>
    </AppLayout>
  );
}
