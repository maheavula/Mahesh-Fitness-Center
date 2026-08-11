import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Key, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { apiClient } from '../../services/apiClient.js';
import { formatDate } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuInput } from '../../components/neumorphic/index.js';

export const SecurityPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Simulated Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await apiClient.getSystemSession();
      if (res.success) {
        setSessionInfo(res.data.session);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleRefreshSession = async () => {
    const res = await apiClient.refreshSystemSession();
    if (res.success) {
      showToast('Session Refreshed', 'Session expiry extended by 24 hours.', 'success');
      await fetchSession();
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Validation Error', 'Please complete password fields.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Password Mismatch', 'New passwords do not match.', 'error');
      return;
    }

    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      showToast('Password Updated', 'Simulated password change completed successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 600);
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed Out', 'You have been signed out safely.', 'info');
    navigate('/');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Security & Sessions</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Monitor your active login sessions and manage security settings.
        </p>
      </div>

      {/* Active Session Overview */}
      <NeuCard className="p-6 lg:p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-300/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Current Session</h3>
              <p className="text-xs text-gray-500">Authenticated via Server-Side HTTP Cookie</p>
            </div>
          </div>
          <NeuBadge variant="emerald">ACTIVE</NeuBadge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 neu-pressed rounded-2xl">
            <span className="text-gray-500 block">User Role</span>
            <span className="font-extrabold text-gray-800 uppercase">{user?.role}</span>
          </div>
          <div className="p-4 neu-pressed rounded-2xl">
            <span className="text-gray-500 block">Last Activity</span>
            <span className="font-bold text-gray-800">{sessionInfo ? formatDate(sessionInfo.lastActivityAt) : 'Just now'}</span>
          </div>
          <div className="p-4 neu-pressed rounded-2xl">
            <span className="text-gray-500 block">Session Expiration</span>
            <span className="font-bold text-emerald-600">{sessionInfo ? formatDate(sessionInfo.expiresAt) : '24 hours'}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <NeuButton variant="secondary" size="sm" onClick={handleRefreshSession}>
            <RefreshCw className="w-4 h-4" /> Refresh Session Token
          </NeuButton>
          <NeuButton variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </NeuButton>
        </div>
      </NeuCard>

      {/* Password Update Card */}
      <NeuCard className="p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-300/40 pb-4">
          <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center text-blue-600">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
            <p className="text-xs text-gray-500">Update your account password</p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <NeuInput
            label="Current Password"
            type="password"
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
          />

          <NeuInput
            label="New Password"
            type="password"
            placeholder="••••••••••••"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />

          <NeuInput
            label="Confirm New Password"
            type="password"
            placeholder="••••••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          <div className="pt-2">
            <NeuButton variant="primary" type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Password'}
            </NeuButton>
          </div>
        </form>
      </NeuCard>
    </div>
  );
};
