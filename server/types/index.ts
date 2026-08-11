export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type FitnessGoal = 'strength' | 'weight_loss' | 'fitness' | 'mobility' | 'wellness';

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  fitnessGoal?: FitnessGoal;
  emergencyContact?: EmergencyContact;
  createdAt: string;
  updatedAt: string;
}

export type PlanStatus = 'active' | 'inactive';

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  durationMonths: number;
  pricePaise: number;
  features: string[];
  status: PlanStatus;
  createdAt: string;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface MemberSubscription {
  id: string;
  memberId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  createdAt: string;
}

export type TrainerStatus = 'active' | 'inactive';

export interface Trainer {
  id: string;
  name: string;
  specialization: string;
  experienceYears: number;
  bio: string;
  status: TrainerStatus;
  avatar: string;
  createdAt: string;
}

export type ClassCategory = 'Strength' | 'Cardio' | 'Yoga' | 'HIIT' | 'Mobility' | 'Pilates' | 'Functional' | 'Recovery';
export type ClassStatus = 'scheduled' | 'cancelled' | 'completed';

export interface FitnessClass {
  id: string;
  name: string;
  description: string;
  category: ClassCategory;
  trainerId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  location: string;
  status: ClassStatus;
  createdAt: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  classId: string;
  memberId: string;
  status: BookingStatus;
  bookedAt: string;
  cancelledAt: string | null;
}

export type AttendanceStatus = 'present' | 'absent' | 'no_show';

export interface Attendance {
  id: string;
  memberId: string;
  classId: string;
  bookingId: string;
  status: AttendanceStatus;
  checkedInAt: string;
  recordedAt: string;
}

export type PaymentStatus = 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  memberId: string;
  membershipId: string;
  amountPaise: number;
  currency: 'INR';
  status: PaymentStatus;
  method: string;
  description: string;
  createdAt: string;
}

export type ActivityType = 'workout' | 'class' | 'cardio' | 'strength' | 'mobility';

export interface Activity {
  id: string;
  memberId: string;
  type: ActivityType;
  durationMinutes: number;
  calories: number;
  date: string;
  source: 'simulated';
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

export type AuditAction =
  | 'SIGNUP'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PROFILE_UPDATE'
  | 'MEMBERSHIP_PURCHASE'
  | 'MEMBERSHIP_RENEWAL'
  | 'CLASS_BOOKED'
  | 'CLASS_CANCELLED'
  | 'ATTENDANCE_RECORDED'
  | 'MEMBER_SUSPENDED'
  | 'MEMBER_ACTIVATED'
  | 'CLASS_CREATED'
  | 'CLASS_UPDATED'
  | 'CLASS_DELETED'
  | 'TRAINER_CREATED'
  | 'TRAINER_UPDATED'
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface RuntimeData {
  users: User[];
  memberProfiles: MemberProfile[];
  membershipPlans: MembershipPlan[];
  memberships: MemberSubscription[];
  trainers: Trainer[];
  classes: FitnessClass[];
  bookings: Booking[];
  attendance: Attendance[];
  payments: Payment[];
  activities: Activity[];
  sessions: Session[];
  auditLogs: AuditLog[];
  metadata: {
    initializedAt: string;
    version: string;
  };
}
