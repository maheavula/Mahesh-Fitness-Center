import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CreditCard,
  CalendarDays,
  Receipt,
  TrendingUp,
  ShieldCheck,
  ClipboardCheck,
  UserCheck,
  ChevronRight,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { apiClient } from '../../services/apiClient.js';
import { formatINR, formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuStatCard } from '../../components/neumorphic/index.js';

export const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminDashboard() {
      try {
        const res = await apiClient.getAdminDashboard();
        if (res.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300/50 rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-32 bg-gray-300/40 rounded-3xl"></div>
          <div className="h-32 bg-gray-300/40 rounded-3xl"></div>
          <div className="h-32 bg-gray-300/40 rounded-3xl"></div>
          <div className="h-32 bg-gray-300/40 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats;
  const revenueChart = dashboardData?.revenueChart || [];
  const recentPayments = dashboardData?.recentPayments || [];
  const recentAudits = dashboardData?.recentAuditLogs || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <NeuBadge variant="rose" size="sm">Admin Console</NeuBadge>
            <span className="text-xs font-bold text-gray-500">Live Simulator Engine</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mt-1">
            Gym Operations Center
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/members">
            <NeuButton variant="secondary" size="sm">
              <Users className="w-4 h-4" /> Manage Members
            </NeuButton>
          </Link>
          <Link to="/admin/classes">
            <NeuButton variant="primary" size="sm">
              <CalendarDays className="w-4 h-4" /> Schedule Class
            </NeuButton>
          </Link>
        </div>
      </div>

      {/* Key Operations Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuStatCard
          title="Total Members"
          value={stats?.totalMembers || 0}
          subtitle={`${stats?.activeMembers || 0} Active / ${stats?.suspendedMembers || 0} Suspended`}
          icon={<Users className="w-6 h-6 text-emerald-600" />}
        />
        <NeuStatCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          subtitle="Paid plan members"
          icon={<CreditCard className="w-6 h-6 text-blue-600" />}
        />
        <NeuStatCard
          title="Classes Today"
          value={stats?.classesToday || 0}
          subtitle={`${stats?.bookingsToday || 0} Total bookings`}
          icon={<CalendarDays className="w-6 h-6 text-purple-600" />}
        />
        <NeuStatCard
          title="Simulated Revenue"
          value={formatINR(stats?.totalRevenuePaise || 0)}
          subtitle="Lifetime payments"
          icon={<Receipt className="w-6 h-6 text-amber-600" />}
        />
      </div>

      {/* Revenue & Growth Chart Section */}
      <NeuCard className="p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-300/30 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Simulated Revenue Growth (₹)
            </h3>
            <p className="text-xs text-gray-500">Monthly subscription & membership payment analytics</p>
          </div>
          <NeuBadge variant="emerald" size="sm">INR (₹)</NeuBadge>
        </div>

        <div className="h-64 w-full">
          {revenueChart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-gray-500">
              No revenue records logged yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#d0d5e0" vertical={false} />
                <XAxis dataKey="month" stroke="#718096" fontSize={11} tickLine={false} />
                <YAxis stroke="#718096" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#e8ecf2', borderRadius: '12px', border: 'none', boxShadow: '4px 4px 10px #c4c9d4' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </NeuCard>

      {/* Grid: Recent Payments & Audit Logs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Payments Ledger */}
        <NeuCard className="lg:col-span-7 p-0 overflow-hidden space-y-4">
          <div className="p-6 border-b border-gray-300/40 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Payment Ledger</h3>
            <Link to="/admin/payments" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View All Payments <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-200/40 uppercase tracking-wider font-extrabold text-gray-600 border-b border-gray-300/40">
                <tr>
                  <th className="p-4">Payment ID</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300/30">
                {recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-200/30">
                    <td className="p-4 font-mono font-bold text-gray-900">{p.id}</td>
                    <td className="p-4 font-semibold text-gray-800">{p.description}</td>
                    <td className="p-4 font-black text-gray-900">{formatINR(p.amountPaise)}</td>
                    <td className="p-4 text-gray-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeuCard>

        {/* Audit Logs Preview */}
        <NeuCard className="lg:col-span-5 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-300/40 pb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Audit Trail
            </h3>
            <Link to="/admin/audit" className="text-xs font-bold text-emerald-600 hover:underline">
              Full Logs
            </Link>
          </div>

          <div className="space-y-3">
            {recentAudits.map((log: any) => (
              <div key={log.id} className="p-3 neu-pressed rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">{log.action}</span>
                  <span className="text-[10px] text-gray-400">{formatDate(log.timestamp)}</span>
                </div>
                <p className="text-gray-700 font-semibold truncate">User: {log.userId}</p>
              </div>
            ))}
          </div>
        </NeuCard>
      </div>
    </div>
  );
};
