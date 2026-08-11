import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, Database, Layers, CheckCircle2, Server, Cpu } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { NeuCard, NeuBadge } from '../../components/neumorphic/index.js';

export const AdminSystemPage: React.FC = () => {
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSystem() {
      try {
        const res = await apiClient.getSystemInfo();
        if (res.success) setSysInfo(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSystem();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">System Information</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Platform environment, datastore health, and API group specifications.
          </p>
        </div>
        <NeuBadge variant="rose" size="md">DEMO ENVIRONMENT</NeuBadge>
      </div>

      <NeuCard className="p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-300/40 pb-4">
          <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center text-emerald-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Mahesh Fitness Center Runtime</h3>
            <p className="text-xs text-gray-500">Standalone Full-Stack Fitness Membership Simulator</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 neu-pressed rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Application Name</span>
            <span className="text-sm font-extrabold text-gray-900">{sysInfo?.application || 'Mahesh Fitness Center'}</span>
          </div>

          <div className="p-4 neu-pressed rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Application Mode</span>
            <span className="text-sm font-extrabold text-emerald-600">{sysInfo?.mode || 'Simulator'}</span>
          </div>

          <div className="p-4 neu-pressed rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Health Status</span>
            <span className="text-sm font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {sysInfo?.status || 'Online'}
            </span>
          </div>

          <div className="p-4 neu-pressed rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Persistence Datastore</span>
            <span className="text-sm font-extrabold font-mono text-gray-900">{sysInfo?.persistence || 'runtime.json'}</span>
          </div>

          <div className="p-4 neu-pressed rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Architectural API Limit</span>
            <span className="text-sm font-extrabold text-blue-600">Exactly {sysInfo?.apiGroups || 6} API Groups</span>
          </div>

          <div className="p-4 neu-pressed rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Version & Uptime</span>
            <span className="text-sm font-extrabold text-gray-900">v{sysInfo?.version || '1.0.0'} ({sysInfo?.uptime || 0}s uptime)</span>
          </div>
        </div>

        <div className="p-6 neu-pressed rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Six Logical API Groups Architecture
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 neu-raised rounded-xl text-gray-800">1. /api/auth (Authentication & Accounts)</div>
            <div className="p-2 neu-raised rounded-xl text-gray-800">2. /api/member (Profiles, Stats & Activity)</div>
            <div className="p-2 neu-raised rounded-xl text-gray-800">3. /api/classes (Discovery & Bookings)</div>
            <div className="p-2 neu-raised rounded-xl text-gray-800">4. /api/membership (Plans & Payments)</div>
            <div className="p-2 neu-raised rounded-xl text-gray-800">5. /api/admin (Gym Operations Center)</div>
            <div className="p-2 neu-raised rounded-xl text-gray-800">6. /api/system (Sessions & Health)</div>
          </div>
        </div>
      </NeuCard>
    </div>
  );
};
