import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Users,
  Clock,
  Package,
  CalendarPlus,
  ListChecks,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/business/StatCard";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDateTime, activityStatusMap, activityTypeMap, calcHoursBetween } from "@/utils/formatters";
import type { Activity, VolunteerProfile } from "@/types";
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
} from "recharts";

const PIE_COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1"];

export function Dashboard() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const activities = useActivityStore((s) => s.activities);
  const signups = useActivityStore((s) => s.signups);
  const serviceHours = useActivityStore((s) => s.serviceHours);
  const volunteers = useVolunteerStore((s) => s.volunteers);
  const materials = useMaterialStore((s) => s.materials);
  const getVolunteerById = useVolunteerStore((s) => s.getVolunteerById);

  const myProfile: VolunteerProfile | undefined = useMemo(() => {
    if (currentUser?.role === "volunteer") {
      return volunteers.find((v) => v.userId === currentUser.id);
    }
    return undefined;
  }, [currentUser, volunteers]);

  const mySignups = useMemo(() => {
    if (myProfile) {
      return signups.filter((s) => s.volunteerId === myProfile.id);
    }
    return [];
  }, [myProfile, signups]);

  const stats = useMemo(() => {
    const totalHours = serviceHours.reduce((sum, h) => sum + h.hours, 0);
    const approvedVols = volunteers.filter((v) => v.status === "approved").length;
    const publishedActs = activities.filter(
      (a) => a.status === "published" || a.status === "ongoing"
    ).length;
    const lowStockMats = materials.filter((m) => m.warning).length;
    return { totalHours, approvedVols, publishedActs, lowStockMats };
  }, [activities, volunteers, materials, serviceHours]);

  const recentActivities = useMemo(() => {
    return [...activities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [activities]);

  const activityTypeData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    activities.forEach((a) => {
      typeMap[a.type] = (typeMap[a.type] || 0) + 1;
    });
    return Object.entries(typeMap).map(([type, count]) => ({
      name: activityTypeMap[type as keyof typeof activityTypeMap] || type,
      value: count,
    }));
  }, [activities]);

  const hourlyData = useMemo(() => {
    const last6Months: { name: string; hours: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthHours = serviceHours
        .filter((h) => h.serviceDate.startsWith(monthKey))
        .reduce((sum, h) => sum + h.hours, 0);
      last6Months.push({
        name: `${d.getMonth() + 1}月`,
        hours: Math.round(monthHours * 10) / 10,
      });
    }
    return last6Months;
  }, [serviceHours]);

  const lowStockMaterials = useMemo(() => materials.filter((m) => m.warning), [materials]);

  const renderVolunteerView = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="已参与活动"
          value={mySignups.length}
          icon={<CalendarDays className="w-6 h-6" />}
          color="primary"
        />
        <StatCard
          title="累计服务工时"
          value={`${myProfile?.totalHours || 0}h`}
          icon={<Clock className="w-6 h-6" />}
          color="success"
        />
        <StatCard
          title="已获证书"
          value={useActivityStore.getState().getCertificatesByVolunteer(myProfile?.id || "").length}
          icon={<Award className="w-6 h-6" />}
          color="warning"
        />
        <StatCard
          title="我的技能"
          value={myProfile?.skills.length || 0}
          icon={<Users className="w-6 h-6" />}
          color="primary"
        />
      </div>

      {myProfile && myProfile.skills.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>我的技能标签</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {myProfile.skills.map((skill) => (
                <Badge key={skill} variant="primary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex justify-between items-center flex-row">
          <CardTitle>我报名的活动</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/activities")}>
            查看全部 <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardBody>
          {mySignups.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p>暂无报名活动，快去报名吧！</p>
              <Button className="mt-4" onClick={() => navigate("/activities")}>
                浏览活动
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mySignups.slice(0, 5).map((signup) => {
                const activity = activities.find((a) => a.id === signup.activityId);
                if (!activity) return null;
                const status = activityStatusMap[activity.status];
                return (
                  <div
                    key={signup.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDateTime(activity.startTime)} · {activity.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={status.className.replace("badge-", "") as any}>
                        {status.label}
                      </Badge>
                      {signup.status === "confirmed" && (
                        <Badge variant="success">签到码: {signup.checkinCode}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );

  const renderAdminView = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="活动总数"
          value={activities.length}
          icon={<CalendarDays className="w-6 h-6" />}
          color="primary"
          trend="进行中 5 场"
          trendUp
        />
        <StatCard
          title="注册志愿者"
          value={stats.approvedVols}
          icon={<Users className="w-6 h-6" />}
          color="success"
          trend={`待审核 ${volunteers.filter((v) => v.status === "pending").length} 人`}
          trendUp={false}
        />
        <StatCard
          title="累计服务工时"
          value={`${stats.totalHours}h`}
          icon={<Clock className="w-6 h-6" />}
          color="warning"
          trend="本月 +48h"
          trendUp
        />
        <StatCard
          title="库存预警物资"
          value={stats.lowStockMats}
          icon={<Package className="w-6 h-6" />}
          color="danger"
          trend="需及时补货"
          trendUp={false}
        />
      </div>

      {currentUser?.role === "admin" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card hover className="p-5 cursor-pointer" onClick={() => navigate("/activities/create")}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                <CalendarPlus className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-900">发布活动</p>
                <p className="text-xs text-gray-500">创建新志愿活动</p>
              </div>
            </div>
          </Card>
          <Card hover className="p-5 cursor-pointer" onClick={() => navigate("/activities/approval")}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning-50 rounded-xl text-warning-500">
                <ListChecks className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-900">活动审批</p>
                <p className="text-xs text-gray-500">
                  {activities.filter((a) => a.status === "pending").length} 项待审批
                </p>
              </div>
            </div>
          </Card>
          <Card hover className="p-5 cursor-pointer" onClick={() => navigate("/volunteers")}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-success-50 rounded-xl text-success-500">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-900">志愿者管理</p>
                <p className="text-xs text-gray-500">审核与管理志愿者</p>
              </div>
            </div>
          </Card>
          <Card hover className="p-5 cursor-pointer" onClick={() => navigate("/statistics")}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-gray-900">统计报表</p>
                <p className="text-xs text-gray-500">数据统计与报告导出</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {lowStockMaterials.length > 0 && (
        <Card className="mb-6 border-danger-200 bg-danger-50/30">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-danger-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-danger-700 mb-2">库存预警提醒</p>
                <div className="flex flex-wrap gap-2">
                  {lowStockMaterials.map((m) => (
                    <Badge key={m.id} variant="danger">
                      {m.name}（{m.currentStock}{m.unit}）
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="danger" size="sm" onClick={() => navigate("/materials")}>
                查看详情
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>近6个月服务工时趋势</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                  />
                  <Bar dataKey="hours" fill="#4F46E5" radius={[4, 4, 0, 0]} name="工时(h)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>活动类型分布</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {activityTypeData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {activityTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex justify-between items-center flex-row">
          <CardTitle>最近活动</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/activities")}>
            查看全部 <ChevronRight className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {recentActivities.map((activity: Activity) => {
              const status = activityStatusMap[activity.status];
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate(`/activities/${activity.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <Badge variant={status.className.replace("badge-", "") as any}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {activityTypeMap[activity.type]} · {formatDateTime(activity.startTime)} · {activity.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.currentParticipants}/{activity.maxParticipants} 人
                    </p>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </>
  );

  return (
    <AppLayout title="工作台">
      {currentUser?.role === "volunteer" ? renderVolunteerView() : renderAdminView()}
    </AppLayout>
  );
}
