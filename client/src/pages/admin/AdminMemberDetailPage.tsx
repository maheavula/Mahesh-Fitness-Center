import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Calendar, ShieldCheck, CreditCard, BookmarkCheck, ClipboardCheck, Receipt, FileText } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatDate, formatINR } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuAvatar, NeuTabs } from '../../components/neumorphic/index.js';

export const AdminMemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      try {
        const res = await apiClient.getAdminMemberDetail(id);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-gray-500 font-semibold animate-pulse">Loading member details...</div>;
  }

  if (!data || !data.member) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-gray-600 font-semibold">Member not found.</p>
        <Link to="/admin/members">
          <NeuButton variant="secondary" size="sm"><ArrowLeft className="w-4 h-4" /> Back to Members List</NeuButton>
        </Link>
      </div>
    );
  }

  const { member, profile, subscriptions, bookings, attendance, payments, auditLogs } = data;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/admin/members" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to All Members
        </Link>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Member Detail — {member.name}</h1>
        <p className="text-xs text-gray-500 font-mono">ID: {member.id}</p>
      </div>

      {/* Member Header Card */}
      <NeuCard className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-300/40 pb-4">
          <div className="flex items-center gap-4">
            <NeuAvatar name={member.name} size="lg" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{member.name}</h2>
              <p className="text-xs text-gray-500">{member.email} • {member.phone || 'No phone'}</p>
              <p className="text-[11px] text-gray-400 mt-1">Joined: {formatDate(member.createdAt)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <NeuBadge variant={member.status === 'active' ? 'emerald' : 'rose'}>
              STATUS: {member.status.toUpperCase()}
            </NeuBadge>
          </div>
        </div>

        {/* Tab Navigation */}
        <NeuTabs
          tabs={[
            { id: 'overview', label: 'Overview & Profile' },
            { id: 'subscriptions', label: `Subscriptions (${subscriptions?.length || 0})` },
            { id: 'bookings', label: `Bookings (${bookings?.length || 0})` },
            { id: 'attendance', label: `Attendance (${attendance?.length || 0})` },
            { id: 'payments', label: `Payments (${payments?.length || 0})` },
            { id: 'audit', label: `Audit Log (${auditLogs?.length || 0})` }
          ]}
          activeTab={activeTab}
          onChange={id => setActiveTab(id)}
        />

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-4 neu-pressed rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Fitness Goal</span>
              <span className="font-bold text-gray-900 text-sm uppercase">{profile?.fitnessGoal || 'General Fitness'}</span>
            </div>
            <div className="p-4 neu-pressed rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Height (cm)</span>
              <span className="font-bold text-gray-900 text-sm">{profile?.heightCm ? `${profile.heightCm} cm` : 'Not specified'}</span>
            </div>
            <div className="p-4 neu-pressed rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Date of Birth</span>
              <span className="font-bold text-gray-900 text-sm">{formatDate(profile?.dateOfBirth)}</span>
            </div>
            <div className="p-4 neu-pressed rounded-2xl space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Emergency Contact</span>
              <span className="font-bold text-gray-900 text-sm">{profile?.emergencyContact?.name || 'None'} ({profile?.emergencyContact?.phone || 'N/A'})</span>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-3 pt-2">
            {subscriptions?.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 neu-pressed rounded-xl">No subscriptions recorded.</p>
            ) : (
              subscriptions.map((s: any) => (
                <div key={s.id} className="p-4 neu-pressed rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">Sub ID: {s.id}</span>
                    <span className="text-gray-500">Plan: {s.planId} • {formatDate(s.startDate)} to {formatDate(s.endDate)}</span>
                  </div>
                  <NeuBadge variant={s.status === 'active' ? 'emerald' : 'gray'}>{s.status}</NeuBadge>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-2 pt-2">
            {bookings?.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 neu-pressed rounded-xl">No bookings history.</p>
            ) : (
              bookings.map((b: any) => (
                <div key={b.id} className="p-3 neu-pressed rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">Booking {b.id}</span>
                    <span className="text-gray-500">Class ID: {b.classId} • Booked: {formatDate(b.bookedAt)}</span>
                  </div>
                  <NeuBadge variant={b.status === 'confirmed' ? 'emerald' : 'rose'}>{b.status}</NeuBadge>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-2 pt-2">
            {attendance?.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 neu-pressed rounded-xl">No attendance check-ins.</p>
            ) : (
              attendance.map((a: any) => (
                <div key={a.id} className="p-3 neu-pressed rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">Class ID: {a.classId}</span>
                    <span className="text-gray-500">Checked-in: {formatDate(a.checkedInAt)}</span>
                  </div>
                  <NeuBadge variant={a.status === 'present' ? 'emerald' : 'rose'}>{a.status}</NeuBadge>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-2 pt-2">
            {payments?.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 neu-pressed rounded-xl">No payments logged.</p>
            ) : (
              payments.map((p: any) => (
                <div key={p.id} className="p-3 neu-pressed rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-gray-900 block">{p.description} ({p.id})</span>
                    <span className="text-gray-500">{formatDate(p.createdAt)} • Method: {p.method}</span>
                  </div>
                  <span className="font-black text-gray-900 text-sm">{formatINR(p.amountPaise)}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-2 pt-2">
            {auditLogs?.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 neu-pressed rounded-xl">No audit history recorded.</p>
            ) : (
              auditLogs.map((log: any) => (
                <div key={log.id} className="p-3 neu-pressed rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px] block">{log.action}</span>
                    <span className="text-gray-500">{formatDate(log.timestamp)}</span>
                  </div>
                  <span className="font-mono text-[10px] text-gray-400">{log.id}</span>
                </div>
              ))
            )}
          </div>
        )}
      </NeuCard>
    </div>
  );
};
