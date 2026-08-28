import React from 'react';
import { Dumbbell, HeartHandshake, Award } from 'lucide-react';

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
                AMR Fitness Center
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Premium Fitness & Athletic Club
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Train stronger. Move better. Live healthier. Experience world-class strength training, group fitness classes, and personalized coaching.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Quick Navigation</h5>
          <ul className="space-y-2 text-xs font-medium">
            <li><a href="/#memberships" className="hover:text-emerald-600 transition-colors">Membership Plans</a></li>
            <li><a href="/#classes" className="hover:text-emerald-600 transition-colors">Group Fitness Classes</a></li>
            <li><a href="/#trainers" className="hover:text-emerald-600 transition-colors">Elite Trainers</a></li>
            <li><a href="/login" className="hover:text-emerald-600 transition-colors">Member Sign In</a></li>
            <li><a href="/api/system/debug/error" target="_blank" rel="noreferrer" className="hover:text-rose-600 transition-colors">System Diagnostics</a></li>
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Center Hours & Contact</h5>
          <ul className="space-y-2 text-xs font-medium">
            <li>Mon – Sat: 05:00 AM – 10:30 PM</li>
            <li>Sunday: 06:00 AM – 08:00 PM</li>
            <li>Location: Main City Center Campus</li>
            <li>Phone: +91 98765 43210</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Facilities & Amenities</h5>
          <div className="p-4 rounded-2xl neu-pressed text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <Award className="w-4 h-4" />
              <span>World-Class Experience</span>
            </div>
            <ul className="text-[11px] text-gray-500 leading-normal space-y-1">
              <li>• Premium Strength Racks & Free Weights</li>
              <li>• Cardio & Endurance Zone</li>
              <li>• Group Fitness Studios</li>
              <li>• Certified Personal Coaching</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-300/30 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <p>© {new Date().getFullYear()} AMR Fitness Center. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-600" />
          <span>Built with React + TypeScript + Neumorphism UI</span>
        </div>
      </div>
    </footer>
  );
};
