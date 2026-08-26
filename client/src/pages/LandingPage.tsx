import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ShieldCheck, Flame, Users, Sparkles, ChevronRight, Check, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/apiClient.js';
import { MembershipPlan, FitnessClass, Trainer } from '../types/index.js';
import { formatINR } from '../utils/formatters.js';
import { NeuButton, NeuCard, NeuBadge, NeuAvatar } from '../components/neumorphic/index.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Footer } from '../components/layout/Footer.js';

export const LandingPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const [plansRes, classesRes, trainersRes] = await Promise.all([
          apiClient.getMembershipPlans(),
          apiClient.getClasses(),
          apiClient.getTrainers()
        ]);

        if (plansRes.success) setPlans(plansRes.data.plans || []);
        if (classesRes.success) setClasses((classesRes.data.classes || []).slice(0, 4));
        if (trainersRes.success) setTrainers((trainersRes.data.trainers || []).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ecf2]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 px-4 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <NeuBadge variant="emerald" size="md">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Fitness Platform
            </NeuBadge>
            <h1 className="text-4xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Train Stronger. <br />
              <span className="text-emerald-600">Move Better.</span> <br />
              Live Healthier.
            </h1>
            <p className="text-base lg:text-lg text-gray-600 max-w-xl leading-relaxed">
              Welcome to AMR Fitness. A premium fitness and athletic club combining world-class strength equipment, expert personal trainers, and group class bookings.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link to="/signup">
                <NeuButton variant="primary" size="lg">
                  Join Now <ArrowRight className="w-5 h-5" />
                </NeuButton>
              </Link>
              <a href="#memberships">
                <NeuButton variant="secondary" size="lg">
                  Explore Memberships
                </NeuButton>
              </a>
            </div>

            <div className="pt-8 border-t border-gray-300/40 grid grid-cols-3 gap-4 text-center sm:text-left">
              <div>
                <span className="text-2xl lg:text-3xl font-extrabold text-gray-900 block">500+</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">Active Members</span>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-extrabold text-emerald-600 block">25+</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">Weekly Classes</span>
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-extrabold text-gray-900 block">100%</span>
                <span className="text-xs font-semibold text-gray-500 uppercase">Satisfaction</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <NeuCard className="p-8 relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">AMR Fitness Club</span>
                <NeuBadge variant="emerald">Premium Club</NeuBadge>
              </div>
              <div className="w-full h-48 rounded-2xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
                  alt="AMR Fitness Gym Floor"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/70 via-transparent to-transparent flex items-end p-4">
                  <div className="text-white">
                    <span className="text-xs font-medium text-emerald-300 block">Main Strength Studio</span>
                    <span className="text-base font-bold">Equipped with Eleiko & Hammer Strength</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 neu-pressed rounded-xl">
                  <span className="text-gray-500 block">Peak Hours</span>
                  <span className="font-bold text-gray-800">06:00 - 09:00 AM</span>
                </div>
                <div className="p-3 neu-pressed rounded-xl">
                  <span className="text-gray-500 block">Location</span>
                  <span className="font-bold text-gray-800">Jubilee Hills, Hyd</span>
                </div>
              </div>
            </NeuCard>
          </div>
        </div>
      </section>

      {/* Memberships Section */}
      <section id="memberships" className="py-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <NeuBadge variant="emerald">Flexible Plans</NeuBadge>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">Choose Your Membership</h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Transparent pricing with no hidden lock-ins. All plans include full access to our premium facilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <NeuCard key={plan.id} hoverable className="flex flex-col justify-between relative overflow-hidden">
              {plan.name === 'Premium' && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-2xl">
                  Most Popular
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 min-h-[36px]">{plan.description}</p>
                <div className="py-2">
                  <span className="text-3xl font-black text-gray-900">{formatINR(plan.pricePaise)}</span>
                  <span className="text-xs text-gray-500 font-semibold"> / {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}</span>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-gray-300/40">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Link to={`/signup?plan=${plan.id}`}>
                  <NeuButton variant={plan.name === 'Premium' ? 'primary' : 'secondary'} className="w-full">
                    Choose {plan.name}
                  </NeuButton>
                </Link>
              </div>
            </NeuCard>
          ))}
        </div>
      </section>

      {/* Featured Classes Preview */}
      <section id="classes" className="py-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <NeuBadge variant="blue">Group Training</NeuBadge>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-2">Popular Group Classes</h2>
          </div>
          <Link to="/login">
            <NeuButton variant="secondary" size="sm">
              View Class Schedule <ChevronRight className="w-4 h-4" />
            </NeuButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.map(cls => (
            <NeuCard key={cls.id} hoverable className="space-y-3">
              <div className="flex justify-between items-center">
                <NeuBadge variant="emerald" size="sm">{cls.category}</NeuBadge>
                <span className="text-[11px] font-bold text-gray-500">{cls.startTime} - {cls.endTime}</span>
              </div>
              <h4 className="text-base font-bold text-gray-900 leading-snug">{cls.name}</h4>
              <p className="text-xs text-gray-500 line-clamp-2">{cls.description}</p>
              <div className="pt-3 border-t border-gray-300/40 flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-600">{cls.trainer?.name}</span>
                <span className="font-bold text-emerald-600">{cls.capacity - cls.bookedCount} spots left</span>
              </div>
            </NeuCard>
          ))}
        </div>
      </section>

      {/* Featured Trainers */}
      <section id="trainers" className="py-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <NeuBadge variant="emerald">Expert Coaches</NeuBadge>
          <h2 className="text-3xl font-extrabold text-gray-900">Meet Our Trainers</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trainers.map(t => (
            <NeuCard key={t.id} hoverable className="text-center space-y-4">
              <div className="flex justify-center">
                <NeuAvatar src={t.avatar} name={t.name} size="lg" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">{t.name}</h4>
                <p className="text-xs font-bold text-emerald-600">{t.specialization}</p>
                <p className="text-[11px] text-gray-500 mt-1">{t.experienceYears} Years Experience</p>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 italic">"{t.bio}"</p>
            </NeuCard>
          ))}
        </div>
      </section>

      {/* Why Choose Mahesh Fitness Center */}
      <section className="py-16 px-4 lg:px-8 max-w-7xl mx-auto w-full">
        <NeuCard className="p-8 lg:p-12">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Why AMR Fitness?</h2>
            <p className="text-sm text-gray-600">Built to empower your lifestyle with modern technology and physical excellence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 neu-pressed rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-emerald-600">
                <Dumbbell className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Premium Equipment</h4>
              <p className="text-xs text-gray-500">World-class strength racks, free weights, and cardio machines.</p>
            </div>
            <div className="p-4 neu-pressed rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Certified Trainers</h4>
              <p className="text-xs text-gray-500">Dedicated fitness experts guiding your technique and motivation.</p>
            </div>
            <div className="p-4 neu-pressed rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-emerald-600">
                <Flame className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Dynamic Classes</h4>
              <p className="text-xs text-gray-500">Daily HIIT, Yoga, Boxing, Pilates, and Strength sessions.</p>
            </div>
            <div className="p-4 neu-pressed rounded-2xl space-y-2">
              <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Member-First Portal</h4>
              <p className="text-xs text-gray-500">Instant class booking, attendance tracking, and fitness metrics.</p>
            </div>
          </div>
        </NeuCard>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 lg:px-8 max-w-4xl mx-auto w-full text-center">
        <NeuCard className="p-10 space-y-6">
          <h2 className="text-3xl font-extrabold text-gray-900">Your Stronger Self Starts Here</h2>
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            Join Mahesh Fitness Center today and experience seamless digital membership management.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/signup">
              <NeuButton variant="primary" size="lg">
                Create Account
              </NeuButton>
            </Link>
            <Link to="/login">
              <NeuButton variant="secondary" size="lg">
                Sign In
              </NeuButton>
            </Link>
          </div>
        </NeuCard>
      </section>

      <Footer />
    </div>
  );
};
