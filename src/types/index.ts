export type UserRole = "volunteer" | "organizer" | "admin";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  email: string;
  phone: string;
  createdAt: string;
}

export type VolunteerStatus = "pending" | "approved" | "rejected";

export interface VolunteerProfile {
  id: string;
  userId: string;
  realName: string;
  idCard: string;
  birthDate: string;
  age: number;
  gender: "male" | "female";
  emergencyContact: string;
  emergencyPhone: string;
  skills: string[];
  status: VolunteerStatus;
  totalHours: number;
  activityCount: number;
}

export type ActivityStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "published"
  | "ongoing"
  | "completed";

export type ActivityType =
  | "environmental"
  | "educational"
  | "elderly"
  | "community"
  | "medical"
  | "other";

export interface Activity {
  id: string;
  organizerId: string;
  title: string;
  type: ActivityType;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  currentParticipants: number;
  description: string;
  skillRequirements: string[];
  status: ActivityStatus;
  createdAt: string;
  approvedAt?: string;
  approverId?: string;
  approvalComment?: string;
  escalated?: boolean;
}

export type SignupStatus = "confirmed" | "cancelled" | "checked_in" | "completed";

export interface Signup {
  id: string;
  volunteerId: string;
  activityId: string;
  status: SignupStatus;
  checkinCode: string;
  skillMatched: boolean;
  signupTime: string;
  checkinTime?: string;
}

export interface ServiceHours {
  id: string;
  volunteerId: string;
  activityId: string;
  hours: number;
  serviceDate: string;
}

export interface Certificate {
  id: string;
  volunteerId: string;
  activityId: string;
  certificateNo: string;
  hours: number;
  issueDate: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  unit: string;
  warning: boolean;
}

export interface MaterialRequisition {
  id: string;
  activityId: string;
  materialId: string;
  quantity: number;
  requisitionTime: string;
}

export type NotificationType =
  | "approval"
  | "activity"
  | "checkin"
  | "stock"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface IdCardValidationResult extends ValidationResult {
  birthDate?: Date;
  age?: number;
}

export interface SkillMatchResult {
  matched: boolean;
  matchedSkills: string[];
  missingSkills: string[];
}

export interface CapacityCheckResult {
  available: boolean;
  remaining: number;
}

export interface StockCheckResult {
  isWarning: boolean;
  diff: number;
}

export interface ActivityStats {
  activityType: string;
  count: number;
  totalHours: number;
}

export interface VolunteerStats {
  volunteerId: string;
  volunteerName: string;
  activityCount: number;
  totalHours: number;
  participationRate: number;
}

export interface MonthlyReport {
  month: string;
  totalActivities: number;
  totalVolunteers: number;
  totalHours: number;
  avgHoursPerVolunteer: number;
  participationRate: number;
  byType: ActivityStats[];
  topVolunteers: VolunteerStats[];
}
