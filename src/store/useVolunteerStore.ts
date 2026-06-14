import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VolunteerProfile, VolunteerStatus } from "@/types";
import { mockVolunteers } from "@/mock/data";
import { generateId } from "@/utils/generators";
import { validateIdCard, validateAge, validateEmergencyContact } from "@/utils/validators";

interface VolunteerState {
  volunteers: VolunteerProfile[];
  addVolunteer: (data: {
    userId: string;
    realName: string;
    idCard: string;
    gender: "male" | "female";
    emergencyContact: string;
    emergencyPhone: string;
    skills: string[];
  }) => { success: boolean; volunteerId?: string; errors?: Record<string, string> };
  updateVolunteerStatus: (id: string, status: VolunteerStatus) => void;
  getVolunteerByUserId: (userId: string) => VolunteerProfile | undefined;
  getVolunteerById: (id: string) => VolunteerProfile | undefined;
  getApprovedVolunteers: () => VolunteerProfile[];
  getPendingVolunteers: () => VolunteerProfile[];
  incrementHours: (volunteerId: string, hours: number) => void;
  incrementActivityCount: (volunteerId: string) => void;
}

export const useVolunteerStore = create<VolunteerState>()(
  persist(
    (set, get) => ({
      volunteers: mockVolunteers,

      addVolunteer: (data) => {
        const errors: Record<string, string> = {};

        const idCardResult = validateIdCard(data.idCard);
        if (!idCardResult.valid) {
          errors.idCard = idCardResult.message || "身份证号格式错误";
        }

        if (idCardResult.birthDate) {
          const ageResult = validateAge(idCardResult.birthDate);
          if (!ageResult.valid) {
            errors.age = ageResult.message || "年龄不符合要求";
          }
        }

        const contactResult = validateEmergencyContact(
          data.emergencyContact,
          data.emergencyPhone
        );
        if (!contactResult.valid) {
          errors.emergencyContact = contactResult.message || "紧急联系人信息不完整";
        }

        if (Object.keys(errors).length > 0) {
          return { success: false, errors };
        }

        const volunteer: VolunteerProfile = {
          id: generateId(),
          userId: data.userId,
          realName: data.realName,
          idCard: data.idCard,
          birthDate: idCardResult.birthDate!.toISOString().split("T")[0],
          age: idCardResult.age!,
          gender: data.gender,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          skills: data.skills,
          status: "pending",
          totalHours: 0,
          activityCount: 0,
        };

        set({ volunteers: [...get().volunteers, volunteer] });
        return { success: true, volunteerId: volunteer.id };
      },

      updateVolunteerStatus: (id, status) => {
        set({
          volunteers: get().volunteers.map((v) =>
            v.id === id ? { ...v, status } : v
          ),
        });
      },

      getVolunteerByUserId: (userId) => {
        return get().volunteers.find((v) => v.userId === userId);
      },

      getVolunteerById: (id) => {
        return get().volunteers.find((v) => v.id === id);
      },

      getApprovedVolunteers: () => {
        return get().volunteers.filter((v) => v.status === "approved");
      },

      getPendingVolunteers: () => {
        return get().volunteers.filter((v) => v.status === "pending");
      },

      incrementHours: (volunteerId, hours) => {
        set({
          volunteers: get().volunteers.map((v) =>
            v.id === volunteerId ? { ...v, totalHours: v.totalHours + hours } : v
          ),
        });
      },

      incrementActivityCount: (volunteerId) => {
        set({
          volunteers: get().volunteers.map((v) =>
            v.id === volunteerId ? { ...v, activityCount: v.activityCount + 1 } : v
          ),
        });
      },
    }),
    {
      name: "volunteer-profile-storage",
    }
  )
);
