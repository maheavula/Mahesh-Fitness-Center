import React, { useState, useEffect } from 'react';
import { User, Phone, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { apiClient } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuInput, NeuSelect, NeuBadge, NeuAvatar } from '../../components/neumorphic/index.js';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [memberId, setMemberId] = useState(profile?.id || 'kmc-143');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [fitnessGoal, setFitnessGoal] = useState(profile?.fitnessGoal || 'strength');
  const [heightCm, setHeightCm] = useState(String(profile?.heightCm || 175));
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || '');
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContact?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch member profile explicitly via GET /api/member/profile?memberId=kmc-xxx on mount / route click
  const loadProfile = async (idToFetch: string) => {
    const res = await apiClient.getMemberProfile(idToFetch);
    if (res.success && res.data) {
      const u = res.data.user;
      const p = res.data.profile;
      if (u) {
        setName(u.name || '');
        setPhone(u.phone || '');
      }
      if (p) {
        setFitnessGoal(p.fitnessGoal || 'strength');
        setHeightCm(String(p.heightCm || 175));
        setDateOfBirth(p.dateOfBirth || '');
        setEmergencyName(p.emergencyContact?.name || '');
        setEmergencyPhone(p.emergencyContact?.phone || '');
      }
    }
  };

  useEffect(() => {
    const activeId = profile?.id || 'kmc-143';
    setMemberId(activeId);
    loadProfile(activeId);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Sends PUT /api/member/profile?memberId=kmc-xxx with memberId parameter over HTTP proxy
    const res = await apiClient.updateMemberProfile(
      {
        name,
        phone,
        fitnessGoal,
        heightCm: Number(heightCm) || 175,
        dateOfBirth,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone
        }
      },
      memberId
    );

    setIsSaving(false);
    if (res.success) {
      showToast('Profile Saved', 'Your member details have been updated.', 'success');
      await refreshUser();
    } else {
      showToast('Update Failed', res.error?.message || 'Failed to update profile.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Member Profile</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Manage your personal information, fitness preferences, and emergency contact details.
        </p>
      </div>

      {/* Member Identity Header Card */}
      <NeuCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <NeuAvatar name={name || 'Member'} size="lg" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <NeuBadge variant="blue">Joined {formatDate(user?.createdAt)}</NeuBadge>
            </div>
          </div>
        </div>
      </NeuCard>

      {/* Profile Edit Form */}
      <NeuCard className="p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300/40 pb-3">Personal Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeuInput
              label="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
            />

            <div>
              <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase block mb-1.5">Email Address</label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-3 text-sm neu-pressed rounded-2xl text-gray-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Account session email.</span>
            </div>

            <NeuInput
              label="Phone Number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              icon={<Phone className="w-4 h-4" />}
            />

            <NeuInput
              label="Date of Birth"
              type="date"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300/40 pb-3 pt-4">Fitness Profile</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeuSelect
              label="Fitness Goal"
              value={fitnessGoal}
              onChange={e => setFitnessGoal(e.target.value as any)}
              options={[
                { label: 'Build Strength & Muscle', value: 'strength' },
                { label: 'Weight Loss & Fat Burn', value: 'weight_loss' },
                { label: 'General Fitness & Stamina', value: 'fitness' },
                { label: 'Flexibility & Joint Mobility', value: 'mobility' },
                { label: 'Overall Health & Wellness', value: 'wellness' }
              ]}
            />

            <NeuInput
              label="Height (cm)"
              type="number"
              value={heightCm}
              onChange={e => setHeightCm(e.target.value)}
            />
          </div>

          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300/40 pb-3 pt-4">Emergency Contact</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NeuInput
              label="Contact Name"
              placeholder="Contact Person"
              value={emergencyName}
              onChange={e => setEmergencyName(e.target.value)}
            />

            <NeuInput
              label="Contact Phone"
              placeholder="+91 98888 77777"
              value={emergencyPhone}
              onChange={e => setEmergencyPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <NeuButton variant="primary" type="submit" size="lg" disabled={isSaving}>
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'} <Save className="w-4 h-4" />
            </NeuButton>
          </div>
        </form>
      </NeuCard>
    </div>
  );
};
