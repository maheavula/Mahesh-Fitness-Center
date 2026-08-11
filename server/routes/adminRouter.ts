import { Router, Response } from 'express';
import { persistenceService } from '../services/persistenceService.js';
import { AuthenticatedRequest, requireAuth, requireRole, sessionService } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { sanitizeString, sanitizeUser } from '../middleware/security.js';
import {
  MembershipPlan,
  Trainer,
  FitnessClass,
  Attendance,
  UserStatus,
  PlanStatus,
  TrainerStatus
} from '../types/index.js';

export const adminRouter = Router();

// Protect ALL admin routes with requireAuth & requireRole('admin')
adminRouter.use(requireAuth);
adminRouter.use(requireRole('admin'));

// GET /api/admin/dashboard
adminRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();

    const totalUsers = data.users.filter(u => u.role === 'member').length;
    const activeMembers = data.users.filter(u => u.role === 'member' && u.status === 'active').length;
    const suspendedMembers = data.users.filter(u => u.role === 'member' && u.status === 'suspended').length;
    const activeSubscriptions = data.memberships.filter(m => m.status === 'active').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const classesToday = data.classes.filter(c => c.date === todayStr).length;

    const todayClassIds = data.classes.filter(c => c.date === todayStr).map(c => c.id);
    const bookingsToday = data.bookings.filter(b => todayClassIds.includes(b.classId) && b.status === 'confirmed').length;
    const attendanceToday = data.attendance.filter(a => a.recordedAt.startsWith(todayStr)).length;

    const totalRevenuePaise = data.payments
      .filter(p => p.status === 'completed')
      .reduce((acc, p) => acc + p.amountPaise, 0);

    const revenueByMonth: Record<string, number> = {};
    data.payments.forEach(p => {
      if (p.status === 'completed') {
        const month = p.createdAt.substring(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] || 0) + (p.amountPaise / 100);
      }
    });

    const revenueChart = Object.keys(revenueByMonth).sort().map(month => ({
      month,
      revenue: revenueByMonth[month]
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalMembers: totalUsers,
          activeMembers,
          suspendedMembers,
          activeSubscriptions,
          classesToday,
          bookingsToday,
          attendanceToday,
          totalRevenuePaise
        },
        revenueChart,
        recentPayments: data.payments.slice(0, 5),
        recentAuditLogs: data.auditLogs.slice(0, 5)
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch admin dashboard' }
    });
  }
});

// GET /api/admin/members
adminRouter.get('/members', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const data = await persistenceService.getData();

    let memberUsers = data.users.filter(u => u.role === 'member');

    if (status) {
      memberUsers = memberUsers.filter(u => u.status === status);
    }

    if (search) {
      const term = sanitizeString(String(search)).toLowerCase();
      memberUsers = memberUsers.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term)
      );
    }

    const enriched = memberUsers.map(u => {
      const profile = data.memberProfiles.find(p => p.userId === u.id);
      const sub = profile ? data.memberships.find(m => m.memberId === profile.id && m.status === 'active') : null;
      const plan = sub ? data.membershipPlans.find(p => p.id === sub.planId) : null;

      return {
        ...sanitizeUser(u),
        profile,
        subscription: sub ? { ...sub, plan } : null
      };
    });

    res.json({
      success: true,
      data: { members: enriched }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list members' }
    });
  }
});

// GET /api/admin/members/:id
adminRouter.get('/members/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = await persistenceService.getData();

    const user = data.users.find(u => u.id === id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' }
      });
      return;
    }

    const profile = data.memberProfiles.find(p => p.userId === user.id);
    const memberId = profile?.id;

    const subscriptions = memberId ? data.memberships.filter(m => m.memberId === memberId) : [];
    const bookings = memberId ? data.bookings.filter(b => b.memberId === memberId) : [];
    const attendance = memberId ? data.attendance.filter(a => a.memberId === memberId) : [];
    const payments = memberId ? data.payments.filter(p => p.memberId === memberId) : [];
    const userAudits = data.auditLogs.filter(a => a.userId === user.id);

    res.json({
      success: true,
      data: {
        member: sanitizeUser(user),
        profile,
        subscriptions,
        bookings,
        attendance,
        payments,
        auditLogs: userAudits
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch member details' }
    });
  }
});

// PATCH /api/admin/members/:id/status
adminRouter.patch('/members/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Status must be active or suspended.' }
      });
      return;
    }

    const data = await persistenceService.getData();
    const user = data.users.find(u => u.id === id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'MEMBER_NOT_FOUND', message: 'Member not found.' }
      });
      return;
    }

    await persistenceService.updateData(d => {
      const u = d.users.find(x => x.id === id);
      if (u) {
        u.status = status as UserStatus;
        u.updatedAt = new Date().toISOString();
      }
    });

    if (status === 'suspended') {
      // Invalidate active sessions immediately
      await sessionService.destroyUserSessions(id);
      await logAudit(req.user!.id, 'MEMBER_SUSPENDED', { targetUserId: id });
    } else {
      await logAudit(req.user!.id, 'MEMBER_ACTIVATED', { targetUserId: id });
    }

    res.json({
      success: true,
      data: { message: `Member status updated to ${status}.` }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update status' }
    });
  }
});

// --- MEMBERSHIP PLAN MANAGEMENT ---
adminRouter.get('/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    res.json({ success: true, data: { plans: data.membershipPlans } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch plans' } });
  }
});

adminRouter.post('/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, durationMonths, pricePaise, features } = req.body;
    const cleanName = sanitizeString(name);
    const cleanDesc = sanitizeString(description);

    if (!cleanName || !pricePaise || !durationMonths) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name, duration, and price required.' } });
      return;
    }

    const planId = 'PLAN-' + Math.floor(10000 + Math.random() * 90000);
    const newPlan: MembershipPlan = {
      id: planId,
      name: cleanName,
      description: cleanDesc,
      durationMonths: Math.max(1, Number(durationMonths)),
      pricePaise: Math.max(0, Number(pricePaise)),
      features: Array.isArray(features) ? features.map(f => sanitizeString(f)) : [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await persistenceService.updateData(d => { d.membershipPlans.push(newPlan); });
    await logAudit(req.user!.id, 'PLAN_CREATED', { planId });

    res.status(201).json({ success: true, data: { plan: newPlan } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create plan' } });
  }
});

adminRouter.put('/plans/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, durationMonths, pricePaise, features, status } = req.body;

    const cleanName = sanitizeString(name);
    const cleanDesc = sanitizeString(description);

    await persistenceService.updateData(d => {
      const p = d.membershipPlans.find(x => x.id === id);
      if (p) {
        if (cleanName) p.name = cleanName;
        if (cleanDesc !== undefined) p.description = cleanDesc;
        if (durationMonths) p.durationMonths = Number(durationMonths);
        if (pricePaise) p.pricePaise = Number(pricePaise);
        if (Array.isArray(features)) p.features = features.map(f => sanitizeString(f));
        if (status) p.status = status as PlanStatus;
      }
    });

    await logAudit(req.user!.id, 'PLAN_UPDATED', { planId: id });
    res.json({ success: true, data: { message: 'Plan updated.' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update plan' } });
  }
});

adminRouter.patch('/plans/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await persistenceService.updateData(d => {
      const p = d.membershipPlans.find(x => x.id === id);
      if (p) p.status = status;
    });

    await logAudit(req.user!.id, 'PLAN_UPDATED', { planId: id, status });
    res.json({ success: true, data: { message: `Plan status changed to ${status}.` } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update plan status' } });
  }
});

// --- TRAINER MANAGEMENT ---
adminRouter.get('/trainers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    res.json({ success: true, data: { trainers: data.trainers } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list trainers' } });
  }
});

adminRouter.post('/trainers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, specialization, experienceYears, bio, avatar } = req.body;
    const cleanName = sanitizeString(name);
    const cleanSpec = sanitizeString(specialization);
    const cleanBio = sanitizeString(bio);

    if (!cleanName || !cleanSpec) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name and specialization required.' } });
      return;
    }

    const trainerId = 'TRN-' + Math.floor(10000 + Math.random() * 90000);
    const newTrainer: Trainer = {
      id: trainerId,
      name: cleanName,
      specialization: cleanSpec,
      experienceYears: Math.max(0, Number(experienceYears) || 1),
      bio: cleanBio,
      status: 'active',
      avatar: avatar ? sanitizeString(avatar) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      createdAt: new Date().toISOString()
    };

    await persistenceService.updateData(d => { d.trainers.push(newTrainer); });
    await logAudit(req.user!.id, 'TRAINER_CREATED', { trainerId });

    res.status(201).json({ success: true, data: { trainer: newTrainer } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create trainer' } });
  }
});

adminRouter.put('/trainers/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, specialization, experienceYears, bio, avatar, status } = req.body;

    const cleanName = sanitizeString(name);
    const cleanSpec = sanitizeString(specialization);
    const cleanBio = sanitizeString(bio);

    await persistenceService.updateData(d => {
      const t = d.trainers.find(x => x.id === id);
      if (t) {
        if (cleanName) t.name = cleanName;
        if (cleanSpec) t.specialization = cleanSpec;
        if (experienceYears !== undefined) t.experienceYears = Number(experienceYears);
        if (cleanBio !== undefined) t.bio = cleanBio;
        if (avatar) t.avatar = sanitizeString(avatar);
        if (status) t.status = status as TrainerStatus;
      }
    });

    await logAudit(req.user!.id, 'TRAINER_UPDATED', { trainerId: id });
    res.json({ success: true, data: { message: 'Trainer updated.' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update trainer' } });
  }
});

adminRouter.patch('/trainers/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await persistenceService.updateData(d => {
      const t = d.trainers.find(x => x.id === id);
      if (t) t.status = status;
    });

    await logAudit(req.user!.id, 'TRAINER_UPDATED', { trainerId: id, status });
    res.json({ success: true, data: { message: `Trainer status changed to ${status}.` } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update trainer status' } });
  }
});

// --- CLASS MANAGEMENT ---
adminRouter.post('/classes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, category, trainerId, date, startTime, endTime, capacity, location } = req.body;

    const cleanName = sanitizeString(name);
    const cleanDesc = sanitizeString(description);
    const cleanLocation = sanitizeString(location);

    if (!cleanName || !trainerId || !date || !startTime || !capacity) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Missing required class details.' } });
      return;
    }

    const data = await persistenceService.getData();
    const trainer = data.trainers.find(t => t.id === trainerId);
    if (!trainer || trainer.status !== 'active') {
      res.status(400).json({ success: false, error: { code: 'INACTIVE_TRAINER', message: 'Selected trainer is inactive or does not exist.' } });
      return;
    }

    const classId = 'CLS-' + Math.floor(10000 + Math.random() * 90000);
    const newClass: FitnessClass = {
      id: classId,
      name: cleanName,
      description: cleanDesc,
      category: (sanitizeString(category) as any) || 'Strength',
      trainerId,
      date: sanitizeString(date),
      startTime: sanitizeString(startTime),
      endTime: endTime ? sanitizeString(endTime) : sanitizeString(startTime),
      capacity: Math.max(1, Number(capacity)),
      bookedCount: 0,
      location: cleanLocation || 'Studio A',
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    await persistenceService.updateData(d => { d.classes.unshift(newClass); });
    await logAudit(req.user!.id, 'CLASS_CREATED', { classId });

    res.status(201).json({ success: true, data: { class: newClass } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create class' } });
  }
});

adminRouter.put('/classes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, trainerId, date, startTime, endTime, capacity, location, status } = req.body;

    const cleanName = sanitizeString(name);
    const cleanDesc = sanitizeString(description);
    const cleanLocation = sanitizeString(location);

    await persistenceService.updateData(d => {
      const c = d.classes.find(x => x.id === id);
      if (c) {
        if (cleanName) c.name = cleanName;
        if (cleanDesc !== undefined) c.description = cleanDesc;
        if (category) c.category = sanitizeString(category) as any;
        if (trainerId) c.trainerId = trainerId;
        if (date) c.date = sanitizeString(date);
        if (startTime) c.startTime = sanitizeString(startTime);
        if (endTime) c.endTime = sanitizeString(endTime);
        if (capacity !== undefined) c.capacity = Number(capacity);
        if (cleanLocation) c.location = cleanLocation;
        if (status) c.status = status;
      }
    });

    await logAudit(req.user!.id, 'CLASS_UPDATED', { classId: id });
    res.json({ success: true, data: { message: 'Class updated.' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update class' } });
  }
});

adminRouter.delete('/classes/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await persistenceService.updateData(d => {
      const c = d.classes.find(x => x.id === id);
      if (c) {
        c.status = 'cancelled';
      }
      d.bookings.forEach(b => {
        if (b.classId === id && b.status === 'confirmed') {
          b.status = 'cancelled';
          b.cancelledAt = new Date().toISOString();
        }
      });
    });

    await logAudit(req.user!.id, 'CLASS_DELETED', { classId: id });
    res.json({ success: true, data: { message: 'Class cancelled.' } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to cancel class' } });
  }
});

// --- BOOKINGS OVERVIEW ---
adminRouter.get('/bookings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const enriched = data.bookings.map(b => {
      const cls = data.classes.find(c => c.id === b.classId);
      const profile = data.memberProfiles.find(p => p.id === b.memberId);
      const memberUser = profile ? data.users.find(u => u.id === profile.userId) : undefined;

      return {
        ...b,
        fitnessClass: cls,
        memberUser: memberUser ? { name: memberUser.name, email: memberUser.email } : undefined
      };
    });

    res.json({ success: true, data: { bookings: enriched } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list bookings' } });
  }
});

// --- ATTENDANCE MANAGEMENT ---
adminRouter.get('/attendance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const enriched = data.attendance.map(a => {
      const cls = data.classes.find(c => c.id === a.classId);
      const profile = data.memberProfiles.find(p => p.id === a.memberId);
      const memberUser = profile ? data.users.find(u => u.id === profile.userId) : undefined;

      return {
        ...a,
        fitnessClass: cls,
        memberUser: memberUser ? { name: memberUser.name, email: memberUser.email } : undefined
      };
    });

    res.json({ success: true, data: { attendance: enriched } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list attendance' } });
  }
});

adminRouter.post('/attendance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { memberId, classId, bookingId, status } = req.body;
    if (!memberId || !classId || !status) {
      res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'memberId, classId, and status required.' } });
      return;
    }

    const data = await persistenceService.getData();
    const existing = data.attendance.find(a => a.memberId === memberId && a.classId === classId);
    if (existing) {
      res.status(409).json({ success: false, error: { code: 'DUPLICATE_ATTENDANCE', message: 'Attendance already recorded for this member and class.' } });
      return;
    }

    const attId = 'ATT-' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date().toISOString();
    const newAtt: Attendance = {
      id: attId,
      memberId,
      classId,
      bookingId: bookingId || '',
      status: status || 'present',
      checkedInAt: now,
      recordedAt: now
    };

    await persistenceService.updateData(d => { d.attendance.unshift(newAtt); });
    await logAudit(req.user!.id, 'ATTENDANCE_RECORDED', { attendanceId: attId, memberId, classId, status });

    res.status(201).json({ success: true, data: { attendance: newAtt } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to record attendance' } });
  }
});

// --- PAYMENTS OVERVIEW ---
adminRouter.get('/payments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const enriched = data.payments.map(p => {
      const profile = data.memberProfiles.find(pr => pr.id === p.memberId);
      const user = profile ? data.users.find(u => u.id === profile.userId) : undefined;
      const sub = data.memberships.find(m => m.id === p.membershipId);
      const plan = sub ? data.membershipPlans.find(pl => pl.id === sub.planId) : undefined;

      return {
        ...p,
        memberUser: user ? { name: user.name, email: user.email } : undefined,
        membershipPlan: plan
      };
    });

    res.json({ success: true, data: { payments: enriched } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to list payments' } });
  }
});

// --- AUDIT LOGS ---
adminRouter.get('/audit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const enriched = data.auditLogs.map(log => {
      const user = data.users.find(u => u.id === log.userId);
      return {
        ...log,
        userName: user?.name,
        userEmail: user?.email
      };
    });

    res.json({ success: true, data: { auditLogs: enriched } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit logs' } });
  }
});
