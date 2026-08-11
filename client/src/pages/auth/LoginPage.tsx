import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff, Lock, Mail, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { NeuCard, NeuButton, NeuInput, NeuBadge } from '../../components/neumorphic/index.js';
import { Navbar } from '../../components/layout/Navbar.js';
import { Footer } from '../../components/layout/Footer.js';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
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
              <p className="text-xs text-gray-500">Continue your Mahesh Fitness Center journey</p>
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

          {/* Demo Accounts Quick-Fill Section */}
          <NeuCard className="p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-gray-500 text-[10px]">
                Demo Quick Sign In
              </span>
              <NeuBadge variant="gray" size="sm">Simulator</NeuBadge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickFill('member@maheshfitness.local', 'Member@12345')}
                className="p-3 neu-pressed rounded-2xl text-left hover:border-emerald-400 transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs group-hover:text-emerald-600">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Demo Member</span>
                </div>
                <span className="text-[10px] text-gray-500 block truncate mt-1">member@maheshfitness.local</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@maheshfitness.local', 'Admin@12345')}
                className="p-3 neu-pressed rounded-2xl text-left hover:border-rose-400 transition-colors group"
              >
                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs group-hover:text-rose-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                  <span>Demo Admin</span>
                </div>
                <span className="text-[10px] text-gray-500 block truncate mt-1">admin@maheshfitness.local</span>
              </button>
            </div>
          </NeuCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};
