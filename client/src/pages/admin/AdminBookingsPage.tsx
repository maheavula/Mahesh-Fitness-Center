import React, { useEffect, useState } from 'react';
import { BookmarkCheck, Calendar, User, Search } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { NeuCard, NeuBadge, NeuInput } from '../../components/neumorphic/index.js';

export const AdminBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await apiClient.getAdminBookings();
        if (res.success) setBookings(res.data.bookings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const filtered = bookings.filter(b => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      b.id.toLowerCase().includes(term) ||
      b.fitnessClass?.name?.toLowerCase().includes(term) ||
      b.memberUser?.name?.toLowerCase().includes(term) ||
      b.memberUser?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Member Bookings Overview</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Inspect all group fitness class reservations across the center.
        </p>
      </div>

      <NeuCard className="p-6">
        <div className="w-full md:w-80">
          <NeuInput
            placeholder="Search booking ID, member, class..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </NeuCard>

      <NeuCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Booking ID</th>
                <th className="p-4">Member Name</th>
                <th className="p-4">Class</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Status</th>
                <th className="p-4">Booked At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-semibold">No bookings found.</td>
                </tr>
              ) : (
                filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{b.id}</td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 block">{b.memberUser?.name || 'Member'}</span>
                      <span className="text-[11px] text-gray-500 block">{b.memberUser?.email}</span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">{b.fitnessClass?.name || 'Class'}</td>
                    <td className="p-4 text-gray-600">{formatDate(b.fitnessClass?.date)} • {formatTime(b.fitnessClass?.startTime)}</td>
                    <td className="p-4">
                      <NeuBadge variant={b.status === 'confirmed' ? 'emerald' : 'rose'} size="sm">
                        {b.status}
                      </NeuBadge>
                    </td>
                    <td className="p-4 text-gray-500">{formatDate(b.bookedAt)}</td>
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
