import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useActivityStore } from "@/store/useActivityStore";
import { useVolunteerStore } from "@/store/useVolunteerStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  activityStatusMap,
  activityTypeMap,
  formatDateTime,
} from "@/utils/formatters";
import { checkSkillMatch } from "@/utils/validators";
import type { Activity } from "@/types";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "", label: "全部类型" },
  { value: "environmental", label: "环境保护" },
  { value: "educational", label: "教育支持" },
  { value: "elderly", label: "敬老助老" },
  { value: "community", label: "社区服务" },
  { value: "medical", label: "医疗辅助" },
  { value: "other", label: "其他活动" },
];

const statusOptions = [
  { value: "", label: "全部状态" },
  { value: "published", label: "招募中" },
  { value: "ongoing", label: "进行中" },
  { value: "completed", label: "已完成" },
  { value: "pending", label: "待审批" },
];

export function ActivityList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const activities = useActivityStore((s) => s.activities);
  const getSignupByVolunteerAndActivity = useActivityStore(
    (s) => s.getSignupByVolunteerAndActivity
  );
  const getVolunteerByUserId = useVolunteerStore((s) => s.getVolunteerByUserId);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const myProfile = useMemo(() => {
    if (currentUser?.role === "volunteer") {
      return getVolunteerByUserId(currentUser.id);
    }
    return undefined;
  }, [currentUser, getVolunteerByUserId]);

  const filteredActivities = useMemo(() => {
    let result = activities;

    if (currentUser?.role === "volunteer") {
      result = result.filter(
        (a) => a.status === "published" || a.status === "ongoing" || a.status === "completed"
      );
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(s) ||
          a.location.toLowerCase().includes(s) ||
          a.description.toLowerCase().includes(s)
      );
    }

    if (typeFilter) {
      result = result.filter((a) => a.type === typeFilter);
    }

    if (statusFilter) {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activities, search, typeFilter, statusFilter, currentUser]);

  return (
    <AppLayout title="活动列表">
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索活动名称、地点..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-3">
              <div className="w-40">
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={typeOptions}
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
          </div>
        </CardBody>
      </Card>

      {filteredActivities.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center">
            <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">没有找到匹配的活动</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredActivities.map((activity: Activity) => {
            const status = activityStatusMap[activity.status];
            const progress = (activity.currentParticipants / activity.maxParticipants) * 100;
            const isFull = activity.currentParticipants >= activity.maxParticipants;

            const mySignup = myProfile
              ? getSignupByVolunteerAndActivity(myProfile.id, activity.id)
              : undefined;

            let skillInfo = null;
            if (myProfile && activity.skillRequirements.length > 0) {
              skillInfo = checkSkillMatch(myProfile.skills, activity.skillRequirements);
            }

            return (
              <Card
                key={activity.id}
                hover
                className="cursor-pointer animate-slide-up"
                onClick={() => navigate(`/activities/${activity.id}`)}
              >
                <CardBody>
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="primary">{activityTypeMap[activity.type]}</Badge>
                    <Badge variant={status.className.replace("badge-", "") as any}>
                      {status.label}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {activity.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{activity.description}</p>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDateTime(activity.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="line-clamp-1">{activity.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>
                        {activity.currentParticipants}/{activity.maxParticipants} 人报名
                      </span>
                    </div>
                  </div>

                  {activity.skillRequirements.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1.5">技能要求：</p>
                      <div className="flex flex-wrap gap-1.5">
                        {activity.skillRequirements.map((skill) => {
                          const hasSkill = skillInfo?.matchedSkills.includes(skill);
                          return (
                            <Badge
                              key={skill}
                              variant={hasSkill ? "success" : myProfile ? "warning" : "gray"}
                              className="text-[10px]"
                            >
                              {skill}
                              {hasSkill && " ✓"}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-500">报名进度</span>
                      <span className={cn("font-medium", isFull ? "text-danger-500" : "text-primary-600")}>
                        {isFull ? "已满" : `剩余 ${activity.maxParticipants - activity.currentParticipants} 名额`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isFull ? "bg-danger-500" : "bg-primary-500"
                        )}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    {mySignup ? (
                      <Badge variant="success" className="gap-1">
                        <UserPlus className="w-3 h-3" />
                        已报名
                      </Badge>
                    ) : (
                      <span className="text-xs text-gray-400">点击查看详情</span>
                    )}
                    <Button variant="ghost" size="sm" className="!p-0 !h-auto">
                      详情 <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
