import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, ShieldCheck, UserCheck, LogOut, Search, CalendarDays, UserCog, CreditCard, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { apiClient } from '../../services/apiClient.js';
import { FitnessClass, Trainer, MembershipPlan } from '../../types/index.js';
import { NeuButton, NeuBadge, NeuAvatar } from '../neumorphic/index.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    classes: FitnessClass[];
    trainers: Trainer[];
    plans: MembershipPlan[];
  }>({ classes: [], trainers: [], plans: [] });

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch search data dynamically
  useEffect(() => {
    if (!query.trim()) {
      setResults({ classes: [], trainers: [], plans: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [clsRes, trnRes, planRes] = await Promise.all([
          apiClient.getClasses({ search: query }),
          apiClient.getTrainers(),
          apiClient.getMembershipPlans()
        ]);

        const matchingClasses = clsRes.success ? (clsRes.data.classes || []).slice(0, 3) : [];
        const matchingTrainers = trnRes.success
          ? (trnRes.data.trainers || []).filter((t: Trainer) =>
              t.name.toLowerCase().includes(query.toLowerCase()) ||
              t.specialization.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 2)
          : [];
        const matchingPlans = planRes.success
          ? (planRes.data.plans || []).filter((p: MembershipPlan) =>
              p.name.toLowerCase().includes(query.toLowerCase()) ||
              p.description.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 2)
          : [];

        setResults({
          classes: matchingClasses,
          trainers: matchingTrainers,
          plans: matchingPlans
        });
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);

    if (user?.role === 'admin') {
      navigate(`/admin/classes?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/app/classes?search=${encodeURIComponent(query)}`);
    }
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

        {/* Global Live Interactive Search Control (Hidden on Landing Page) */}
        {!isLandingPage && (
          <div ref={searchContainerRef} className="relative hidden md:flex items-center flex-1 max-w-md mx-6">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => { if (query.trim()) setIsOpen(true); }}
                placeholder="Search classes, trainers, or plans..."
                className="w-full pl-9 pr-8 py-2 text-xs neu-input rounded-2xl focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setIsOpen(false); }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

          {/* Live Search Results Dropdown */}
          {isOpen && (
            <div className="absolute top-12 left-0 right-0 z-50 neu-card p-4 space-y-3 max-h-96 overflow-y-auto animate-fade-in text-xs">
              {results.classes.length === 0 && results.trainers.length === 0 && results.plans.length === 0 ? (
                <div className="text-center text-gray-500 py-3">No matching results for "{query}"</div>
              ) : (
                <>
                  {/* Classes Matches */}
                  {results.classes.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 block">Fitness Classes</span>
                      {results.classes.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(user?.role === 'admin' ? '/admin/classes' : `/app/classes?search=${encodeURIComponent(c.name)}`);
                          }}
                          className="p-2.5 neu-pressed rounded-xl flex items-center justify-between hover:bg-gray-200/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="font-bold text-gray-900 block">{c.name}</span>
                              <span className="text-[10px] text-gray-500">{c.category} • {c.date}</span>
                            </div>
                          </div>
                          <NeuBadge variant="emerald" size="sm">{c.capacity - c.bookedCount} spots left</NeuBadge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trainers Matches */}
                  {results.trainers.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 block">Coaches & Trainers</span>
                      {results.trainers.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(user?.role === 'admin' ? '/admin/trainers' : '/app/trainers');
                          }}
                          className="p-2.5 neu-pressed rounded-xl flex items-center justify-between hover:bg-gray-200/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-purple-600" />
                            <div>
                              <span className="font-bold text-gray-900 block">{t.name}</span>
                              <span className="text-[10px] text-gray-500">{t.specialization}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400">{t.experienceYears}y Exp</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Plans Matches */}
                  {results.plans.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 block">Membership Tiers</span>
                      {results.plans.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setIsOpen(false);
                            navigate(user?.role === 'admin' ? '/admin/plans' : '/app/membership');
                          }}
                          className="p-2.5 neu-pressed rounded-xl flex items-center justify-between hover:bg-gray-200/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-amber-600" />
                            <div>
                              <span className="font-bold text-gray-900 block">{p.name}</span>
                              <span className="text-[10px] text-gray-500">{p.durationMonths} Months</span>
                            </div>
                          </div>
                          <span className="font-bold text-emerald-700">₹{(p.pricePaise / 100).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        )}

        {/* User Actions & Navigation */}
        <div className="flex items-center gap-3">
          <NeuBadge variant="gray" size="sm" className="hidden sm:inline-flex">
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
