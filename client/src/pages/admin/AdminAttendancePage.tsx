import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { FitnessClass } from '../../types/index.js';
import { formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuModal, NeuSelect } from '../../components/neumorphic/index.js';

export const AdminAttendancePage: React.FC = () => {
  const { showToast } = useToast();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [status, setStatus] = useState<'present' | 'absent' | 'no_show'>('present');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [attRes, clsRes, memRes] = await Promise.all([
        apiClient.getAdminAttendance(),
        apiClient.getClasses(),
        apiClient.getAdminMembers()
      ]);

      if (attRes.success) setAttendance(attRes.data.attendance || []);
      if (clsRes.success) {
        setClasses(clsRes.data.classes || []);
        if (clsRes.data.classes?.length > 0) setSelectedClassId(clsRes.data.classes[0].id);
      }
      if (memRes.success) {
        setMembers(memRes.data.members || []);
        if (memRes.data.members?.length > 0) setSelectedMemberId(memRes.data.members[0].profile?.id || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedMemberId) {
      showToast('Validation Error', 'Please select class and member.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const res = await apiClient.recordAttendance({
      classId: selectedClassId,
      memberId: selectedMemberId,
      status
    });

    setIsSubmitting(false);
    if (res.success) {
      showToast('Attendance Recorded', 'Member check-in saved successfully.', 'success');
      setIsModalOpen(false);
      await loadData();
    } else {
      showToast('Record Failed', res.error?.message || 'Failed to log attendance.', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Attendance Verification</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Record member attendance for scheduled fitness sessions and check-in logs.
          </p>
        </div>
        <NeuButton variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Record Check-in
        </NeuButton>
      </div>

      <NeuCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Record ID</th>
                <th className="p-4">Member</th>
                <th className="p-4">Class Session</th>
                <th className="p-4">Status</th>
                <th className="p-4">Check-in Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold">No attendance logs found.</td>
                </tr>
              ) : (
                attendance.map(a => (
                  <tr key={a.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{a.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{a.memberUser?.name || 'Member'}</span>
                      <span className="text-[11px] text-gray-500 block">{a.memberUser?.email}</span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{a.fitnessClass?.name || 'Class Session'}</td>
                    <td className="p-4">
                      <NeuBadge variant={a.status === 'present' ? 'emerald' : a.status === 'absent' ? 'rose' : 'amber'} size="sm">
                        {a.status}
                      </NeuBadge>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(a.checkedInAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* Record Modal */}
      <NeuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Member Attendance"
      >
        <form onSubmit={handleRecordAttendance} className="space-y-4">
          <NeuSelect
            label="Select Class Session"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            options={classes.map(c => ({ label: `${c.name} (${c.date} ${c.startTime})`, value: c.id }))}
          />

          <NeuSelect
            label="Select Member"
            value={selectedMemberId}
            onChange={e => setSelectedMemberId(e.target.value)}
            options={members.map(m => ({ label: `${m.name} (${m.email})`, value: m.profile?.id || m.id }))}
          />

          <NeuSelect
            label="Attendance Status"
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            options={[
              { label: 'Present (Checked In)', value: 'present' },
              { label: 'Absent (Excused)', value: 'absent' },
              { label: 'No Show (Unexcused)', value: 'no_show' }
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <NeuButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuButton>
            <NeuButton variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Check-in Log'}
            </NeuButton>
          </div>
        </form>
      </NeuModal>
    </div>
  );
};
