import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Check, ShieldCheck, RefreshCw, Receipt, Sparkles, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { MembershipPlan, Payment } from '../../types/index.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuProgress, NeuModal, NeuSelect } from '../../components/neumorphic/index.js';

export const MembershipPage: React.FC = () => {
  const { subscription, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Purchase/Renew Modal State
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('simulated_card');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, payRes] = await Promise.all([
          apiClient.getMembershipPlans(),
          apiClient.getPayments()
        ]);

        if (plansRes.success) setPlans(plansRes.data.plans || []);
        if (payRes.success) setPayments(payRes.data.payments || []);

        // Check if query param auto opens plan
        const planParam = searchParams.get('subscribe');
        if (planParam && plansRes.data?.plans) {
          const target = plansRes.data.plans.find((p: any) => p.id === planParam);
          if (target) setSelectedPlan(target);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);

    const res = await apiClient.subscribeMembership({
      planId: selectedPlan.id,
      paymentMethod,
      autoRenew: false
    });

    setIsSubmitting(false);
    if (res.success) {
      showToast('Membership Activated!', `${selectedPlan.name} is now active on your account.`, 'success');
      setSelectedPlan(null);
      await refreshUser();
      const payRes = await apiClient.getPayments();
      if (payRes.success) setPayments(payRes.data.payments || []);
    } else {
      showToast('Subscription Failed', res.error?.message || 'Transaction failed.', 'error');
    }
  };

  const handleRenew = async () => {
    if (!subscription) return;
    setIsSubmitting(true);

    const res = await apiClient.renewMembership({ paymentMethod });
    setIsSubmitting(false);

    if (res.success) {
      showToast('Membership Renewed!', 'Subscription extended successfully.', 'success');
      await refreshUser();
      const payRes = await apiClient.getPayments();
      if (payRes.success) setPayments(payRes.data.payments || []);
    } else {
      showToast('Renewal Failed', res.error?.message || 'Renewal failed.', 'error');
    }
  };

  const daysRemaining = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Membership Management</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Explore plans, manage your current subscription, and view payment history.
        </p>
      </div>

      {/* Current Subscription Banner */}
      <NeuCard className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-300/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neu-raised flex items-center justify-center text-emerald-600">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block">Current Membership</span>
              <h2 className="text-2xl font-black text-gray-900">
                {subscription ? subscription.plan?.name : 'No Active Membership'}
              </h2>
            </div>
          </div>
          {subscription ? (
            <NeuBadge variant="emerald">ACTIVE SUBSCRIPTION</NeuBadge>
          ) : (
            <NeuBadge variant="amber">NO ACTIVE PLAN</NeuBadge>
          )}
        </div>

        {subscription ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 neu-pressed rounded-2xl">
              <span className="text-gray-500 block">Start Date</span>
              <span className="font-extrabold text-gray-800 text-sm">{formatDate(subscription.startDate)}</span>
            </div>
            <div className="p-4 neu-pressed rounded-2xl">
              <span className="text-gray-500 block">Expiration Date</span>
              <span className="font-extrabold text-gray-800 text-sm">{formatDate(subscription.endDate)}</span>
            </div>
            <div className="p-4 neu-pressed rounded-2xl">
              <span className="text-gray-500 block">Days Remaining</span>
              <span className="font-extrabold text-emerald-600 text-sm">{daysRemaining} Days</span>
            </div>
            <div className="p-4 neu-pressed rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-gray-500 block">Auto Renewal</span>
                <span className="font-bold text-gray-800">{subscription.autoRenew ? 'Enabled' : 'Disabled'}</span>
              </div>
              <NeuButton variant="primary" size="sm" onClick={handleRenew} disabled={isSubmitting}>
                <RefreshCw className="w-3.5 h-3.5" /> Renew Now
              </NeuButton>
            </div>
          </div>
        ) : (
          <div className="p-4 neu-pressed rounded-2xl text-xs space-y-2">
            <p className="text-gray-600">You currently do not have an active fitness membership. Select one of our curated plans below to get started immediately.</p>
          </div>
        )}
      </NeuCard>

      {/* Available Plans Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Available Membership Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const isCurrent = subscription?.planId === plan.id && subscription.status === 'active';
            return (
              <NeuCard key={plan.id} hoverable className="flex flex-col justify-between space-y-6 relative">
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-2xl">
                    Active Plan
                  </div>
                )}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                  <p className="text-xs text-gray-500 min-h-[36px]">{plan.description}</p>
                  <div className="py-1">
                    <span className="text-3xl font-black text-gray-900">{formatINR(plan.pricePaise)}</span>
                    <span className="text-xs font-semibold text-gray-500"> / {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}</span>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-300/40">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <NeuButton
                  variant={isCurrent ? 'secondary' : 'primary'}
                  className="w-full mt-4"
                  onClick={() => setSelectedPlan(plan)}
                >
                  {isCurrent ? 'Switch to Plan' : `Choose ${plan.name}`}
                </NeuButton>
              </NeuCard>
            );
          })}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Payment & Billing History</h3>
        <NeuCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
                <tr>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300/30">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">No payment history recorded yet.</td>
                  </tr>
                ) : (
                  payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-200/30">
                      <td className="p-4 font-mono font-bold text-gray-900">{p.id}</td>
                      <td className="p-4 font-semibold text-gray-800">{p.description}</td>
                      <td className="p-4 font-black text-gray-900">{formatINR(p.amountPaise)}</td>
                      <td className="p-4 uppercase text-gray-600 font-semibold">{p.method.replace('_', ' ')}</td>
                      <td className="p-4">
                        <NeuBadge variant={p.status === 'completed' ? 'emerald' : 'rose'} size="sm">
                          {p.status}
                        </NeuBadge>
                      </td>
                      <td className="p-4 text-gray-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </NeuCard>
      </div>

      {/* Purchase Review Modal */}
      <NeuModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        title="Review & Confirm Membership"
      >
        {selectedPlan && (
          <div className="space-y-6">
            <div className="p-4 neu-pressed rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">{selectedPlan.name} Plan</span>
                <NeuBadge variant="emerald">{selectedPlan.durationMonths} Months</NeuBadge>
              </div>
              <p className="text-xs text-gray-500">{selectedPlan.description}</p>
              <div className="pt-2 border-t border-gray-300/40 flex justify-between items-center text-sm font-black">
                <span>Total Due:</span>
                <span className="text-emerald-600 text-lg">{formatINR(selectedPlan.pricePaise)}</span>
              </div>
            </div>

            <NeuSelect
              label="Simulated Payment Method"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              options={[
                { label: 'Simulated Credit / Debit Card', value: 'simulated_card' },
                { label: 'Simulated UPI Instant Transfer', value: 'simulated_upi' },
                { label: 'Demo Sandbox Payment', value: 'demo_payment' }
              ]}
            />

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Simulated Payment: No real financial transaction will occur. Changes will be persisted to <code>runtime.json</code>.</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <NeuButton variant="secondary" onClick={() => setSelectedPlan(null)}>
                Cancel
              </NeuButton>
              <NeuButton variant="primary" onClick={handleSubscribe} disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : 'Confirm Simulated Payment'}
              </NeuButton>
            </div>
          </div>
        )}
      </NeuModal>
    </div>
  );
};
