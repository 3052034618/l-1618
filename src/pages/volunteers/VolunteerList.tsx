import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Clock,
  Award,
  Check,
  X,
  Eye,
  Phone,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { AppLayout } from "@/components/layout/AppLayout";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { StatCard } from "@/components/business/StatCard";
import {
  maskIdCard,
  maskPhone,
  volunteerStatusMap,
  formatDate,
} from "@/utils/formatters";
import type { VolunteerProfile } from "@/types";

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
];

export function VolunteerList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const volunteers = useVolunteerStore((s) => s.volunteers);
  const updateVolunteerStatus = useVolunteerStore((s) => s.updateVolunteerStatus);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const stats = useMemo(() => {
    return {
      total: volunteers.length,
      pending: volunteers.filter((v) => v.status === "pending").length,
      approved: volunteers.filter((v) => v.status === "approved").length,
      totalHours: volunteers.reduce((sum, v) => sum + v.totalHours, 0),
    };
  }, [volunteers]);

  const filteredVolunteers = useMemo(() => {
    let result = volunteers;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.realName.toLowerCase().includes(s) ||
          v.idCard.includes(s) ||
          v.emergencyContact.includes(s)
      );
    }
    if (statusFilter) {
      result = result.filter((v) => v.status === statusFilter);
    }
    return result;
  }, [volunteers, search, statusFilter]);

  const handleApprove = () => {
    if (!selectedVolunteer) return;
    updateVolunteerStatus(selectedVolunteer.id, "approved");
    addNotification({
      userId: selectedVolunteer.userId,
      type: "system",
      title: "志愿者审核通过",
      content: `恭喜您！您的志愿者身份已通过审核，现在可以报名参加活动了。`,
    });
    setShowApproveModal(false);
    setSelectedVolunteer(null);
  };

  const handleReject = () => {
    if (!selectedVolunteer) return;
    updateVolunteerStatus(selectedVolunteer.id, "rejected");
    addNotification({
      userId: selectedVolunteer.userId,
      type: "system",
      title: "志愿者审核未通过",
      content: `很抱歉，您的志愿者身份审核未通过。如有疑问，请联系管理员。`,
    });
    setShowRejectModal(false);
    setSelectedVolunteer(null);
  };

  const columns = [
    {
      key: "realName",
      title: "姓名",
      render: (row: VolunteerProfile) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium">{row.realName}</span>
        </div>
      ),
    },
    {
      key: "gender",
      title: "性别",
      render: (row: VolunteerProfile) => (row.gender === "male" ? "男" : "女"),
    },
    {
      key: "age",
      title: "年龄",
      render: (row: VolunteerProfile) => `${row.age}岁`,
    },
    {
      key: "idCard",
      title: "身份证号",
      render: (row: VolunteerProfile) => (
        <span className="font-mono text-xs">{maskIdCard(row.idCard)}</span>
      ),
    },
    {
      key: "skills",
      title: "技能",
      width: "w-48",
      render: (row: VolunteerProfile) => (
        <div className="flex flex-wrap gap-1">
          {row.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="gray" className="text-[10px]">
              {skill}
            </Badge>
          ))}
          {row.skills.length > 3 && (
            <Badge variant="gray" className="text-[10px]">
              +{row.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "activityCount",
      title: "参与活动",
      render: (row: VolunteerProfile) => (
        <span className="font-medium">{row.activityCount} 次</span>
      ),
    },
    {
      key: "totalHours",
      title: "累计工时",
      render: (row: VolunteerProfile) => (
        <span className="font-medium text-primary-600">{row.totalHours} h</span>
      ),
    },
    {
      key: "status",
      title: "状态",
      render: (row: VolunteerProfile) => {
        const status = volunteerStatusMap[row.status];
        return (
          <Badge variant={status.className.replace("badge-", "") as any}>
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      title: "操作",
      width: "w-40",
      render: (row: VolunteerProfile) => (
        <div className="flex gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelectedVolunteer(row);
              setShowDetailModal(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {isAdmin && row.status === "pending" && (
            <>
              <Button
                variant="success"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedVolunteer(row);
                  setShowApproveModal(true);
                }}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setSelectedVolunteer(row);
                  setShowRejectModal(true);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="志愿者管理">
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="志愿者总数"
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          variant="primary"
        />
        <StatCard
          title="待审核"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          variant="warning"
        />
        <StatCard
          title="已通过"
          value={stats.approved}
          icon={<Check className="w-5 h-5" />}
          variant="success"
        />
        <StatCard
          title="累计工时"
          value={`${stats.totalHours}h`}
          icon={<Award className="w-5 h-5" />}
          variant="info"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索姓名、身份证号..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>志愿者列表</CardTitle>
        </CardHeader>
        <CardBody className="!p-0">
          <Table
            columns={columns}
            data={filteredVolunteers}
            rowKey={(row) => row.id}
            emptyText="暂无志愿者数据"
          />
        </CardBody>
      </Card>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="志愿者详情"
        size="lg"
      >
        {selectedVolunteer && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedVolunteer.realName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {selectedVolunteer.gender === "male" ? "男" : "女"} · {selectedVolunteer.age}岁
                  </span>
                  <Badge
                    variant={
                      volunteerStatusMap[selectedVolunteer.status].className.replace(
                        "badge-",
                        ""
                      ) as any
                    }
                  >
                    {volunteerStatusMap[selectedVolunteer.status].label}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">身份证号</p>
                <p className="font-mono">{maskIdCard(selectedVolunteer.idCard)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">出生日期</p>
                <p className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {formatDate(selectedVolunteer.birthDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">紧急联系人</p>
                <p>{selectedVolunteer.emergencyContact}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">紧急联系电话</p>
                <p className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {maskPhone(selectedVolunteer.emergencyPhone)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">技能标签</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedVolunteer.skills.map((skill) => (
                  <Badge key={skill} variant="primary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-600">
                  {selectedVolunteer.activityCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">参与活动</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success-600">
                  {selectedVolunteer.totalHours}h
                </p>
                <p className="text-xs text-gray-500 mt-1">累计工时</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowDetailModal(false)}>
            关闭
          </Button>
        </div>
      </Modal>

      <Modal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="通过审核"
      >
        <p className="text-sm text-gray-600">
          确定通过志愿者「{selectedVolunteer?.realName}」的审核？
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowApproveModal(false)}>
            取消
          </Button>
          <Button variant="success" onClick={handleApprove}>
            <Check className="w-4 h-4 mr-2" />
            确认通过
          </Button>
        </div>
      </Modal>

      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="拒绝审核"
      >
        <p className="text-sm text-gray-600">
          确定拒绝志愿者「{selectedVolunteer?.realName}」的审核？
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowRejectModal(false)}>
            取消
          </Button>
          <Button variant="danger" onClick={handleReject}>
            <X className="w-4 h-4 mr-2" />
            确认拒绝
          </Button>
        </div>
      </Modal>
    </AppLayout>
  );
}
