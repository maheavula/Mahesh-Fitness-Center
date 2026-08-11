import bcrypt from 'bcryptjs';
import { persistenceService } from './persistenceService.js';
import {
  User,
  MemberProfile,
  MembershipPlan,
  Trainer,
  FitnessClass,
  MemberSubscription,
  Booking,
  Attendance,
  Payment,
  Activity,
  AuditLog,
  RuntimeData
} from '../types/index.js';

export async function ensureSeededData(): Promise<void> {
  const data = await persistenceService.getData();

  // If already seeded with users, return
  if (data.users.length > 0) {
    return;
  }

  console.log('Seeding initial Mahesh Fitness Center demo data into runtime.json...');

  const now = new Date().toISOString();
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const memberPasswordHash = await bcrypt.hash('Member@12345', 10);
  const defaultUserPasswordHash = await bcrypt.hash('Fitness@123', 10);

  // 1. Users & Profiles
  const adminUser: User = {
    id: 'USR-10000',
    name: 'Mahesh Center Administrator',
    email: 'admin@maheshfitness.local',
    phone: '+919876543210',
    passwordHash: adminPasswordHash,
    role: 'admin',
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  };

  const demoMemberUser: User = {
    id: 'USR-10001',
    name: 'Mahesh Kumar',
    email: 'member@maheshfitness.local',
    phone: '+919123456789',
    passwordHash: memberPasswordHash,
    role: 'member',
    status: 'active',
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: now,
    lastLoginAt: now
  };

  const demoMemberProfile: MemberProfile = {
    id: 'MEM-10001',
    userId: 'USR-10001',
    dateOfBirth: '1998-05-15',
    gender: 'Male',
    heightCm: 178,
    fitnessGoal: 'strength',
    emergencyContact: {
      name: 'Ramesh Kumar',
      phone: '+919888877777'
    },
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: now
  };

  // Additional 8 demo members
  const memberNames = [
    { name: 'Priya Sharma', email: 'priya.s@example.com', phone: '+919876500001', goal: 'fitness' as const },
    { name: 'Ananya Verma', email: 'ananya.v@example.com', phone: '+919876500002', goal: 'weight_loss' as const },
    { name: 'Vikram Singh', email: 'vikram.s@example.com', phone: '+919876500003', goal: 'strength' as const },
    { name: 'Rahul Mehta', email: 'rahul.m@example.com', phone: '+919876500004', goal: 'mobility' as const },
    { name: 'Sneha Patel', email: 'sneha.p@example.com', phone: '+919876500005', goal: 'wellness' as const },
    { name: 'Rohan Gupta', email: 'rohan.g@example.com', phone: '+919876500006', goal: 'strength' as const },
    { name: 'Kavita Reddy', email: 'kavita.r@example.com', phone: '+919876500007', goal: 'fitness' as const },
    { name: 'Arjun Nambiar', email: 'arjun.n@example.com', phone: '+919876500008', goal: 'weight_loss' as const },
  ];

  const extraUsers: User[] = [];
  const extraProfiles: MemberProfile[] = [];

  memberNames.forEach((m, idx) => {
    const userId = `USR-1000${idx + 2}`;
    const memId = `MEM-1000${idx + 2}`;
    extraUsers.push({
      id: userId,
      name: m.name,
      email: m.email,
      phone: m.phone,
      passwordHash: defaultUserPasswordHash,
      role: 'member',
      status: 'active',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: now
    });
    extraProfiles.push({
      id: memId,
      userId: userId,
      dateOfBirth: '1995-08-20',
      gender: idx % 2 === 0 ? 'Female' : 'Male',
      heightCm: 165 + (idx * 2),
      fitnessGoal: m.goal,
      emergencyContact: {
        name: 'Family Contact',
        phone: '+919000011111'
      },
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: now
    });
  });

  const users = [adminUser, demoMemberUser, ...extraUsers];
  const memberProfiles = [demoMemberProfile, ...extraProfiles];

  // 2. Membership Plans
  const plans: MembershipPlan[] = [
    {
      id: 'PLAN-10001',
      name: 'Basic Access',
      description: 'Essential gym floor access with basic locker facilities.',
      durationMonths: 1,
      pricePaise: 249900, // ₹2,499.00
      features: ['Full Gym Access', 'Standard Locker Facilities', 'Shower Room Access', 'Basic Orientation'],
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'PLAN-10002',
      name: 'Premium',
      description: 'Our most popular plan with complete access to group classes and fitness assessments.',
      durationMonths: 3,
      pricePaise: 749900, // ₹7,499.00
      features: ['Full Gym Access', 'Unlimited Group Classes', 'Private Locker Access', 'Quarterly Body Assessment', 'Sauna Access'],
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'PLAN-10003',
      name: 'Elite VIP',
      description: 'Complete luxury membership including personal trainer sessions and priority bookings.',
      durationMonths: 12,
      pricePaise: 2499900, // ₹24,999.00
      features: ['Unlimited Class Booking', '24/7 Premium Gym Access', 'Personal Trainer Credits (4/mo)', 'Priority Booking Window', 'Complimentary Hydration Bar', 'VIP Guest Passes'],
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ];

  // 3. Subscriptions & Payments for Demo Member
  const demoSubscription: MemberSubscription = {
    id: 'SUB-10001',
    memberId: 'MEM-10001',
    planId: 'PLAN-10002', // Premium
    status: 'active',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-11-01T00:00:00.000Z',
    autoRenew: true,
    createdAt: '2026-06-01T00:00:00.000Z'
  };

  const demoPayment: Payment = {
    id: 'PAY-10001',
    memberId: 'MEM-10001',
    membershipId: 'SUB-10001',
    amountPaise: 749900,
    currency: 'INR',
    status: 'completed',
    method: 'simulated_card',
    description: '3-Month Premium Membership Subscription',
    createdAt: '2026-06-01T00:00:00.000Z'
  };

  // Subscriptions for extra members
  const extraSubscriptions: MemberSubscription[] = [];
  const extraPayments: Payment[] = [];

  extraProfiles.slice(0, 5).forEach((p, idx) => {
    const subId = `SUB-1000${idx + 2}`;
    const payId = `PAY-1000${idx + 2}`;
    const plan = plans[idx % plans.length];

    extraSubscriptions.push({
      id: subId,
      memberId: p.id,
      planId: plan.id,
      status: 'active',
      startDate: '2026-05-15T00:00:00.000Z',
      endDate: '2026-08-15T00:00:00.000Z',
      autoRenew: false,
      createdAt: '2026-05-15T00:00:00.000Z'
    });

    extraPayments.push({
      id: payId,
      memberId: p.id,
      membershipId: subId,
      amountPaise: plan.pricePaise,
      currency: 'INR',
      status: 'completed',
      method: idx % 2 === 0 ? 'simulated_upi' : 'simulated_card',
      description: `${plan.name} Subscription`,
      createdAt: '2026-05-15T00:00:00.000Z'
    });
  });

  const subscriptions = [demoSubscription, ...extraSubscriptions];
  const payments = [demoPayment, ...extraPayments];

  // 4. Trainers
  const trainers: Trainer[] = [
    {
      id: 'TRN-10001',
      name: 'Arjun Rao',
      specialization: 'Strength & Conditioning',
      experienceYears: 8,
      bio: 'Certified CSCS coach with passion for hyper-trophy, Olympic weightlifting, and mobility mechanics.',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'TRN-10002',
      name: 'Dr. Sunita Deshmukh',
      specialization: 'Yoga & Functional Mobility',
      experienceYears: 12,
      bio: 'Master of Ashtanga Yoga and spinal rehab. Specialized in posture correction and breathwork integration.',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'TRN-10003',
      name: 'Karan Kapoor',
      specialization: 'HIIT & Metabolic Conditioning',
      experienceYears: 6,
      bio: 'High-intensity conditioning coach focused on cardiovascular endurance and fat loss program design.',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'TRN-10004',
      name: 'Maya Lin',
      specialization: 'Pilates Core & Rehabilitation',
      experienceYears: 9,
      bio: 'Stott Pilates certified instructor with expertise in core stability, posture alignment, and dynamic balance.',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'TRN-10005',
      name: 'Kabir Fernandes',
      specialization: 'Boxing & Functional Cardio',
      experienceYears: 10,
      bio: 'Former state amateur boxer specializing in agility drills, heavy bag combinations, and explosive power.',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ];

  // 5. Classes
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const classes: FitnessClass[] = [
    {
      id: 'CLS-10001',
      name: 'Power Strength & Hypertrophy',
      description: 'Heavy compound barbell work targeting quads, chest, and posterior chain.',
      category: 'Strength',
      trainerId: 'TRN-10001',
      date: todayStr,
      startTime: '07:00',
      endTime: '08:00',
      capacity: 18,
      bookedCount: 14,
      location: 'Studio A (Weight Room)',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'CLS-10002',
      name: 'Morning Sunrise Yoga Flow',
      description: 'Gentle Vinyasa sequences combined with deep pranayama breathwork.',
      category: 'Yoga',
      trainerId: 'TRN-10002',
      date: todayStr,
      startTime: '08:30',
      endTime: '09:30',
      capacity: 25,
      bookedCount: 20,
      location: 'Zen Studio 2',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'CLS-10003',
      name: 'HIIT Fat Burn Circuit',
      description: 'Interval cardio training on rowers, assault bikes, and kettlebell complexes.',
      category: 'HIIT',
      trainerId: 'TRN-10003',
      date: todayStr,
      startTime: '18:00',
      endTime: '19:00',
      capacity: 20,
      bookedCount: 19,
      location: 'Main Turf Arena',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'CLS-10004',
      name: 'Core Sculpt Pilates',
      description: 'Mat-based Pilates focusing on abdominal hollow holds and oblique stability.',
      category: 'Pilates',
      trainerId: 'TRN-10004',
      date: tomorrowStr,
      startTime: '07:30',
      endTime: '08:30',
      capacity: 15,
      bookedCount: 10,
      location: 'Pilates Studio B',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'CLS-10005',
      name: 'Boxing Conditioning & Speed Work',
      description: 'Heavy bag drills, pad work, and footwork drills to boost metabolic conditioning.',
      category: 'Cardio',
      trainerId: 'TRN-10005',
      date: tomorrowStr,
      startTime: '17:30',
      endTime: '18:30',
      capacity: 16,
      bookedCount: 16, // Full class
      location: 'Combat Ring Studio',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'CLS-10006',
      name: 'Mobility & Foam Rolling Recovery',
      description: 'Targeted fascia release, hip openers, and shoulder dislocates for joint health.',
      category: 'Mobility',
      trainerId: 'TRN-10002',
      date: dayAfterStr,
      startTime: '09:00',
      endTime: '10:00',
      capacity: 20,
      bookedCount: 8,
      location: 'Zen Studio 2',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'CLS-10007',
      name: 'Functional Kettlebell Burn',
      description: 'Swings, clean & presses, and turkish get-ups to build real-world strength.',
      category: 'Functional',
      trainerId: 'TRN-10001',
      date: dayAfterStr,
      startTime: '18:30',
      endTime: '19:30',
      capacity: 18,
      bookedCount: 12,
      location: 'Main Turf Arena',
      status: 'scheduled',
      createdAt: '2026-08-01T00:00:00.000Z'
    }
  ];

  // 6. Bookings & Attendance
  const bookings: Booking[] = [
    {
      id: 'BOOK-10001',
      classId: 'CLS-10001',
      memberId: 'MEM-10001',
      status: 'confirmed',
      bookedAt: new Date(Date.now() - 172800000).toISOString(),
      cancelledAt: null
    },
    {
      id: 'BOOK-10002',
      classId: 'CLS-10003',
      memberId: 'MEM-10001',
      status: 'confirmed',
      bookedAt: new Date(Date.now() - 86400000).toISOString(),
      cancelledAt: null
    },
    {
      id: 'BOOK-10003',
      classId: 'CLS-10002',
      memberId: 'MEM-10002',
      status: 'confirmed',
      bookedAt: new Date(Date.now() - 86400000).toISOString(),
      cancelledAt: null
    }
  ];

  const attendance: Attendance[] = [
    {
      id: 'ATT-10001',
      memberId: 'MEM-10001',
      classId: 'CLS-10001',
      bookingId: 'BOOK-10001',
      status: 'present',
      checkedInAt: `${todayStr}T06:55:00.000Z`,
      recordedAt: `${todayStr}T07:05:00.000Z`
    }
  ];

  // 7. Simulated Member Activities
  const activities: Activity[] = [
    {
      id: 'ACT-10001',
      memberId: 'MEM-10001',
      type: 'workout',
      durationMinutes: 60,
      calories: 450,
      date: todayStr,
      source: 'simulated'
    },
    {
      id: 'ACT-10002',
      memberId: 'MEM-10001',
      type: 'cardio',
      durationMinutes: 45,
      calories: 380,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      source: 'simulated'
    },
    {
      id: 'ACT-10003',
      memberId: 'MEM-10001',
      type: 'strength',
      durationMinutes: 75,
      calories: 520,
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      source: 'simulated'
    }
  ];

  // 8. Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: 'AUDIT-10001',
      userId: 'USR-10001',
      action: 'LOGIN',
      timestamp: now,
      metadata: { ip: '127.0.0.1', userAgent: 'MaheshFitnessSim/1.0' }
    },
    {
      id: 'AUDIT-10002',
      userId: 'USR-10001',
      action: 'MEMBERSHIP_PURCHASE',
      timestamp: '2026-06-01T00:00:00.000Z',
      metadata: { planId: 'PLAN-10002', subscriptionId: 'SUB-10001', amountPaise: 749900 }
    },
    {
      id: 'AUDIT-10003',
      userId: 'USR-10001',
      action: 'CLASS_BOOKED',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      metadata: { classId: 'CLS-10001', bookingId: 'BOOK-10001' }
    }
  ];

  const fullData: RuntimeData = {
    users,
    memberProfiles,
    membershipPlans: plans,
    memberships: subscriptions,
    trainers,
    classes,
    bookings,
    attendance,
    payments,
    activities,
    sessions: [],
    auditLogs,
    metadata: {
      initializedAt: now,
      version: '1.0.0'
    }
  };

  await persistenceService.saveData(fullData);
  console.log('Successfully seeded demo data in runtime.json!');
}
