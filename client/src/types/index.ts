export type UserRole = 'member' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  md5Hash?: string;
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
  plan?: MembershipPlan;
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
  trainer?: Trainer;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Booking {
  id: string;
  classId: string;
  memberId: string;
  status: BookingStatus;
  bookedAt: string;
  cancelledAt: string | null;
  fitnessClass?: FitnessClass;
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
  fitnessClass?: FitnessClass;
  memberUser?: User;
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
  memberUser?: User;
  membershipPlan?: MembershipPlan;
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

export interface SystemInfo {
  application: string;
  mode: string;
  status: string;
  persistence: string;
  apiGroups: number;
  version: string;
  uptime: number;
  stats: {
    totalUsers: number;
    activeMembers: number;
    activePlans: number;
    totalClasses: number;
    totalBookings: number;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
