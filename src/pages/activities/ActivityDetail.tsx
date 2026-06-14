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
import { cn } from "@/lib/utils";

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
  const checkinByCode = useActivityStore((s) => s.checkinByCode);
  const startActivity = useActivityStore((s) => s.startActivity);
  const completeActivity = useActivityStore((s) => s.completeActivity);
  const incrementHours = useVolunteerStore((s) => s.incrementHours);
  const incrementActivityCount = useVolunteerStore((s) => s.incrementActivityCount);
  const getVolunteerById = useVolunteerStore((s) => s.getVolunteerById);
  const getVolunteerByUserId = useVolunteerStore((s) => s.getVolunteerByUserId);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const getRequisitionsByActivity = useMaterialStore((s) => s.getRequisitionsByActivity);
  const getMaterialById = useMaterialStore((s) => s.getMaterialById);
  const users = useAuthStore((s) => s.users);

  const activity = id ? getActivityById(id) : undefined;
  const [showCheckinCode, setShowCheckinCode] = useState(false);
  const [showCodeCheckin, setShowCodeCheckin] = useState(false);
  const [checkinCodeInput, setCheckinCodeInput] = useState("");
  const [codeCheckinMessage, setCodeCheckinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
      content: `您已成功报名《${activity.title}》，请准时参加。活动开始前24小时将发送签到提醒。`,
    });

    setSignupSuccess(true);
  };

  const handleStart = () => {
    if (confirm("确定要开始该活动吗？开始后志愿者可以进行签到。")) {
      startActivity(activity.id);
      activitySignups.forEach((signup) => {
        const vol = getVolunteerById(signup.volunteerId);
        if (vol && signup.status === "confirmed") {
          const volUser = users.find((u) => u.id === vol.userId);
          if (volUser) {
            addNotification({
              userId: volUser.id,
              type: "checkin",
              title: "活动已开始",
              content: `《${activity.title}》已开始，请尽快前往签到处完成签到。您的签到码：${signup.checkinCode}`,
            });
          }
        }
      });
    }
  };

  const handleCheckin = (signupId: string) => {
    const signup = activitySignups.find((s) => s.id === signupId);
    checkinVolunteer(signupId);
    if (signup) {
      const vol = getVolunteerById(signup.volunteerId);
      if (vol) {
        const volUser = users.find((u) => u.id === vol.userId);
        if (volUser) {
          addNotification({
            userId: volUser.id,
            type: "checkin",
            title: "签到成功",
            content: `您已成功完成《${activity.title}》的签到，祝您服务愉快！`,
          });
        }
      }
    }
  };

  const handleCodeCheckin = () => {
    if (!checkinCodeInput.trim()) {
      setCodeCheckinMessage({ type: "error", text: "请输入签到码" });
      return;
    }
    const result = checkinByCode(activity.id, checkinCodeInput.trim());
    if (result.success) {
      setCodeCheckinMessage({ type: "success", text: `签到成功！志愿者：${result.volunteerName}` });
      setCheckinCodeInput("");
      setTimeout(() => setCodeCheckinMessage(null), 2000);
    } else {
      setCodeCheckinMessage({ type: "error", text: result.message || "签到失败" });
    }
  };

  const handleComplete = () => {
    const checkedInCount = activitySignups.filter((s) => s.status === "checked_in").length;
    if (!confirm(`确定要结束该活动吗？\n\n已签到人数：${checkedInCount} 人\n结束后将只为已签到的志愿者累计工时并生成证书。`)) {
      return;
    }
    const result = completeActivity(activity.id);
    if (result.success) {
      activitySignups.forEach((signup) => {
        if (signup.status === "checked_in") {
          incrementHours(signup.volunteerId, hours);
          const vol = getVolunteerById(signup.volunteerId);
          if (vol) {
            const volUser = users.find((u) => u.id === vol.userId);
            if (volUser) {
              addNotification({
                userId: volUser.id,
                type: "activity",
                title: "活动已完成",
                content: `《${activity.title}》已结束，您获得了 ${hours} 小时服务时长，证书已生成。`,
              });
            }
          }
        } else if (signup.status === "confirmed") {
          const vol = getVolunteerById(signup.volunteerId);
          if (vol) {
            const volUser = users.find((u) => u.id === vol.userId);
            if (volUser) {
              addNotification({
                userId: volUser.id,
                type: "activity",
                title: "活动已结束",
                content: `《${activity.title}》已结束，因您未到场签到，本次活动不计入工时和证书。`,
              });
            }
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
                {currentUser?.role !== "volunteer" && (
                  <div className="flex gap-2">
                    {activity.status === "published" && (
                      <Button variant="primary" onClick={handleStart}>
                        开始活动
                      </Button>
                    )}
                    {activity.status === "ongoing" && (
                      <>
                        <Button variant="secondary" onClick={() => setShowCodeCheckin(true)}>
                          <QrCode className="w-4 h-4" />
                          扫码签到
                        </Button>
                        <Button variant="primary" onClick={handleComplete}>
                          结束活动
                        </Button>
                      </>
                    )}
                  </div>
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
                    <p className="text-xs text-danger-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      技能不匹配，无法报名。缺少：{skillInfo.missingSkills.join("、")}
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
                      <div className={cn(
                        "rounded-lg p-4 mb-4",
                        activity.status === "ongoing" ? "bg-success-50 border border-success-200" : "bg-gray-50"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-500">您的签到码</p>
                          {activity.status === "ongoing" && mySignup.status === "confirmed" && (
                            <Badge variant="success">活动进行中，请签到</Badge>
                          )}
                          {mySignup.status === "checked_in" && (
                            <Badge variant="success">已签到</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <QrCode className={cn(
                            "w-8 h-8",
                            mySignup.status === "checked_in" ? "text-success-600" : "text-primary-600"
                          )} />
                          <p className={cn(
                            "text-2xl font-mono font-bold tracking-widest",
                            mySignup.status === "checked_in" ? "text-success-600" : "text-primary-600"
                          )}>
                            {mySignup.checkinCode}
                          </p>
                        </div>
                        {activity.status === "ongoing" && mySignup.status === "confirmed" && (
                          <p className="text-xs text-center text-success-700 mt-2">
                            请向组织者出示此签到码完成签到
                          </p>
                        )}
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
                      disabled={!capacity.available || (!!skillInfo && !skillInfo.matched)}
                    >
                      <Users className="w-4 h-4" />
                      {!capacity.available
                        ? "名额已满"
                        : skillInfo && !skillInfo.matched
                        ? "技能不匹配"
                        : "立即报名"}
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

      <Modal
        isOpen={showCodeCheckin}
        onClose={() => {
          setShowCodeCheckin(false);
          setCheckinCodeInput("");
          setCodeCheckinMessage(null);
        }}
        title="扫码签到"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            请输入志愿者出示的6位签到码，或直接在上方报名列表中点击"签到"按钮。
          </p>
          <div>
            <label className="form-label">签到码</label>
            <input
              type="text"
              value={checkinCodeInput}
              onChange={(e) => setCheckinCodeInput(e.target.value.toUpperCase())}
              placeholder="请输入6位签到码"
              maxLength={6}
              className="form-input text-center text-2xl font-mono tracking-widest uppercase"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCodeCheckin();
              }}
            />
          </div>
          {codeCheckinMessage && (
            <div
              className={cn(
                "p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in",
                codeCheckinMessage.type === "success"
                  ? "bg-success-50 border border-success-200 text-success-700"
                  : "bg-danger-50 border border-danger-200 text-danger-700"
              )}
            >
              {codeCheckinMessage.type === "success" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              )}
              {codeCheckinMessage.text}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCodeCheckin(false);
                setCheckinCodeInput("");
                setCodeCheckinMessage(null);
              }}
            >
              关闭
            </Button>
            <Button onClick={handleCodeCheckin}>
              <CheckCircle className="w-4 h-4" />
              确认签到
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
