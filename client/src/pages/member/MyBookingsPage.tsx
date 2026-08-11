import React, { useEffect, useState } from 'react';
import { BookmarkCheck, Calendar, Clock, MapPin, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { Booking } from '../../types/index.js';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuModal } from '../../components/neumorphic/index.js';

export const MyBookingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadBookings = async () => {
    try {
      const res = await apiClient.getMyBookings();
      if (res.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);

    const res = await apiClient.cancelBooking(cancelTarget.id);
    setIsCancelling(false);

    if (res.success) {
      showToast('Booking Cancelled', 'Your spot has been released.', 'info');
      setCancelTarget(null);
      await loadBookings();
    } else {
      showToast('Cancellation Error', res.error?.message || 'Failed to cancel booking.', 'error');
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status !== 'confirmed');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">My Class Bookings</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Manage your upcoming gym sessions and view booking history.
        </p>
      </div>

      {/* Upcoming Bookings Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BookmarkCheck className="w-5 h-5 text-emerald-600" /> Upcoming Sessions ({upcomingBookings.length})
        </h3>

        {upcomingBookings.length === 0 ? (
          <NeuCard className="p-8 text-center text-gray-500 space-y-2">
            <p className="text-sm font-semibold">You have no active upcoming class bookings.</p>
          </NeuCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingBookings.map(b => (
              <NeuCard key={b.id} hoverable className="space-y-4">
                <div className="flex justify-between items-center">
                  <NeuBadge variant="emerald">{b.fitnessClass?.category || 'Fitness'}</NeuBadge>
                  <NeuBadge variant="emerald" size="sm">CONFIRMED</NeuBadge>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-gray-900">{b.fitnessClass?.name}</h4>
                  <p className="text-xs text-gray-500">{b.fitnessClass?.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-300/40 text-xs font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{formatDate(b.fitnessClass?.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>{formatTime(b.fitnessClass?.startTime)} - {formatTime(b.fitnessClass?.endTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>{b.fitnessClass?.location}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-300/40 flex justify-between items-center">
                  <span className="text-[11px] font-mono text-gray-400">{b.id}</span>
                  <NeuButton variant="danger" size="sm" onClick={() => setCancelTarget(b)}>
                    <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                  </NeuButton>
                </div>
              </NeuCard>
            ))}
          </div>
        )}
      </div>

      {/* Past / Cancelled Bookings */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Booking History</h3>
        <NeuCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
                <tr>
                  <th className="p-4">Booking ID</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Booked At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300/30">
                {pastBookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">No past bookings recorded.</td>
                  </tr>
                ) : (
                  pastBookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-200/30">
                      <td className="p-4 font-mono font-bold text-gray-900">{b.id}</td>
                      <td className="p-4 font-bold text-gray-800">{b.fitnessClass?.name || 'Class'}</td>
                      <td className="p-4 text-gray-600">{formatDate(b.fitnessClass?.date)} • {formatTime(b.fitnessClass?.startTime)}</td>
                      <td className="p-4">
                        <NeuBadge variant={b.status === 'completed' ? 'emerald' : 'rose'} size="sm">
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

      {/* Cancel Confirmation Modal */}
      <NeuModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Confirm Booking Cancellation"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600">
              Are you sure you want to cancel your reservation for <strong className="text-gray-900">{cancelTarget.fitnessClass?.name}</strong> on {formatDate(cancelTarget.fitnessClass?.date)}?
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>This will release your spot to other members.</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <NeuButton variant="secondary" onClick={() => setCancelTarget(null)}>
                Keep Booking
              </NeuButton>
              <NeuButton variant="danger" onClick={handleConfirmCancel} disabled={isCancelling}>
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </NeuButton>
            </div>
          </div>
        )}
      </NeuModal>
    </div>
  );
};
