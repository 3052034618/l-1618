import { ActivityType, ActivityStatus, SignupStatus, UserRole, VolunteerStatus } from "@/types";

export function formatDate(date: string | Date, format: string = "YYYY-MM-DD"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return format
    .replace("YYYY", String(year))
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes);
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "YYYY-MM-DD HH:mm");
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 10) return idCard;
  return idCard.substring(0, 4) + "**********" + idCard.substring(idCard.length - 4);
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 11) return phone;
  return phone.substring(0, 3) + "****" + phone.substring(phone.length - 4);
}

export const activityTypeMap: Record<ActivityType, string> = {
  environmental: "环境保护",
  educational: "教育支持",
  elderly: "敬老助老",
  community: "社区服务",
  medical: "医疗辅助",
  other: "其他活动",
};

export const activityStatusMap: Record<ActivityStatus, { label: string; className: string }> = {
  pending: { label: "待审批", className: "badge-warning" },
  approved: { label: "已批准", className: "badge-primary" },
  rejected: { label: "已拒绝", className: "badge-danger" },
  published: { label: "招募中", className: "badge-success" },
  ongoing: { label: "进行中", className: "badge-primary" },
  completed: { label: "已完成", className: "badge-gray" },
};

export const signupStatusMap: Record<SignupStatus, { label: string; className: string }> = {
  confirmed: { label: "已报名", className: "badge-primary" },
  cancelled: { label: "已取消", className: "badge-gray" },
  checked_in: { label: "已签到", className: "badge-success" },
  completed: { label: "已完成", className: "badge-gray" },
};

export const roleMap: Record<UserRole, string> = {
  volunteer: "志愿者",
  organizer: "活动组织者",
  admin: "系统管理员",
};

export const volunteerStatusMap: Record<VolunteerStatus, { label: string; className: string }> = {
  pending: { label: "待审核", className: "badge-warning" },
  approved: { label: "已通过", className: "badge-success" },
  rejected: { label: "已拒绝", className: "badge-danger" },
};

export function calcHoursBetween(start: string | Date, end: string | Date): number {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const diff = e.getTime() - s.getTime();
  return Math.max(0, Math.round((diff / (1000 * 60 * 60)) * 10) / 10);
}
