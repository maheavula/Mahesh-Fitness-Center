import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, User, Mail, Phone, Lock, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { NeuCard, NeuButton, NeuInput, NeuSelect, NeuTabs } from '../../components/neumorphic/index.js';
import { Navbar } from '../../components/layout/Navbar.js';
import { Footer } from '../../components/layout/Footer.js';

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2 State
  const [fitnessGoal, setFitnessGoal] = useState('strength');
  const [heightCm, setHeightCm] = useState('175');
  const [dateOfBirth, setDateOfBirth] = useState('1998-01-01');

  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('Required Fields', 'Please complete name, email, and password.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Password Mismatch', 'Passwords do not match.', 'error');
      return;
    }
    setStep(2);
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name,
      email,
      phone,
      password,
      fitnessGoal,
      heightCm: Number(heightCm) || 175,
      dateOfBirth
    };

    const res = await signup(payload);
    setLoading(false);

    if (res.success) {
      showToast('Welcome to Mahesh Fitness!', 'Account created successfully.', 'success');
      if (planId) {
        navigate(`/app/membership?subscribe=${planId}`);
      } else {
        navigate('/app');
      }
    } else {
      showToast('Signup Error', res.error || 'Failed to create account.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ecf2]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg space-y-6">
          <NeuCard className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl neu-raised mx-auto flex items-center justify-center text-emerald-600 mb-2">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Join Mahesh Fitness Center</h2>
              <p className="text-xs text-gray-500">Step {step} of 2 — {step === 1 ? 'Account Credentials' : 'Fitness Preferences'}</p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <NeuInput
                  label="Full Name"
                  placeholder="Mahesh Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  icon={<User className="w-4 h-4" />}
                  required
                />
                <NeuInput
                  label="Email Address"
                  type="email"
                  placeholder="mahesh@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  required
                />
                <NeuInput
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                />
                <NeuInput
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
                <NeuInput
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />

                <NeuButton variant="primary" type="submit" className="w-full mt-4">
                  Continue to Fitness Preferences <ArrowRight className="w-4 h-4" />
                </NeuButton>
              </form>
            ) : (
              <form onSubmit={handleCompleteSignup} className="space-y-4">
                <NeuSelect
                  label="Primary Fitness Goal"
                  value={fitnessGoal}
                  onChange={e => setFitnessGoal(e.target.value)}
                  options={[
                    { label: 'Build Strength & Muscle', value: 'strength' },
                    { label: 'Weight Loss & Fat Burn', value: 'weight_loss' },
                    { label: 'Improve Cardiovascular Fitness', value: 'fitness' },
                    { label: 'Improve Flexibility & Mobility', value: 'mobility' },
                    { label: 'General Health & Wellness', value: 'wellness' }
                  ]}
                />

                <NeuInput
                  label="Height (cm)"
                  type="number"
                  placeholder="175"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                />

                <NeuInput
                  label="Date of Birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                />

                <div className="flex gap-3 pt-4">
                  <NeuButton variant="secondary" type="button" onClick={() => setStep(1)} className="w-1/3">
                    Back
                  </NeuButton>
                  <NeuButton variant="primary" type="submit" className="w-2/3" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Complete Sign Up'} <Check className="w-4 h-4" />
                  </NeuButton>
                </div>
              </form>
            )}

            <div className="pt-4 border-t border-gray-300/40 text-center text-xs">
              <span className="text-gray-500">Already a member? </span>
              <Link to="/login" className="font-bold text-emerald-600 hover:underline">
                Sign In
              </Link>
            </div>
          </NeuCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};
