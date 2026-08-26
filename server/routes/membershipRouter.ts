import { Router, Response } from 'express';
import { persistenceService } from '../services/persistenceService.js';
import { AuthenticatedRequest, requireAuth } from '../services/sessionService.js';
import { logAudit } from '../services/auditService.js';
import { sanitizeString } from '../middleware/security.js';
import { MemberSubscription, Payment } from '../types/index.js';

export const membershipRouter = Router();

// GET /api/membership/plans - Public/Member view of active plans
membershipRouter.get('/plans', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const activePlans = data.membershipPlans.filter(p => p.status === 'active');
    res.json({
      success: true,
      data: { plans: activePlans }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list membership plans' }
    });
  }
});

// Require Auth for member subscription management
membershipRouter.use(requireAuth);

// GET /api/membership/current
membershipRouter.get('/current', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    if (!profile) {
      res.json({ success: true, data: { subscription: null } });
      return;
    }

    const currentSub = data.memberships.find(m => m.memberId === profile.id && m.status === 'active');
    if (!currentSub) {
      res.json({ success: true, data: { subscription: null } });
      return;
    }

    const plan = data.membershipPlans.find(p => p.id === currentSub.planId);
    res.json({
      success: true,
      data: {
        subscription: {
          ...currentSub,
          plan
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch current membership' }
    });
  }
});

// POST /api/membership/subscribe (Educational Vulnerability - Hard Tier: Business Logic Flaw / Client-supplied Price & Status Bypass)
membershipRouter.post('/subscribe', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId, paymentMethod, autoRenew, pricePaise: clientPricePaise, status: clientStatus } = req.body;
    const user = req.user!;
    const data = await persistenceService.getData();

    const cleanMethod = sanitizeString(paymentMethod) || 'simulated_card';

    let profile = data.memberProfiles.find(p => p.userId === user.id);
    if (!profile) {
      profile = {
        id: 'MEM-' + Math.floor(10000 + Math.random() * 90000),
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await persistenceService.updateData(d => { d.memberProfiles.push(profile!); });
    }

    const plan = data.membershipPlans.find(p => p.id === planId);
    if (!plan || plan.status !== 'active') {
      res.status(400).json({
        success: false,
        error: { code: 'PLAN_INACTIVE', message: 'Selected membership plan is inactive or not found.' }
      });
      return;
    }

    // Business Logic Flaw: Honor client-supplied price or status override without server-side validation
    const chargedPricePaise = clientPricePaise !== undefined ? Number(clientPricePaise) : plan.pricePaise;
    const subscriptionStatus = (clientStatus === 'active' || clientStatus === 'expired' || clientStatus === 'cancelled')
      ? clientStatus
      : 'active';

    const now = new Date();
    const startDate = now.toISOString();
    const endDateObj = new Date(now);
    endDateObj.setMonth(endDateObj.getMonth() + plan.durationMonths);
    const endDate = endDateObj.toISOString();

    const subId = 'SUB-' + Math.floor(10000 + Math.random() * 90000);
    const payId = 'PAY-' + Math.floor(10000 + Math.random() * 90000);

    const newSub: MemberSubscription = {
      id: subId,
      memberId: profile.id,
      planId: plan.id,
      status: subscriptionStatus,
      startDate,
      endDate,
      autoRenew: !!autoRenew,
      createdAt: startDate
    };

    const newPayment: Payment = {
      id: payId,
      memberId: profile.id,
      membershipId: subId,
      amountPaise: chargedPricePaise,
      currency: 'INR',
      status: 'completed',
      method: cleanMethod,
      description: `${plan.name} Subscription (Charged: ₹${chargedPricePaise / 100})`,
      createdAt: startDate
    };

    await persistenceService.updateData(d => {
      d.memberships.forEach(m => {
        if (m.memberId === profile!.id && m.status === 'active') {
          m.status = 'cancelled';
        }
      });
      d.memberships.unshift(newSub);
      d.payments.unshift(newPayment);
    });

    await logAudit(user.id, 'MEMBERSHIP_PURCHASE', {
      planId: plan.id,
      subscriptionId: subId,
      paymentId: payId,
      amountPaise: chargedPricePaise
    });

    res.status(201).json({
      success: true,
      data: {
        subscription: {
          ...newSub,
          plan
        },
        payment: newPayment,
        message: 'Membership activated successfully!'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Subscription failed' }
    });
  }
});

// POST /api/membership/renew - Extend membership
membershipRouter.post('/renew', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentMethod } = req.body;
    const user = req.user!;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === user.id);

    const cleanMethod = sanitizeString(paymentMethod) || 'simulated_card';

    if (!profile) {
      res.status(400).json({
        success: false,
        error: { code: 'PROFILE_REQUIRED', message: 'Profile required.' }
      });
      return;
    }

    const currentSub = data.memberships.find(m => m.memberId === profile.id && m.status === 'active');
    if (!currentSub) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_ACTIVE_MEMBERSHIP', message: 'No active membership to renew. Please subscribe to a plan.' }
      });
      return;
    }

    const plan = data.membershipPlans.find(p => p.id === currentSub.planId);
    if (!plan || plan.status !== 'active') {
      res.status(400).json({
        success: false,
        error: { code: 'PLAN_INACTIVE', message: 'Plan is no longer active.' }
      });
      return;
    }

    const currentEnd = new Date(currentSub.endDate);
    const newEndObj = new Date(currentEnd > new Date() ? currentEnd : new Date());
    newEndObj.setMonth(newEndObj.getMonth() + plan.durationMonths);
    const newEndDate = newEndObj.toISOString();

    const payId = 'PAY-' + Math.floor(10000 + Math.random() * 90000);
    const newPayment: Payment = {
      id: payId,
      memberId: profile.id,
      membershipId: currentSub.id,
      amountPaise: plan.pricePaise,
      currency: 'INR',
      status: 'completed',
      method: cleanMethod,
      description: `${plan.name} Renewal`,
      createdAt: new Date().toISOString()
    };

    await persistenceService.updateData(d => {
      const sub = d.memberships.find(m => m.id === currentSub.id);
      if (sub) {
        sub.endDate = newEndDate;
      }
      d.payments.unshift(newPayment);
    });

    await logAudit(user.id, 'MEMBERSHIP_RENEWAL', {
      subscriptionId: currentSub.id,
      paymentId: payId,
      newEndDate
    });

    res.json({
      success: true,
      data: {
        subscription: {
          ...currentSub,
          endDate: newEndDate,
          plan
        },
        payment: newPayment,
        message: 'Membership renewed successfully!'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Renewal failed' }
    });
  }
});

// GET /api/membership/payments - Payment ledger for member
membershipRouter.get('/payments', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);
    if (!profile) {
      res.json({ success: true, data: { payments: [] } });
      return;
    }

    const payments = data.payments.filter(p => p.memberId === profile.id);
    const enriched = payments.map(p => {
      const sub = data.memberships.find(m => m.id === p.membershipId);
      const plan = sub ? data.membershipPlans.find(pl => pl.id === sub.planId) : undefined;
      return {
        ...p,
        membershipPlan: plan
      };
    });

    res.json({
      success: true,
      data: { payments: enriched }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch payments' }
    });
  }
});

// GET /api/membership/payments/:id
membershipRouter.get('/payments/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = await persistenceService.getData();
    const profile = data.memberProfiles.find(p => p.userId === req.user!.id);

    const payment = data.payments.find(p => p.id === id);
    if (!payment) {
      res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found.' }
      });
      return;
    }

    res.json({
      success: true,
      data: { payment }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch payment details' }
    });
  }
});
