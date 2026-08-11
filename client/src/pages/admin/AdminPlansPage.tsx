import React, { useEffect, useState } from 'react';
import { Plus, Edit3, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { MembershipPlan } from '../../types/index.js';
import { formatINR } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuModal, NeuInput, NeuSelect } from '../../components/neumorphic/index.js';

export const AdminPlansPage: React.FC = () => {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMonths, setDurationMonths] = useState('3');
  const [priceRupees, setPriceRupees] = useState('7499');
  const [features, setFeatures] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPlans = async () => {
    try {
      const res = await apiClient.getAdminPlans();
      if (res.success) setPlans(res.data.plans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setDurationMonths('3');
    setPriceRupees('7499');
    setFeatures('Gym Access\nGroup Classes\nLocker Access');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setDurationMonths(String(plan.durationMonths));
    setPriceRupees(String(plan.pricePaise / 100));
    setFeatures(plan.features.join('\n'));
    setStatus(plan.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceRupees) {
      showToast('Validation Error', 'Plan name and price are required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const featureArray = features.split('\n').map(f => f.trim()).filter(Boolean);
    const pricePaise = Math.round(Number(priceRupees) * 100);

    const payload = {
      name,
      description,
      durationMonths: Number(durationMonths),
      pricePaise,
      features: featureArray,
      status
    };

    let res;
    if (editingPlan) {
      res = await apiClient.updatePlan(editingPlan.id, payload);
    } else {
      res = await apiClient.createPlan(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      showToast('Plan Saved', `Membership plan ${editingPlan ? 'updated' : 'created'} successfully.`, 'success');
      setIsModalOpen(false);
      await loadPlans();
    } else {
      showToast('Error', res.error?.message || 'Failed to save plan.', 'error');
    }
  };

  const handleToggleStatus = async (plan: MembershipPlan) => {
    const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
    const res = await apiClient.updatePlanStatus(plan.id, nextStatus);
    if (res.success) {
      showToast('Plan Status Updated', `${plan.name} is now ${nextStatus}.`, 'info');
      await loadPlans();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Membership Plans Management</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Configure membership pricing tiers, features, and plan availability.
          </p>
        </div>
        <NeuButton variant="primary" size="sm" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" /> Create New Plan
        </NeuButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <NeuCard key={plan.id} hoverable className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold text-gray-400">{plan.id}</span>
                <NeuBadge variant={plan.status === 'active' ? 'emerald' : 'gray'}>
                  {plan.status.toUpperCase()}
                </NeuBadge>
              </div>

              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-xs text-gray-500 min-h-[36px]">{plan.description}</p>
              <div>
                <span className="text-3xl font-black text-gray-900">{formatINR(plan.pricePaise)}</span>
                <span className="text-xs text-gray-500 font-semibold"> / {plan.durationMonths} months</span>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-gray-300/40 text-xs font-semibold text-gray-700">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-300/40">
              <NeuButton variant="secondary" size="sm" className="w-1/2" onClick={() => handleOpenEdit(plan)}>
                <Edit3 className="w-3.5 h-3.5" /> Edit Plan
              </NeuButton>
              <NeuButton
                variant={plan.status === 'active' ? 'danger' : 'primary'}
                size="sm"
                className="w-1/2"
                onClick={() => handleToggleStatus(plan)}
              >
                {plan.status === 'active' ? 'Deactivate' : 'Activate'}
              </NeuButton>
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Plan Form Modal */}
      <NeuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <NeuInput
            label="Plan Name"
            placeholder="Premium Elite"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <NeuInput
            label="Description"
            placeholder="Plan description details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <NeuInput
              label="Duration (Months)"
              type="number"
              value={durationMonths}
              onChange={e => setDurationMonths(e.target.value)}
              required
            />
            <NeuInput
              label="Price (INR ₹)"
              type="number"
              placeholder="7499"
              value={priceRupees}
              onChange={e => setPriceRupees(e.target.value)}
              required
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Features (One per line)</label>
            <textarea
              rows={4}
              className="w-full p-3 text-xs neu-input rounded-2xl text-gray-800"
              value={features}
              onChange={e => setFeatures(e.target.value)}
              placeholder="Full Gym Access&#10;Group Classes&#10;Locker Access"
            />
          </div>

          <NeuSelect
            label="Plan Status"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            options={[
              { label: 'Active (Available for purchase)', value: 'active' },
              { label: 'Inactive (Hidden from purchase)', value: 'inactive' }
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <NeuButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuButton>
            <NeuButton variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Membership Plan'}
            </NeuButton>
          </div>
        </form>
      </NeuModal>
    </div>
  );
};
