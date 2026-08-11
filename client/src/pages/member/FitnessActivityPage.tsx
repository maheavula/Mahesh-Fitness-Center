import React, { useEffect, useState } from 'react';
import { Activity, Flame, Clock, Plus, Zap, Trophy, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { Activity as ActivityModel } from '../../types/index.js';
import { formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuStatCard, NeuModal, NeuInput, NeuSelect } from '../../components/neumorphic/index.js';

export const FitnessActivityPage: React.FC = () => {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<ActivityModel[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, totalHours: 0, totalCalories: 0, streakDays: 0 });
  const [loading, setLoading] = useState(true);

  // Log Activity Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('workout');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [calories, setCalories] = useState('320');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadActivityData = async () => {
    try {
      const [actRes, statsRes] = await Promise.all([
        apiClient.getMemberActivity(),
        apiClient.getMemberStats()
      ]);

      if (actRes.success) setActivities(actRes.data.activities || []);
      if (statsRes.success) setStats(statsRes.data || { totalWorkouts: 0, totalHours: 0, totalCalories: 0, streakDays: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivityData();
  }, []);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await apiClient.logMemberActivity({
      type,
      durationMinutes: Number(durationMinutes),
      calories: Number(calories),
      date
    });

    setIsSubmitting(false);
    if (res.success) {
      showToast('Workout Recorded!', `${durationMinutes} minutes of ${type} logged.`, 'success');
      setIsModalOpen(false);
      await loadActivityData();
    } else {
      showToast('Error', res.error?.message || 'Failed to log workout.', 'error');
    }
  };

  // Group activities by date for BarChart visualization
  const chartData = activities.slice(0, 7).reverse().map(a => ({
    date: formatDate(a.date).substring(0, 6),
    minutes: a.durationMinutes,
    calories: a.calories
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Fitness Activity & Analytics</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Track your training duration, simulated calorie expenditure, and consistency streak.
          </p>
        </div>
        <NeuButton variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Log Workout Session
        </NeuButton>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuStatCard
          title="Total Workouts"
          value={stats.totalWorkouts}
          subtitle="Completed sessions"
          icon={<Activity className="w-6 h-6 text-emerald-600" />}
        />
        <NeuStatCard
          title="Training Hours"
          value={`${stats.totalHours} hrs`}
          subtitle="Time spent training"
          icon={<Clock className="w-6 h-6 text-blue-600" />}
        />
        <NeuStatCard
          title="Simulated Calories"
          value={stats.totalCalories}
          subtitle="Estimated kcal"
          icon={<Flame className="w-6 h-6 text-amber-600" />}
        />
        <NeuStatCard
          title="Activity Streak"
          value={`${stats.streakDays} Days`}
          subtitle="Consistency streak"
          icon={<Trophy className="w-6 h-6 text-purple-600" />}
        />
      </div>

      {/* Activity Chart Section */}
      <NeuCard className="p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-300/30 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Training Duration (Minutes)</h3>
            <p className="text-xs text-gray-500">Simulated workout metrics across recent sessions</p>
          </div>
          <NeuBadge variant="gray" size="sm">Simulated Data</NeuBadge>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              No workout logs available yet. Click "Log Workout Session" above to add your first entry.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d0d5e0" vertical={false} />
                <XAxis dataKey="date" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#e8ecf2', borderRadius: '12px', border: 'none', boxShadow: '4px 4px 10px #c4c9d4' }}
                />
                <Bar dataKey="minutes" fill="#10b981" radius={[8, 8, 0, 0]} name="Duration (min)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </NeuCard>

      {/* Activity History List */}
      <NeuCard className="p-0 overflow-hidden space-y-4">
        <div className="p-6 border-b border-gray-300/40">
          <h3 className="text-lg font-bold text-gray-900">Recent Activity Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
              <tr>
                <th className="p-4">Activity ID</th>
                <th className="p-4">Type</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Calories</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300/30">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">No workout records found.</td>
                </tr>
              ) : (
                activities.map(a => (
                  <tr key={a.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{a.id}</td>
                    <td className="p-4 uppercase font-bold text-emerald-700">{a.type}</td>
                    <td className="p-4 font-semibold text-gray-800">{a.durationMinutes} mins</td>
                    <td className="p-4 font-bold text-amber-600">{a.calories} kcal</td>
                    <td className="p-4 text-gray-500">{formatDate(a.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* Log Activity Modal */}
      <NeuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Workout Activity"
      >
        <form onSubmit={handleLogActivity} className="space-y-4">
          <NeuSelect
            label="Workout Type"
            value={type}
            onChange={e => setType(e.target.value)}
            options={[
              { label: 'Gym Workout / Free Weights', value: 'workout' },
              { label: 'Group Fitness Class', value: 'class' },
              { label: 'Cardio / Treadmill / Rower', value: 'cardio' },
              { label: 'Heavy Power Strength', value: 'strength' },
              { label: 'Mobility & Stretching', value: 'mobility' }
            ]}
          />

          <NeuInput
            label="Duration (Minutes)"
            type="number"
            value={durationMinutes}
            onChange={e => setDurationMinutes(e.target.value)}
            required
          />

          <NeuInput
            label="Simulated Calories (kcal)"
            type="number"
            value={calories}
            onChange={e => setCalories(e.target.value)}
            required
          />

          <NeuInput
            label="Workout Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-2">
            <NeuButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuButton>
            <NeuButton variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Activity'}
            </NeuButton>
          </div>
        </form>
      </NeuModal>
    </div>
  );
};
