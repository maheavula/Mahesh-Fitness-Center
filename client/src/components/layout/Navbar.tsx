import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, ShieldCheck, UserCheck, LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { NeuButton, NeuBadge, NeuAvatar } from '../neumorphic/index.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#e8ecf2]/90 backdrop-blur-md border-b border-gray-300/30 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Monogram & Name */}
        <Link to={user ? (user.role === 'admin' ? '/admin' : '/app') : '/'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-gray-900 block leading-tight">
              Mahesh Fitness
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Center
            </span>
          </div>
        </Link>

        {/* Global Quick Search (Visual Sim) */}
        <div className="hidden md:flex items-center flex-1 max-w-xs mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search classes, trainers..."
              className="w-full pl-9 pr-4 py-1.5 text-xs neu-input rounded-xl focus:outline-none"
              onClick={() => {
                if (user?.role === 'member') navigate('/app/classes');
              }}
            />
          </div>
        </div>

        {/* User Actions & Navigation */}
        <div className="flex items-center gap-3">
          <NeuBadge variant="gray" size="sm">
            DEMO SIMULATOR
          </NeuBadge>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {user.role === 'admin' ? (
                  <NeuBadge variant="rose" size="sm">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </NeuBadge>
                ) : (
                  <NeuBadge variant="emerald" size="sm">
                    <UserCheck className="w-3 h-3" /> Member
                  </NeuBadge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link to={user.role === 'admin' ? '/admin' : '/app/profile'}>
                  <NeuAvatar name={user.name} size="sm" />
                </Link>
                <div className="hidden md:block text-left">
                  <span className="text-xs font-bold text-gray-800 block leading-none">{user.name}</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">{user.email}</span>
                </div>
              </div>

              <NeuButton variant="ghost" size="sm" onClick={handleLogout} title="Sign Out">
                <LogOut className="w-4 h-4 text-rose-500" />
              </NeuButton>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <NeuButton variant="secondary" size="sm">
                  Sign In
                </NeuButton>
              </Link>
              <Link to="/signup">
                <NeuButton variant="primary" size="sm">
                  Join Now
                </NeuButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
