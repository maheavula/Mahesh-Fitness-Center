import React, { useEffect, useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Attendance } from '../../types/index.js';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { NeuCard, NeuBadge, NeuStatCard } from '../../components/neumorphic/index.js';

export const AttendancePage: React.FC = () => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState({ totalVisits: 0, totalRecords: 0, attendanceRate: 100 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      try {
        const res = await apiClient.getMemberAttendance();
        if (res.success) {
          setAttendance(res.data.attendance || []);
          setStats(res.data.stats || { totalVisits: 0, totalRecords: 0, attendanceRate: 100 });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAttendance();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Attendance Log</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Review your verified gym attendance and class check-in records.
        </p>
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NeuStatCard
          title="Total Gym Visits"
          value={stats.totalVisits}
          subtitle="Verified check-ins"
          icon={<ClipboardCheck className="w-6 h-6 text-emerald-600" />}
        />
        <NeuStatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          subtitle="Booked vs attended ratio"
          icon={<CheckCircle2 className="w-6 h-6 text-blue-600" />}
        />
        <NeuStatCard
          title="Total Class Sessions"
          value={stats.totalRecords}
          subtitle="Recorded logs"
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Attendance Log Table */}
      <NeuCard className="p-0 overflow-hidden space-y-4">
        <div className="p-6 border-b border-gray-300/40">
          <h3 className="text-lg font-bold text-gray-900">Check-in History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Record ID</th>
                <th className="p-4">Class</th>
                <th className="p-4">Trainer</th>
                <th className="p-4">Check-in Time</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-semibold">
                    No attendance records found yet. Book a class and complete a workout session to log attendance.
                  </td>
                </tr>
              ) : (
                attendance.map(att => (
                  <tr key={att.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{att.id}</td>
                    <td className="p-4 font-bold text-gray-800">{att.fitnessClass?.name || 'Class Session'}</td>
                    <td className="p-4 text-gray-600">{att.fitnessClass?.trainer?.name || 'Staff Coach'}</td>
                    <td className="p-4 text-gray-600">{formatDate(att.checkedInAt)}</td>
                    <td className="p-4">
                      <NeuBadge variant={att.status === 'present' ? 'emerald' : att.status === 'absent' ? 'rose' : 'amber'} size="sm">
                        {att.status}
                      </NeuBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>
    </div>
  );
};
