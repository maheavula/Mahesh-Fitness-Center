import { Router, Response } from 'express';
import { persistenceService } from '../services/persistenceService.js';
import { AuthenticatedRequest, requireAuth } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { sanitizeString, sanitizeUser } from '../middleware/security.js';
import { Activity } from '../types/index.js';

export const memberRouter = Router();

// Require auth for all member routes
memberRouter.use(requireAuth);

// GET /api/member/profile
memberRouter.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    // OWASP A01: Identity derived strictly from server-side authenticated session user ID
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);

    if (!profile) {
      res.status(404).json({
        success: false,
        error: { code: 'MEMBER_NOT_FOUND', message: 'Member profile not found.' }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: sanitizeUser(req.user!),
        profile
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' }
    });
  }
});

// PUT /api/member/profile
memberRouter.put('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone, fitnessGoal, heightCm, dateOfBirth, emergencyContact } = req.body;
    const user = req.user!;

    const cleanName = sanitizeString(name);
    const cleanPhone = sanitizeString(phone);
    const cleanGoal = sanitizeString(fitnessGoal);
    const cleanDob = sanitizeString(dateOfBirth);

    await persistenceService.updateData(data => {
      // Update User fields
      const u = data.users.find(x => x.id === user.id);
      if (u) {
        if (cleanName) u.name = cleanName;
        if (cleanPhone !== undefined) u.phone = cleanPhone;
        u.updatedAt = new Date().toISOString();
      }

      // Update MemberProfile fields
      let p = data.memberProfiles.find(x => x.userId === user.id);
      if (!p) {
        p = {
          id: 'MEM-' + Math.floor(10000 + Math.random() * 90000),
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        data.memberProfiles.push(p);
      }

      if (cleanGoal) p.fitnessGoal = cleanGoal as any;
      if (heightCm !== undefined) p.heightCm = Math.min(250, Math.max(50, Number(heightCm) || 175));
      if (cleanDob) p.dateOfBirth = cleanDob;
      if (emergencyContact) {
        p.emergencyContact = {
          name: sanitizeString(emergencyContact.name),
          phone: sanitizeString(emergencyContact.phone)
        };
      }
      p.updatedAt = new Date().toISOString();
    });

    await logAudit(user.id, 'PROFILE_UPDATE');

    const updatedData = await persistenceService.getData();
    const updatedProfile = updatedData.memberProfiles.find(p => p.userId === user.id);
    const updatedUser = updatedData.users.find(u => u.id === user.id);

    res.json({
      success: true,
      data: {
        user: sanitizeUser(updatedUser!),
        profile: updatedProfile
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update profile' }
    });
  }
});

// GET /api/member/dashboard
memberRouter.get('/dashboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    const memberId = profile?.id;

    // Active subscription & plan
    let activeSubscription: any = null;
    let daysRemaining = 0;
    if (memberId) {
      activeSubscription = data.memberships.find(m => m.memberId === memberId && m.status === 'active');
      if (activeSubscription) {
        const plan = data.membershipPlans.find(p => p.id === activeSubscription.planId);
        activeSubscription.plan = plan;

        const endDate = new Date(activeSubscription.endDate).getTime();
        const now = Date.now();
        daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      }
    }

    // Bookings & Next upcoming class
    let upcomingClass = null;
    let userBookingsCount = 0;
    if (memberId) {
      const userBookings = data.bookings.filter(b => b.memberId === memberId && b.status === 'confirmed');
      userBookingsCount = userBookings.length;

      const bookedClassIds = userBookings.map(b => b.classId);
      const upcomingClasses = data.classes
        .filter(c => bookedClassIds.includes(c.id) && c.status === 'scheduled')
        .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));

      if (upcomingClasses.length > 0) {
        const nextCls = upcomingClasses[0];
        const trainer = data.trainers.find(t => t.id === nextCls.trainerId);
        upcomingClass = {
          ...nextCls,
          trainer
        };
      }
    }

    const memberActivities = memberId ? data.activities.filter(a => a.memberId === memberId) : [];
    const totalDuration = memberActivities.reduce((acc, a) => acc + a.durationMinutes, 0);
    const totalCalories = memberActivities.reduce((acc, a) => acc + a.calories, 0);
    const workoutCount = memberActivities.length;

    const memberAttendance = memberId ? data.attendance.filter(a => a.memberId === memberId) : [];
    const presentCount = memberAttendance.filter(a => a.status === 'present').length;

    res.json({
      success: true,
      data: {
        memberName: req.user!.name,
        profile,
        subscription: activeSubscription,
        daysRemaining,
        upcomingClass,
        stats: {
          workoutCount,
          totalDurationMinutes: totalDuration,
          totalCalories,
          activeBookings: userBookingsCount,
          totalVisits: presentCount
        },
        recentActivities: memberActivities.slice(0, 5)
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to load dashboard' }
    });
  }
});

// GET /api/member/attendance
memberRouter.get('/attendance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    if (!profile) {
      res.json({ success: true, data: { attendance: [], stats: { totalVisits: 0, attendanceRate: 100 } } });
      return;
    }

    const records = data.attendance.filter(a => a.memberId === profile.id);
    const enriched = records.map(att => {
      const cls = data.classes.find(c => c.id === att.classId);
      const trainer = cls ? data.trainers.find(t => t.id === cls.trainerId) : null;
      return {
        ...att,
        fitnessClass: cls ? { ...cls, trainer } : undefined
      };
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    res.json({
      success: true,
      data: {
        attendance: enriched,
        stats: {
          totalVisits: present,
          totalRecords: total,
          attendanceRate: rate
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch attendance' }
    });
  }
});

// GET /api/member/activity & POST /api/member/activity
memberRouter.get('/activity', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    if (!profile) {
      res.json({ success: true, data: { activities: [] } });
      return;
    }

    const activities = data.activities.filter(a => a.memberId === profile.id);
    res.json({
      success: true,
      data: { activities }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch activity' }
    });
  }
});

memberRouter.post('/activity', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, durationMinutes, calories, date } = req.body;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);

    if (!profile) {
      res.status(400).json({
        success: false,
        error: { code: 'PROFILE_REQUIRED', message: 'Member profile missing.' }
      });
      return;
    }

    const cleanType = sanitizeString(type);
    const cleanDate = sanitizeString(date);

    const newActivity: Activity = {
      id: 'ACT-' + Math.floor(10000 + Math.random() * 90000),
      memberId: profile.id,
      type: (cleanType as any) || 'workout',
      durationMinutes: Math.min(600, Math.max(1, Number(durationMinutes) || 45)),
      calories: Math.min(5000, Math.max(0, Number(calories) || 300)),
      date: cleanDate || new Date().toISOString().split('T')[0],
      source: 'simulated'
    };

    await persistenceService.updateData(d => {
      d.activities.unshift(newActivity);
    });

    res.status(201).json({
      success: true,
      data: { activity: newActivity }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to record activity' }
    });
  }
});

// GET /api/member/stats
memberRouter.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    const memberId = profile?.id;

    const activities = memberId ? data.activities.filter(a => a.memberId === memberId) : [];
    const totalMinutes = activities.reduce((acc, a) => acc + a.durationMinutes, 0);
    const totalCalories = activities.reduce((acc, a) => acc + a.calories, 0);
    const bookings = memberId ? data.bookings.filter(b => b.memberId === memberId) : [];

    res.json({
      success: true,
      data: {
        totalWorkouts: activities.length,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalCalories,
        totalBookings: bookings.length,
        streakDays: activities.length > 0 ? Math.min(activities.length + 2, 14) : 0
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch stats' }
    });
  }
});
