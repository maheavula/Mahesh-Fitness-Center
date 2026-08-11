import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Flame,
  Clock,
  Dumbbell,
  CalendarDays,
  ChevronRight,
  Sparkles,
  ClipboardCheck,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { formatINR, formatDate, formatTime } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuProgress, NeuStatCard } from '../../components/neumorphic/index.js';

export const MemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await apiClient.getMemberDashboard();
        if (res.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-gray-300/40 rounded-3xl"></div>
          <div className="h-40 bg-gray-300/40 rounded-3xl"></div>
          <div className="h-40 bg-gray-300/40 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const sub = dashboardData?.subscription;
  const daysRemaining = dashboardData?.daysRemaining || 0;
  const stats = dashboardData?.stats;
  const upcomingClass = dashboardData?.upcomingClass;

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            Good day, {user?.name || 'Member'}! 👋
          </h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Ready for your next fitness session at Mahesh Fitness Center?
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/classes">
            <NeuButton variant="primary" size="sm">
              <CalendarDays className="w-4 h-4" /> Book a Class
            </NeuButton>
          </Link>
          <Link to="/app/activity">
            <NeuButton variant="secondary" size="sm">
              <Dumbbell className="w-4 h-4" /> Log Workout
            </NeuButton>
          </Link>
        </div>
      </div>

      {/* Grid: Membership Card & Weekly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Membership Summary Card */}
        <NeuCard className="lg:col-span-6 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Active Subscription</span>
              <h3 className="text-2xl font-black text-gray-900">
                {sub ? sub.plan?.name : 'No Active Membership'}
              </h3>
            </div>
            {sub ? (
              <NeuBadge variant="emerald">ACTIVE</NeuBadge>
            ) : (
              <NeuBadge variant="amber">ACTION NEEDED</NeuBadge>
            )}
          </div>

          {sub ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 neu-pressed rounded-2xl">
                  <span className="text-gray-500 block">Valid Until</span>
                  <span className="font-bold text-gray-800">{formatDate(sub.endDate)}</span>
                </div>
                <div className="p-3 neu-pressed rounded-2xl">
                  <span className="text-gray-500 block">Days Remaining</span>
                  <span className="font-bold text-emerald-600">{daysRemaining} days</span>
                </div>
              </div>

              <NeuProgress
                value={Math.max(10, Math.min(100, Math.round((daysRemaining / 90) * 100)))}
                label="Subscription Period"
                subtitle={`${daysRemaining} days left`}
              />
            </div>
          ) : (
            <div className="p-4 neu-pressed rounded-2xl text-xs space-y-2">
              <p className="text-gray-600">You currently have no active membership. Activate a plan to unlock group class bookings and trainer sessions.</p>
              <Link to="/app/membership" className="inline-block pt-1 font-bold text-emerald-600 hover:underline">
                Explore Membership Plans →
              </Link>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Link to="/app/membership">
              <NeuButton variant="secondary" size="sm">
                <CreditCard className="w-4 h-4" /> View Membership Details
              </NeuButton>
            </Link>
          </div>
        </NeuCard>

        {/* Weekly Activity Stat Cards */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <NeuStatCard
            title="Workouts Completed"
            value={stats?.workoutCount || 0}
            subtitle="Past 7 days"
            icon={<Dumbbell className="w-6 h-6" />}
          />
          <NeuStatCard
            title="Training Time"
            value={`${Math.floor((stats?.totalDurationMinutes || 0) / 60)}h ${(stats?.totalDurationMinutes || 0) % 60}m`}
            subtitle="Total duration"
            icon={<Clock className="w-6 h-6" />}
          />
          <NeuStatCard
            title="Calories Burned"
            value={stats?.totalCalories || 0}
            subtitle="Simulated active kcal"
            icon={<Flame className="w-6 h-6" />}
          />
          <NeuStatCard
            title="Gym Visits"
            value={stats?.totalVisits || 0}
            subtitle="Verified check-ins"
            icon={<ClipboardCheck className="w-6 h-6" />}
          />
        </div>
      </div>

      {/* Grid: Next Upcoming Class & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Upcoming Class */}
        <NeuCard className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-300/30 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-gray-900">Next Upcoming Class</h3>
            </div>
            <Link to="/app/bookings" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View All Bookings <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingClass ? (
            <div className="p-5 neu-pressed rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <NeuBadge variant="emerald" size="sm">{upcomingClass.category}</NeuBadge>
                  <span className="text-xs font-bold text-gray-600">{formatDate(upcomingClass.date)}</span>
                </div>
                <h4 className="text-lg font-extrabold text-gray-900">{upcomingClass.name}</h4>
                <p className="text-xs text-gray-500">{upcomingClass.location} • {formatTime(upcomingClass.startTime)} - {formatTime(upcomingClass.endTime)}</p>
                {upcomingClass.trainer && (
                  <p className="text-xs font-semibold text-emerald-600">Trainer: {upcomingClass.trainer.name}</p>
                )}
              </div>
              <Link to={`/app/classes/${upcomingClass.id}`}>
                <NeuButton variant="primary" size="sm">
                  Class Details
                </NeuButton>
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center neu-pressed rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-gray-600">You haven't booked any upcoming fitness classes yet.</p>
              <Link to="/app/classes">
                <NeuButton variant="primary" size="sm">
                  Browse Fitness Schedule
                </NeuButton>
              </Link>
            </div>
          )}
        </NeuCard>

        {/* Quick Actions Shortcuts */}
        <NeuCard className="lg:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300/30 pb-3">Quick Navigation</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/app/classes" className="p-4 neu-pressed rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-gray-200/50 transition-colors group">
              <CalendarDays className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800">Book Classes</span>
            </Link>
            <Link to="/app/attendance" className="p-4 neu-pressed rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-gray-200/50 transition-colors group">
              <ClipboardCheck className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800">View Attendance</span>
            </Link>
            <Link to="/app/trainers" className="p-4 neu-pressed rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-gray-200/50 transition-colors group">
              <UserCheck className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800">Browse Trainers</span>
            </Link>
            <Link to="/app/membership" className="p-4 neu-pressed rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-gray-200/50 transition-colors group">
              <CreditCard className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-gray-800">Manage Plan</span>
            </Link>
          </div>
        </NeuCard>
      </div>
    </div>
  );
};
