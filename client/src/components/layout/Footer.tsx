import React from 'react';
import { Dumbbell, ShieldAlert, HeartHandshake } from 'lucide-react';
import { NeuBadge } from '../neumorphic/index.js';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 bg-[#e8ecf2] border-t border-gray-300/40 py-12 px-4 lg:px-8 text-gray-600">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center text-emerald-600">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-gray-900 block leading-tight">
                Mahesh Fitness Center
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Premium Club
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Train stronger. Move better. Live healthier. Experience next-generation digital fitness membership management.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Navigation</h5>
          <ul className="space-y-2 text-xs font-medium">
            <li><a href="/#memberships" className="hover:text-emerald-600 transition-colors">Membership Plans</a></li>
            <li><a href="/#classes" className="hover:text-emerald-600 transition-colors">Group Fitness Classes</a></li>
            <li><a href="/#trainers" className="hover:text-emerald-600 transition-colors">Elite Trainers</a></li>
            <li><a href="/login" className="hover:text-emerald-600 transition-colors">Member Sign In</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Center Hours & Contact</h5>
          <ul className="space-y-2 text-xs font-medium">
            <li>Mon – Sat: 05:00 AM – 10:30 PM</li>
            <li>Sunday: 06:00 AM – 08:00 PM</li>
            <li>Location: Jubilee Hills, Hyderabad, TS</li>
            <li>Phone: +91 98765 43210</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Simulator Disclaimer</h5>
          <div className="p-4 rounded-2xl neu-pressed text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>Demo Environment</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-normal">
              This application is a local fitness membership simulator. All payment transactions, bookings, and attendance records are simulated locally in <code>runtime.json</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-300/30 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} Mahesh Fitness Center. All simulated rights reserved.</p>
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-600" />
          <span>Built with React + TypeScript + Neumorphism UI</span>
        </div>
      </div>
    </footer>
  );
};
