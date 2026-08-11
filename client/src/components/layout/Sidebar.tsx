import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  CalendarDays,
  BookmarkCheck,
  ClipboardCheck,
  Activity,
  Users,
  User,
  Lock,
  UserCog,
  Dumbbell,
  Receipt,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const memberNav = [
    { label: 'Overview', to: '/app', icon: LayoutDashboard, end: true },
    { label: 'Membership', to: '/app/membership', icon: CreditCard },
    { label: 'Classes', to: '/app/classes', icon: CalendarDays },
    { label: 'My Bookings', to: '/app/bookings', icon: BookmarkCheck },
    { label: 'Attendance', to: '/app/attendance', icon: ClipboardCheck },
    { label: 'Activity', to: '/app/activity', icon: Activity },
    { label: 'Trainers', to: '/app/trainers', icon: Users },
    { label: 'Profile', to: '/app/profile', icon: User },
    { label: 'Security', to: '/app/security', icon: Lock },
  ];

  const adminNav = [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Members', to: '/admin/members', icon: Users },
    { label: 'Membership Plans', to: '/admin/plans', icon: CreditCard },
    { label: 'Trainers', to: '/admin/trainers', icon: UserCog },
    { label: 'Classes', to: '/admin/classes', icon: Dumbbell },
    { label: 'Bookings', to: '/admin/bookings', icon: BookmarkCheck },
    { label: 'Attendance', to: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Payments', to: '/admin/payments', icon: Receipt },
    { label: 'Audit Logs', to: '/admin/audit', icon: FileText },
    { label: 'System', to: '/admin/system', icon: Settings },
  ];

  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-20 p-4 neu-card flex flex-col gap-2">
        <div className="px-3 py-2 border-b border-gray-300/30 mb-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 block">
            {isAdmin ? 'Gym Operations Center' : 'Member Portal'}
          </span>
        </div>
        <nav className="flex flex-col gap-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'neu-pressed text-emerald-600 font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/40'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
