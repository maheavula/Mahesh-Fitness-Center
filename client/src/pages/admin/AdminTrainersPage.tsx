import React, { useEffect, useState } from 'react';
import { Plus, Edit3, UserCheck, UserX, Award } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { Trainer } from '../../types/index.js';
import { NeuCard, NeuButton, NeuBadge, NeuAvatar, NeuModal, NeuInput, NeuSelect } from '../../components/neumorphic/index.js';

export const AdminTrainersPage: React.FC = () => {
  const { showToast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [experienceYears, setExperienceYears] = useState('5');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTrainers = async () => {
    try {
      const res = await apiClient.getAdminTrainers();
      if (res.success) setTrainers(res.data.trainers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, []);

  const handleOpenCreate = () => {
    setEditingTrainer(null);
    setName('');
    setSpecialization('Strength & Conditioning');
    setExperienceYears('5');
    setBio('');
    setAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Trainer) => {
    setEditingTrainer(t);
    setName(t.name);
    setSpecialization(t.specialization);
    setExperienceYears(String(t.experienceYears));
    setBio(t.bio);
    setAvatar(t.avatar);
    setStatus(t.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !specialization) {
      showToast('Validation Error', 'Trainer name and specialization required.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      specialization,
      experienceYears: Number(experienceYears),
      bio,
      avatar,
      status
    };

    let res;
    if (editingTrainer) {
      res = await apiClient.updateTrainer(editingTrainer.id, payload);
    } else {
      res = await apiClient.createTrainer(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      showToast('Trainer Saved', `Trainer ${editingTrainer ? 'updated' : 'added'} successfully.`, 'success');
      setIsModalOpen(false);
      await loadTrainers();
    } else {
      showToast('Error', res.error?.message || 'Failed to save trainer.', 'error');
    }
  };

  const handleToggleStatus = async (t: Trainer) => {
    const nextStatus = t.status === 'active' ? 'inactive' : 'active';
    const res = await apiClient.updateTrainerStatus(t.id, nextStatus);
    if (res.success) {
      showToast('Trainer Status Updated', `${t.name} is now ${nextStatus}.`, 'info');
      await loadTrainers();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Trainer Directory Management</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Add new fitness coaches, update bios, and toggle trainer availability.
          </p>
        </div>
        <NeuButton variant="primary" size="sm" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" /> Add New Trainer
        </NeuButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map(t => (
          <NeuCard key={t.id} hoverable className="flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <span>{t.id}</span>
                <NeuBadge variant={t.status === 'active' ? 'emerald' : 'gray'}>{t.status}</NeuBadge>
              </div>

              <div className="flex justify-center">
                <NeuAvatar src={t.avatar} name={t.name} size="lg" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t.specialization}</p>
                <p className="text-xs text-gray-500 mt-1">{t.experienceYears} Years Experience</p>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 italic">"{t.bio}"</p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-300/40">
              <NeuButton variant="secondary" size="sm" className="w-1/2" onClick={() => handleOpenEdit(t)}>
                <Edit3 className="w-3.5 h-3.5" /> Edit Bio
              </NeuButton>
              <NeuButton
                variant={t.status === 'active' ? 'danger' : 'primary'}
                size="sm"
                className="w-1/2"
                onClick={() => handleToggleStatus(t)}
              >
                {t.status === 'active' ? 'Deactivate' : 'Activate'}
              </NeuButton>
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Trainer Modal */}
      <NeuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrainer ? 'Edit Trainer Details' : 'Add New Certified Trainer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <NeuInput
            label="Full Name"
            placeholder="Arjun Rao"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <NeuInput
            label="Specialization"
            placeholder="Strength & Conditioning"
            value={specialization}
            onChange={e => setSpecialization(e.target.value)}
            required
          />

          <NeuInput
            label="Experience (Years)"
            type="number"
            value={experienceYears}
            onChange={e => setExperienceYears(e.target.value)}
            required
          />

          <NeuInput
            label="Avatar Image URL"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
          />

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Biography / Coaching Bio</label>
            <textarea
              rows={3}
              className="w-full p-3 text-xs neu-input rounded-2xl text-gray-800"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Coach bio and certification credentials..."
            />
          </div>

          <NeuSelect
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            options={[
              { label: 'Active (Assignable to classes)', value: 'active' },
              { label: 'Inactive (Unavailable)', value: 'inactive' }
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <NeuButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuButton>
            <NeuButton variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Trainer Details'}
            </NeuButton>
          </div>
        </form>
      </NeuModal>
    </div>
  );
};
