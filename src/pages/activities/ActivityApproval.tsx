import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import {
  activityStatusMap,
  activityTypeMap,
  formatDateTime,
} from "@/utils/formatters";
import type { Activity } from "@/types";
import { cn } from "@/lib/utils";

export function ActivityApproval() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const activities = useActivityStore((s) => s.activities);
  const approveActivity = useActivityStore((s) => s.approveActivity);
  const rejectActivity = useActivityStore((s) => s.rejectActivity);
  const escalatePendingActivities = useActivityStore(
    (s) => s.escalatePendingActivities
  );
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [approvalComment, setApprovalComment] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const pendingActivities = useMemo(() => {
    escalatePendingActivities();
    return activities
      .filter((a) => a.status === "pending")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activities, escalatePendingActivities]);

  const handleApprove = () => {
    if (!selectedActivity || !currentUser) return;
    approveActivity(selectedActivity.id, currentUser.id, approvalComment || undefined);
    addNotification({
      userId: selectedActivity.organizerId,
      type: "approval",
      title: "活动审批通过",
      content: `您发布的活动「${selectedActivity.title}」已通过审批，已自动上架。`,
    });
    setShowApproveModal(false);
    setSelectedActivity(null);
    setApprovalComment("");
  };

  const handleReject = () => {
    if (!selectedActivity || !currentUser) return;
    rejectActivity(selectedActivity.id, currentUser.id, approvalComment || undefined);
    addNotification({
      userId: selectedActivity.organizerId,
      type: "approval",
      title: "活动审批未通过",
      content: `您发布的活动「${selectedActivity.title}」未通过审批${
        approvalComment ? `，原因：${approvalComment}` : ""
      }。`,
    });
    setShowRejectModal(false);
    setSelectedActivity(null);
    setApprovalComment("");
  };

  const openApproveModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setApprovalComment("");
    setShowApproveModal(true);
  };

  const openRejectModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setApprovalComment("");
    setShowRejectModal(true);
  };

  return (
    <AppLayout title="活动审批">
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">待审批活动</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingActivities.length} 个
                </p>
              </div>
            </div>
            {pendingActivities.some((a) => a.escalated) && (
              <Badge variant="danger" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                存在超期未审批活动
              </Badge>
            )}
          </div>
        </CardBody>
      </Card>

      {pendingActivities.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <Check className="w-16 h-16 mx-auto text-success-400 mb-4" />
            <p className="text-gray-500">暂无待审批的活动</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingActivities.map((activity) => (
            <Card
              key={activity.id}
              className={cn(
                activity.escalated && "border-danger-300 bg-danger-50/30"
              )}
            >
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="primary">{activityTypeMap[activity.type]}</Badge>
                      <Badge variant={activityStatusMap[activity.status].className.replace("badge-", "") as any}>
                        {activityStatusMap[activity.status].label}
                      </Badge>
                      {activity.escalated && (
                        <Badge variant="danger" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          超期提醒
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDateTime(activity.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{activity.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>上限 {activity.maxParticipants} 人</span>
                      </div>
                    </div>
                    {activity.skillRequirements.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1.5">技能要求：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activity.skillRequirements.map((skill) => (
                            <Badge key={skill} variant="gray" className="text-[10px]">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/activities/${activity.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看详情
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openApproveModal(activity)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      通过
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openRejectModal(activity)}
                    >
                      <X className="w-4 h-4 mr-1" />
                      拒绝
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="通过活动审批"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确定通过活动「{selectedActivity?.title}」的审批？通过后活动将自动上架。
          </p>
          <Textarea
            label="审批意见（可选）"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            placeholder="请输入审批意见"
            rows={3}
          />
        </div>
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
        title="拒绝活动审批"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确定拒绝活动「{selectedActivity?.title}」的审批？
          </p>
          <Textarea
            label="拒绝原因"
            value={approvalComment}
            onChange={(e) => setApprovalComment(e.target.value)}
            placeholder="请输入拒绝原因"
            rows={3}
          />
        </div>
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
