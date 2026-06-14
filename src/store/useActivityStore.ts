import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Activity, Signup, ServiceHours, Certificate, ActivityStatus, SignupStatus } from "@/types";
import { mockActivities, mockSignups, mockServiceHours, mockCertificates } from "@/mock/data";
import { generateId, generateCheckinCode, generateCertificateNo, getNowISOString } from "@/utils/generators";
import { checkCapacity, checkSkillMatch } from "@/utils/validators";
import { calcHoursBetween } from "@/utils/formatters";

interface ActivityState {
  activities: Activity[];
  signups: Signup[];
  serviceHours: ServiceHours[];
  certificates: Certificate[];

  createActivity: (data: Omit<Activity, "id" | "status" | "createdAt" | "currentParticipants">) => string;
  approveActivity: (activityId: string, approverId: string, comment?: string) => void;
  rejectActivity: (activityId: string, approverId: string, comment?: string) => void;
  escalatePendingActivities: () => Activity[];

  signupActivity: (
    activityId: string,
    volunteerId: string,
    volunteerSkills: string[]
  ) => { success: boolean; message?: string; signupId?: string };

  getSignupByVolunteerAndActivity: (
    volunteerId: string,
    activityId: string
  ) => Signup | undefined;

  getSignupsByActivity: (activityId: string) => Signup[];
  getSignupsByVolunteer: (volunteerId: string) => Signup[];

  checkinVolunteer: (signupId: string) => void;
  completeActivity: (activityId: string) => void;

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
      },

      rejectActivity: (activityId, approverId, comment) => {
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

        const signup: Signup = {
          id: generateId(),
          volunteerId,
          activityId,
          status: "confirmed",
          checkinCode: generateCheckinCode(),
          skillMatched: skillMatch.matched,
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

      completeActivity: (activityId) => {
        const activity = get().activities.find((a) => a.id === activityId);
        if (!activity) return;

        const hours = calcHoursBetween(activity.startTime, activity.endTime);
        const activitySignups = get()
          .signups.filter(
            (s) =>
              s.activityId === activityId &&
              (s.status === "checked_in" || s.status === "confirmed")
          );

        const newServiceHours: ServiceHours[] = [];
        const newCertificates: Certificate[] = [];
        const updatedSignupIds: string[] = [];

        activitySignups.forEach((signup) => {
          if (signup.status === "checked_in" || signup.status === "confirmed") {
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
          }
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
