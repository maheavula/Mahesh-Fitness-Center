import { Router, Response } from 'express';
import { persistenceService } from '../services/persistenceService.js';
import { AuthenticatedRequest, requireAuth } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { sanitizeString } from '../middleware/security.js';
import { Booking } from '../types/index.js';

export const classRouter = Router();

// GET /api/classes/trainers - Public/Member view of trainers
classRouter.get('/trainers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const activeTrainers = data.trainers.filter(t => t.status === 'active');
    res.json({
      success: true,
      data: { trainers: activeTrainers }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch trainers' }
    });
  }
});

// GET /api/classes/schedule - Weekly schedule map
classRouter.get('/schedule', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const classes = data.classes
      .filter(c => c.status === 'scheduled')
      .map(c => ({
        ...c,
        trainer: data.trainers.find(t => t.id === c.trainerId)
      }));

    res.json({
      success: true,
      data: { schedule: classes }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch schedule' }
    });
  }
});

// GET /api/classes/bookings - Member's bookings (requires auth)
classRouter.get('/bookings', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    // OWASP A01: Derived strictly from server session user ID
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    if (!profile) {
      res.json({ success: true, data: { bookings: [] } });
      return;
    }

    const memberBookings = data.bookings.filter(b => b.memberId === profile.id);
    const enriched = memberBookings.map(b => {
      const cls = data.classes.find(c => c.id === b.classId);
      const trainer = cls ? data.trainers.find(t => t.id === cls.trainerId) : undefined;
      return {
        ...b,
        fitnessClass: cls ? { ...cls, trainer } : undefined
      };
    });

    res.json({
      success: true,
      data: { bookings: enriched }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch member bookings' }
    });
  }
});

// GET /api/classes/bookings/:id
classRouter.get('/bookings/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);

    const booking = data.bookings.find(b => b.id === id);
    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' }
      });
      return;
    }

    // OWASP A01: IDOR Protection - Only owner or admin can view
    if (req.user!.role !== 'admin' && booking.memberId !== profile?.id) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied.' }
      });
      return;
    }

    const cls = data.classes.find(c => c.id === booking.classId);
    const trainer = cls ? data.trainers.find(t => t.id === cls.trainerId) : undefined;

    res.json({
      success: true,
      data: {
        booking: {
          ...booking,
          fitnessClass: cls ? { ...cls, trainer } : undefined
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch booking details' }
    });
  }
});

// DELETE /api/classes/bookings/:id - Cancel a booking
classRouter.delete('/bookings/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === user.id);

    const booking = data.bookings.find(b => b.id === id);
    if (!booking) {
      res.status(404).json({
        success: false,
        error: { code: 'BOOKING_NOT_FOUND', message: 'Booking not found.' }
      });
      return;
    }

    // OWASP A01: IDOR Protection
    if (user.role !== 'admin' && booking.memberId !== profile?.id) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You cannot cancel another member\'s booking.' }
      });
      return;
    }

    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_CANCELLED', message: 'Booking is already cancelled.' }
      });
      return;
    }

    await persistenceService.updateData(d => {
      const bIndex = d.bookings.findIndex(b => b.id === id);
      if (bIndex !== -1) {
        d.bookings[bIndex].status = 'cancelled';
        d.bookings[bIndex].cancelledAt = new Date().toISOString();
      }

      const cls = d.classes.find(c => c.id === booking.classId);
      if (cls && cls.bookedCount > 0) {
        cls.bookedCount -= 1;
      }
    });

    await logAudit(user.id, 'CLASS_CANCELLED', { bookingId: id, classId: booking.classId });

    res.json({
      success: true,
      data: { message: 'Booking cancelled successfully.' }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to cancel booking' }
    });
  }
});

// GET /api/classes - List all classes
classRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, trainerId, date, search } = req.query;
    const data = await persistenceService.getData();

    let list = data.classes;

    if (category) {
      const cleanCat = sanitizeString(String(category)).toLowerCase();
      list = list.filter(c => c.category.toLowerCase() === cleanCat);
    }

    if (trainerId) {
      list = list.filter(c => c.trainerId === String(trainerId));
    }

    if (date) {
      list = list.filter(c => c.date === sanitizeString(String(date)));
    }

    if (search) {
      const term = sanitizeString(String(search)).toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term));
    }

    const enriched = list.map(c => ({
      ...c,
      trainer: data.trainers.find(t => t.id === c.trainerId)
    }));

    res.json({
      success: true,
      data: { classes: enriched }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list classes' }
    });
  }
});

// GET /api/classes/:id - Get specific class
classRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = await persistenceService.getData();
    const cls = data.classes.find(c => c.id === id);

    if (!cls) {
      res.status(404).json({
        success: false,
        error: { code: 'CLASS_NOT_FOUND', message: 'Class not found.' }
      });
      return;
    }

    const trainer = data.trainers.find(t => t.id === cls.trainerId);
    res.json({
      success: true,
      data: {
        class: {
          ...cls,
          trainer
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch class details' }
    });
  }
});

// POST /api/classes/:id/book - Book class
classRouter.post('/:id/book', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === user.id);

    if (!profile) {
      res.status(400).json({
        success: false,
        error: { code: 'PROFILE_REQUIRED', message: 'Member profile required before booking.' }
      });
      return;
    }

    // OWASP A04: Active Membership Check
    const activeSub = data.memberships.find(m => m.memberId === profile.id && m.status === 'active');
    if (!activeSub) {
      res.status(403).json({
        success: false,
        error: { code: 'MEMBERSHIP_REQUIRED', message: 'An active membership subscription is required to book group fitness classes.' }
      });
      return;
    }

    const cls = data.classes.find(c => c.id === id);
    if (!cls) {
      res.status(404).json({
        success: false,
        error: { code: 'CLASS_NOT_FOUND', message: 'Class not found.' }
      });
      return;
    }

    if (cls.status !== 'scheduled') {
      res.status(400).json({
        success: false,
        error: { code: 'CLASS_UNAVAILABLE', message: 'Class is not available for booking.' }
      });
      return;
    }

    // OWASP A04: Class Capacity Enforcement
    if (cls.bookedCount >= cls.capacity) {
      res.status(400).json({
        success: false,
        error: { code: 'CLASS_FULL', message: 'This class has reached maximum capacity.' }
      });
      return;
    }

    // OWASP A04: Duplicate Booking Check
    const existingBooking = data.bookings.find(
      b => b.classId === id && b.memberId === profile.id && b.status === 'confirmed'
    );
    if (existingBooking) {
      res.status(409).json({
        success: false,
        error: { code: 'ALREADY_BOOKED', message: 'You have already booked a spot in this class.' }
      });
      return;
    }

    const bookingId = 'BOOK-' + Math.floor(10000 + Math.random() * 90000);
    const newBooking: Booking = {
      id: bookingId,
      classId: id,
      memberId: profile.id,
      status: 'confirmed',
      bookedAt: new Date().toISOString(),
      cancelledAt: null
    };

    await persistenceService.updateData(d => {
      d.bookings.unshift(newBooking);
      const targetClass = d.classes.find(c => c.id === id);
      if (targetClass) {
        targetClass.bookedCount += 1;
      }
    });

    await logAudit(user.id, 'CLASS_BOOKED', { classId: id, bookingId });

    res.status(201).json({
      success: true,
      data: {
        booking: newBooking,
        message: 'Class booked successfully!'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to book class' }
    });
  }
});
