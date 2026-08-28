import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { apiClient } from '../../services/apiClient.js';
import { NeuCard, NeuButton, NeuInput, NeuModal } from '../../components/neumorphic/index.js';
import { Navbar } from '../../components/layout/Navbar.js';
import { Footer } from '../../components/layout/Footer.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Validation Error', 'Please enter email and password.', 'warning');
      return;
    }

    setLoading(true);
    const res = await login({ email, password });
    setLoading(false);

    if (res.success) {
      showToast('Welcome Back!', 'Logged in successfully.', 'success');
      navigate('/app');
    } else {
      showToast('Login Failed', res.error || 'Invalid credentials.', 'error');
    }
  };

  // Step 1: Trigger POST /api/auth/forgot-password over HTTP proxy
  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      showToast('Validation Error', 'Please enter your account email.', 'warning');
      return;
    }

    setResetLoading(true);
    const res = await apiClient.forgotPassword({ email: resetEmail });
    setResetLoading(false);

    if (res.success) {
      setResetToken('');
      setResetStep(2);
      showToast('Reset Token Sent', 'A password reset token has been issued.', 'success');
    } else {
      showToast('Request Failed', res.error?.message || 'Account not found.', 'error');
    }
  };

  // Step 2: Trigger POST /api/auth/reset-password-with-token over HTTP proxy
  const handleResetWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetToken || !newPassword) {
      showToast('Validation Error', 'Please enter target email, reset token, and new password.', 'warning');
      return;
    }

    setResetLoading(true);
    const res = await apiClient.resetPasswordWithToken({
      email: resetEmail,
      resetToken,
      newPassword
    });
    setResetLoading(false);

    if (res.success) {
      showToast('Password Updated!', res.data?.message || 'Password reset with token successfully.', 'success');
      setIsForgotOpen(false);
      setEmail(resetEmail);
      setPassword(newPassword);
      setResetStep(1);
    } else {
      showToast('Reset Failed', res.error?.message || 'Invalid or forged reset token.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ecf2]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md space-y-6">
          <NeuCard className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl neu-raised mx-auto flex items-center justify-center text-emerald-600 mb-3">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Welcome Back</h2>
              <p className="text-xs text-gray-500">Continue your AMR Fitness journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <NeuInput
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1">
                <div className="relative">
                  <NeuInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    icon={<Lock className="w-4 h-4" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setResetEmail(email || ''); setResetStep(1); setResetToken(''); setIsForgotOpen(true); }}
                    className="text-[11px] font-semibold text-emerald-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <NeuButton variant="primary" type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
              </NeuButton>
            </form>

            <div className="pt-4 border-t border-gray-300/40 text-center text-xs">
              <span className="text-gray-500">Don't have an account? </span>
              <Link to="/signup" className="font-bold text-emerald-600 hover:underline">
                Create Account
              </Link>
            </div>
          </NeuCard>
        </div>
      </main>

      {/* Interactive 2-Step Password Reset & Token Forgery Modal */}
      <NeuModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={resetStep === 1 ? "Forgot Password — Step 1: Request Token" : "Forgot Password — Step 2: Reset with Token"}
      >
        {resetStep === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <NeuInput
              label="Account Email"
              type="email"
              placeholder="name@example.com"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setResetStep(2)}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                Already have a token? Proceed to Step 2 →
              </button>
              <NeuButton type="submit" variant="primary" disabled={resetLoading}>
                {resetLoading ? 'Issuing Token...' : 'Request Reset Token'}
              </NeuButton>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetWithToken} className="space-y-4">
            <NeuInput
              label="Target Account Email"
              type="email"
              placeholder="name@example.com"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />
            <NeuInput
              label="Reset Token"
              placeholder="Enter reset token"
              value={resetToken}
              onChange={e => setResetToken(e.target.value)}
              icon={<KeyRound className="w-4 h-4" />}
              required
            />
            <NeuInput
              label="New Password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="flex justify-between items-center gap-3 pt-2">
              <NeuButton type="button" variant="secondary" onClick={() => setResetStep(1)}>
                Back to Step 1
              </NeuButton>
              <NeuButton type="submit" variant="primary" disabled={resetLoading}>
                {resetLoading ? 'Resetting...' : 'Confirm Reset'}
              </NeuButton>
            </div>
          </form>
        )}
      </NeuModal>

      <Footer />
    </div>
  );
};
