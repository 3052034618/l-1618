import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  Award,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CheckinCode } from "@/components/business/CheckinCode";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import {
  activityStatusMap,
  activityTypeMap,
  formatDateTime,
  maskPhone,
  calcHoursBetween,
} from "@/utils/formatters";
import { checkCapacity, checkSkillMatch } from "@/utils/validators";

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const getActivityById = useActivityStore((s) => s.getActivityById);
  const getSignupByVolunteerAndActivity = useActivityStore(
    (s) => s.getSignupByVolunteerAndActivity
  );
  const getSignupsByActivity = useActivityStore((s) => s.getSignupsByActivity);
  const signupActivity = useActivityStore((s) => s.signupActivity);
  const checkinVolunteer = useActivityStore((s) => s.checkinVolunteer);
  const completeActivity = useActivityStore((s) => s.completeActivity);
  const incrementHours = useVolunteerStore((s) => s.incrementHours);
  const incrementActivityCount = useVolunteerStore((s) => s.incrementActivityCount);
  const getVolunteerById = useVolunteerStore((s) => s.getVolunteerById);
  const getVolunteerByUserId = useVolunteerStore((s) => s.getVolunteerByUserId);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const getRequisitionsByActivity = useMaterialStore((s) => s.getRequisitionsByActivity);
  const getMaterialById = useMaterialStore((s) => s.getMaterialById);

  const activity = id ? getActivityById(id) : undefined;
  const [showCheckinCode, setShowCheckinCode] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);

  const myProfile = useMemo(() => {
    if (currentUser?.role === "volunteer") {
      return getVolunteerByUserId(currentUser.id);
    }
    return undefined;
  }, [currentUser, getVolunteerByUserId]);

  const mySignup = useMemo(() => {
    if (myProfile && activity) {
      return getSignupByVolunteerAndActivity(myProfile.id, activity.id);
    }
    return undefined;
  }, [myProfile, activity, getSignupByVolunteerAndActivity]);

  const activitySignups = useMemo(() => {
    if (!activity) return [];
    return getSignupsByActivity(activity.id);
  }, [activity, getSignupsByActivity]);

  const requisitions = useMemo(() => {
    if (!activity) return [];
    return getRequisitionsByActivity(activity.id);
  }, [activity, getRequisitionsByActivity]);

  if (!activity) {
    return (
      <AppLayout title="活动详情">
        <Card>
          <CardBody className="py-16 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">活动不存在或已被删除</p>
            <Link to="/activities">
              <Button>返回活动列表</Button>
            </Link>
          </CardBody>
        </Card>
      </AppLayout>
    );
  }

  const status = activityStatusMap[activity.status];
  const capacity = checkCapacity(activity.currentParticipants, activity.maxParticipants);
  const hours = calcHoursBetween(activity.startTime, activity.endTime);

  const handleSignup = () => {
    if (!myProfile) {
      setSignupError("请先完善志愿者资料");
      return;
    }
    if (myProfile.status !== "approved") {
      setSignupError("您的志愿者资料尚未通过审核，暂时无法报名");
      return;
    }

    const skillResult = checkSkillMatch(myProfile.skills, activity.skillRequirements);

    const result = signupActivity(activity.id, myProfile.id, myProfile.skills);
    if (!result.success) {
      setSignupError(result.message || "报名失败");
      return;
    }

    incrementHours(myProfile.id, 0);
    incrementActivityCount(myProfile.id);

    addNotification({
      userId: currentUser!.id,
      type: "activity",
      title: "报名成功",
      content: `您已成功报名《${activity.title}》，请准时参加。`,
    });

    setSignupSuccess(true);
  };

  const handleCheckin = (signupId: string) => {
    checkinVolunteer(signupId);
  };

  const handleComplete = () => {
    if (confirm("确定要结束该活动吗？结束后将自动为参与者累计工时并生成证书。")) {
      completeActivity(activity.id);
      activitySignups.forEach((signup) => {
        incrementHours(signup.volunteerId, hours);
        const vol = getVolunteerById(signup.volunteerId);
        if (vol) {
          const volUser = useAuthStore.getState().users.find((u) => u.id === vol.userId);
          if (volUser) {
            addNotification({
              userId: volUser.id,
              type: "activity",
              title: "活动已完成",
              content: `《${activity.title}》已结束，您获得了 ${hours} 小时服务时长，证书已生成。`,
            });
          }
        }
      });
    }
  };

  const skillInfo = myProfile
    ? checkSkillMatch(myProfile.skills, activity.skillRequirements)
    : null;

  return (
    <AppLayout title="活动详情">
      <Link to="/activities" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        返回活动列表
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary">{activityTypeMap[activity.type]}</Badge>
                    <Badge variant={status.className.replace("badge-", "") as any}>
                      {status.label}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
                </div>
                {currentUser?.role !== "volunteer" && activity.status === "published" && (
                  <Button variant="primary" onClick={handleComplete}>
                    结束活动
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">活动时长</p>
                  <p className="text-base font-semibold text-gray-900">{hours} 小时</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">报名人数</p>
                  <p className="text-base font-semibold text-gray-900">
                    {activity.currentParticipants}/{activity.maxParticipants}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">开始时间</p>
                  <p className="text-base font-semibold text-gray-900">{formatDateTime(activity.startTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">结束时间</p>
                  <p className="text-base font-semibold text-gray-900">{formatDateTime(activity.endTime)}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">活动地点</p>
                    <p className="text-gray-900">{activity.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">活动时间</p>
                    <p className="text-gray-900">
                      {formatDateTime(activity.startTime)} - {formatDateTime(activity.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">活动介绍</p>
                <p className="text-gray-600 leading-relaxed">{activity.description}</p>
              </div>

              {activity.skillRequirements.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">技能要求</p>
                  <div className="flex flex-wrap gap-2">
                    {activity.skillRequirements.map((skill) => {
                      const hasSkill = skillInfo?.matchedSkills.includes(skill);
                      return (
                        <Badge
                          key={skill}
                          variant={hasSkill ? "success" : myProfile ? "warning" : "gray"}
                        >
                          {skill}
                          {hasSkill && " ✓ 已具备"}
                          {!hasSkill && skillInfo && " ✗ 未具备"}
                        </Badge>
                      );
                    })}
                  </div>
                  {skillInfo && !skillInfo.matched && (
                    <p className="text-xs text-warning-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      您缺少部分要求技能，但仍可报名
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {requisitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>关联物资领用</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-2">
                  {requisitions.map((req) => {
                    const mat = getMaterialById(req.materialId);
                    return (
                      <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{mat?.name}</span>
                        <Badge variant="primary">领用 {req.quantity}{mat?.unit}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {currentUser?.role !== "volunteer" && (
            <Card>
              <CardHeader>
                <CardTitle>报名人员（{activitySignups.length}人）</CardTitle>
              </CardHeader>
              <CardBody>
                {activitySignups.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">暂无报名人员</p>
                ) : (
                  <div className="space-y-2">
                    {activitySignups.map((signup) => {
                      const vol = getVolunteerById(signup.volunteerId);
                      return (
                        <div
                          key={signup.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                              {vol?.realName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{vol?.realName}</p>
                              <p className="text-xs text-gray-500">
                                {signup.skillMatched ? "技能匹配" : "技能部分匹配"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {signup.status === "confirmed" && activity.status === "ongoing" && (
                              <Button size="sm" variant="success" onClick={() => handleCheckin(signup.id)}>
                                <CheckCircle className="w-4 h-4" />
                                签到
                              </Button>
                            )}
                            {signup.status === "checked_in" && (
                              <Badge variant="success">已签到</Badge>
                            )}
                            {signup.status === "completed" && (
                              <Badge variant="gray">已完成</Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody>
              {currentUser?.role === "volunteer" ? (
                mySignup ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-success-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">报名成功</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {mySignup.status === "confirmed" && "等待活动开始"}
                      {mySignup.status === "checked_in" && "您已完成签到"}
                      {mySignup.status === "completed" && "活动已完成"}
                    </p>

                    {(mySignup.status === "confirmed" || mySignup.status === "checked_in") && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-500 mb-2">您的签到码</p>
                        <div className="flex items-center justify-center gap-2">
                          <QrCode className="w-8 h-8 text-primary-600" />
                          <p className="text-2xl font-mono font-bold text-primary-600 tracking-widest">
                            {mySignup.checkinCode}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button variant="secondary" className="w-full mb-3" onClick={() => setShowCheckinCode(true)}>
                      <QrCode className="w-4 h-4" />
                      查看签到码
                    </Button>

                    {mySignup.status === "completed" && (
                      <Button variant="primary" className="w-full" onClick={() => navigate("/certificate/1")}>
                        <Award className="w-4 h-4" />
                        查看服务证书
                      </Button>
                    )}
                  </div>
                ) : activity.status === "published" ? (
                  <div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">剩余名额</p>
                      <p className="text-3xl font-bold text-primary-600">
                        {capacity.remaining}
                        <span className="text-sm font-normal text-gray-400 ml-1">/ {activity.maxParticipants}</span>
                      </p>
                    </div>

                    {signupError && (
                      <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-sm text-danger-600 mb-4 flex items-center gap-2 animate-fade-in">
                        <XCircle className="w-4 h-4" />
                        {signupError}
                      </div>
                    )}

                    {signupSuccess ? (
                      <div className="p-3 bg-success-50 border border-success-500/20 rounded-lg text-sm text-success-600 mb-4 flex items-center gap-2 animate-fade-in">
                        <CheckCircle className="w-4 h-4" />
                        报名成功！
                      </div>
                    ) : null}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSignup}
                      disabled={!capacity.available}
                    >
                      <Users className="w-4 h-4" />
                      {capacity.available ? "立即报名" : "名额已满"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Badge variant={status.className.replace("badge-", "") as any}>
                      {status.label}
                    </Badge>
                  </div>
                )
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">已报名</p>
                      <p className="text-xl font-bold text-gray-900">{activity.currentParticipants}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">名额上限</p>
                      <p className="text-xl font-bold text-gray-900">{activity.maxParticipants}</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(activity.currentParticipants / activity.maxParticipants) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {activity.approvalComment && (
            <Card>
              <CardBody>
                <p className="text-sm text-gray-500 mb-1">审批意见</p>
                <p className="text-gray-700">{activity.approvalComment}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={showCheckinCode}
        onClose={() => setShowCheckinCode(false)}
        title="我的签到码"
      >
        {mySignup && (
          <CheckinCode code={mySignup.checkinCode} activityTitle={activity.title} />
        )}
      </Modal>
    </AppLayout>
  );
}
