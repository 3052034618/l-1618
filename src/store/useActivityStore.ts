import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Activity, Signup, ServiceHours, Certificate, ActivityStatus, SignupStatus } from "@/types";
import { mockActivities, mockSignups, mockServiceHours, mockCertificates } from "@/mock/data";
import { generateId, generateCheckinCode, generateCertificateNo, getNowISOString } from "@/utils/generators";
import { checkCapacity, checkSkillMatch } from "@/utils/validators";
import { calcHoursBetween } from "@/utils/formatters";
import { useVolunteerStore } from "./useVolunteerStore";
import { useNotificationStore } from "./useNotificationStore";
import { useAuthStore } from "./useAuthStore";

interface ActivityState {
  activities: Activity[];
  signups: Signup[];
  serviceHours: ServiceHours[];
  certificates: Certificate[];
  sentReminderSignupIds: string[];

  createActivity: (data: Omit<Activity, "id" | "status" | "createdAt" | "currentParticipants">) => string;
  approveActivity: (activityId: string, approverId: string, comment?: string) => { activityTitle: string; organizerId: string };
  rejectActivity: (activityId: string, approverId: string, comment?: string) => { activityTitle: string; organizerId: string };
  escalatePendingActivities: () => Activity[];

  signupActivity: (
    activityId: string,
    volunteerId: string,
    volunteerSkills: string[]
  ) => { success: boolean; message?: string; signupId?: string; missingSkills?: string[] };

  getSignupByVolunteerAndActivity: (
    volunteerId: string,
    activityId: string
  ) => Signup | undefined;

  getSignupsByActivity: (activityId: string) => Signup[];
  getSignupsByVolunteer: (volunteerId: string) => Signup[];

  checkinVolunteer: (signupId: string) => void;
  checkinByCode: (activityId: string, code: string) => { success: boolean; message?: string; volunteerName?: string };
  startActivity: (activityId: string) => void;
  completeActivity: (activityId: string) => { success: boolean; completedCount: number; message?: string };
  checkAndSendCheckinReminders: () => number;

  getPublishedActivities: () => Activity[];
  getPendingActivities: () => Activity[];
  getActivityById: (id: string) => Activity | undefined;

  getCertificatesByVolunteer: (volunteerId: string) => Certificate[];
  getCertificateById: (id: string) => Certificate | undefined;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: mockActivities,
      signups: mockSignups,
      serviceHours: mockServiceHours,
      certificates: mockCertificates,
      sentReminderSignupIds: [],

      createActivity: (data) => {
        const activity: Activity = {
          id: generateId(),
          ...data,
          currentParticipants: 0,
          status: "pending",
          createdAt: getNowISOString(),
        };
        set({ activities: [...get().activities, activity] });
        return activity.id;
      },

      approveActivity: (activityId, approverId, comment) => {
        const activity = get().activities.find((a) => a.id === activityId);
        set({
          activities: get().activities.map((a) =>
            a.id === activityId
              ? {
                  ...a,
                  status: "published",
                  approvedAt: getNowISOString(),
                  approverId,
                  approvalComment: comment,
                }
              : a
          ),
        });
        return {
          activityTitle: activity?.title || "",
          organizerId: activity?.organizerId || "",
        };
      },

      rejectActivity: (activityId, approverId, comment) => {
        const activity = get().activities.find((a) => a.id === activityId);
        set({
          activities: get().activities.map((a) =>
            a.id === activityId
              ? {
                  ...a,
                  status: "rejected",
                  approvedAt: getNowISOString(),
                  approverId,
                  approvalComment: comment,
                }
              : a
          ),
        });
        return {
          activityTitle: activity?.title || "",
          organizerId: activity?.organizerId || "",
        };
      },

      escalatePendingActivities: () => {
        const now = Date.now();
        const fortyEightHours = 48 * 60 * 60 * 1000;
        const escalated: Activity[] = [];

        set({
          activities: get().activities.map((a) => {
            if (a.status === "pending" && !a.escalated) {
              const created = new Date(a.createdAt).getTime();
              if (now - created > fortyEightHours) {
                const updated = { ...a, escalated: true };
                escalated.push(updated);
                return updated;
              }
            }
            return a;
          }),
        });

        return escalated;
      },

      signupActivity: (activityId, volunteerId, volunteerSkills) => {
        const activity = get().activities.find((a) => a.id === activityId);
        if (!activity) {
          return { success: false, message: "活动不存在" };
        }
        if (activity.status !== "published") {
          return { success: false, message: "活动未开放报名" };
        }

        const capacity = checkCapacity(activity.currentParticipants, activity.maxParticipants);
        if (!capacity.available) {
          return { success: false, message: "活动名额已满" };
        }

        const existing = get().signups.find(
          (s) => s.activityId === activityId && s.volunteerId === volunteerId && s.status !== "cancelled"
        );
        if (existing) {
          return { success: false, message: "您已经报名过该活动" };
        }

        const skillMatch = checkSkillMatch(volunteerSkills, activity.skillRequirements);
        if (!skillMatch.matched) {
          return {
            success: false,
            message: `技能不匹配，缺少：${skillMatch.missingSkills.join("、")}`,
            missingSkills: skillMatch.missingSkills,
          };
        }

        const signup: Signup = {
          id: generateId(),
          volunteerId,
          activityId,
          status: "confirmed",
          checkinCode: generateCheckinCode(),
          skillMatched: true,
          signupTime: getNowISOString(),
        };

        set({
          signups: [...get().signups, signup],
          activities: get().activities.map((a) =>
            a.id === activityId
              ? { ...a, currentParticipants: a.currentParticipants + 1 }
              : a
          ),
        });

        return { success: true, signupId: signup.id };
      },

      getSignupByVolunteerAndActivity: (volunteerId, activityId) => {
        return get().signups.find(
          (s) =>
            s.volunteerId === volunteerId &&
            s.activityId === activityId &&
            s.status !== "cancelled"
        );
      },

      getSignupsByActivity: (activityId) => {
        return get().signups.filter((s) => s.activityId === activityId);
      },

      getSignupsByVolunteer: (volunteerId) => {
        return get().signups.filter((s) => s.volunteerId === volunteerId);
      },

      checkinVolunteer: (signupId) => {
        set({
          signups: get().signups.map((s) =>
            s.id === signupId
              ? { ...s, status: "checked_in", checkinTime: getNowISOString() }
              : s
          ),
        });
      },

      checkinByCode: (activityId, code) => {
        const signup = get().signups.find(
          (s) => s.activityId === activityId && s.checkinCode === code.toUpperCase()
        );
        if (!signup) {
          return { success: false, message: "签到码无效" };
        }
        if (signup.status === "checked_in" || signup.status === "completed") {
          return { success: false, message: "该签到码已使用过" };
        }
        if (signup.status === "cancelled") {
          return { success: false, message: "报名已取消" };
        }
        const activity = get().activities.find((a) => a.id === activityId);
        if (activity && activity.status !== "ongoing") {
          return { success: false, message: "活动尚未开始，无法签到" };
        }
        const volunteer = useVolunteerStore.getState().getVolunteerById(signup.volunteerId);
        set({
          signups: get().signups.map((s) =>
            s.id === signup.id
              ? { ...s, status: "checked_in", checkinTime: getNowISOString() }
              : s
          ),
        });
        return { success: true, volunteerName: volunteer?.realName };
      },

      startActivity: (activityId) => {
        const activity = get().activities.find((a) => a.id === activityId);
        if (!activity || activity.status !== "published") return;
        set({
          activities: get().activities.map((a) =>
            a.id === activityId ? { ...a, status: "ongoing" as ActivityStatus } : a
          ),
        });
      },

      completeActivity: (activityId) => {
        const activity = get().activities.find((a) => a.id === activityId);
        if (!activity) return { success: false, completedCount: 0, message: "活动不存在" };
        if (activity.status === "completed") {
          return { success: false, completedCount: 0, message: "活动已结束" };
        }

        const hours = calcHoursBetween(activity.startTime, activity.endTime);
        const activitySignups = get().signups.filter(
          (s) => s.activityId === activityId && s.status === "checked_in"
        );

        const newServiceHours: ServiceHours[] = [];
        const newCertificates: Certificate[] = [];
        const updatedSignupIds: string[] = [];

        activitySignups.forEach((signup) => {
          newServiceHours.push({
            id: generateId(),
            volunteerId: signup.volunteerId,
            activityId,
            hours,
            serviceDate: activity.startTime.split("T")[0],
          });
          newCertificates.push({
            id: generateId(),
            volunteerId: signup.volunteerId,
            activityId,
            certificateNo: generateCertificateNo(),
            hours,
            issueDate: getNowISOString(),
          });
          updatedSignupIds.push(signup.id);
        });

        set({
          activities: get().activities.map((a) =>
            a.id === activityId ? { ...a, status: "completed" as ActivityStatus } : a
          ),
          signups: get().signups.map((s) =>
            updatedSignupIds.includes(s.id)
              ? { ...s, status: "completed" as SignupStatus }
              : s
          ),
          serviceHours: [...get().serviceHours, ...newServiceHours],
          certificates: [...get().certificates, ...newCertificates],
        });

        return {
          success: true,
          completedCount: activitySignups.length,
          message: `已为 ${activitySignups.length} 位已签到志愿者累计工时并生成证书`,
        };
      },

      checkAndSendCheckinReminders: () => {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const sentReminders = new Set(get().sentReminderSignupIds);
        const newlySent: string[] = [];

        const activitiesToRemind = get().activities.filter(
          (a) => a.status === "published" || a.status === "ongoing"
        );

        activitiesToRemind.forEach((activity) => {
          const startTime = new Date(activity.startTime).getTime();
          const diffToStart = startTime - now;

          if (diffToStart > 0 && diffToStart <= twentyFourHours) {
            const activitySignups = get()
              .signups.filter((s) => s.activityId === activity.id && s.status === "confirmed");

            activitySignups.forEach((signup) => {
              if (!sentReminders.has(signup.id)) {
                const volunteer = useVolunteerStore.getState().getVolunteerById(signup.volunteerId);
                if (volunteer) {
                  const volunteerUser = useAuthStore
                    .getState()
                    .users.find((u) => u.id === volunteer.userId);
                  if (volunteerUser) {
                    useNotificationStore.getState().addNotification({
                      userId: volunteerUser.id,
                      type: "checkin",
                      title: "活动签到提醒",
                      content: `《${activity.title}》将于24小时内开始，请准时参加。\n活动地点：${activity.location}\n您的签到码：${signup.checkinCode}`,
                    });
                    newlySent.push(signup.id);
                  }
                }
              }
            });
          }
        });

        if (newlySent.length > 0) {
          set({
            sentReminderSignupIds: [...get().sentReminderSignupIds, ...newlySent],
          });
        }

        return newlySent.length;
      },

      getPublishedActivities: () => {
        return get().activities.filter((a) => a.status === "published");
      },

      getPendingActivities: () => {
        return get().activities.filter((a) => a.status === "pending");
      },

      getActivityById: (id) => {
        return get().activities.find((a) => a.id === id);
      },

      getCertificatesByVolunteer: (volunteerId) => {
        return get().certificates.filter((c) => c.volunteerId === volunteerId);
      },

      getCertificateById: (id) => {
        return get().certificates.find((c) => c.id === id);
      },
    }),
    {
      name: "volunteer-activity-storage",
    }
  )
);
