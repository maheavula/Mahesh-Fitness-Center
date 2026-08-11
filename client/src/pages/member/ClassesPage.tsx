import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Filter, Search, UserCheck, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { FitnessClass, Trainer, Booking } from '../../types/index.js';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuInput, NeuSelect, NeuTabs } from '../../components/neumorphic/index.js';

export const ClassesPage: React.FC = () => {
  const { subscription } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all');

  // Update search state if URL query changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
  }, [searchParams]);

  const categories = ['all', 'Strength', 'Cardio', 'Yoga', 'HIIT', 'Mobility', 'Pilates', 'Functional', 'Recovery'];

  const loadData = async () => {
    try {
      const [clsRes, trnRes, bookRes] = await Promise.all([
        apiClient.getClasses(),
        apiClient.getTrainers(),
        apiClient.getMyBookings()
      ]);

      if (clsRes.success) setClasses(clsRes.data.classes || []);
      if (trnRes.success) setTrainers(trnRes.data.trainers || []);
      if (bookRes.success) setMyBookings(bookRes.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = async (classId: string) => {
    if (!subscription || subscription.status !== 'active') {
      showToast('Membership Required', 'An active membership plan is required to book group classes.', 'warning');
      return;
    }

    const res = await apiClient.bookClass(classId);
    if (res.success) {
      showToast('Booking Confirmed!', 'Your spot in class has been reserved.', 'success');
      await loadData();
    } else {
      showToast('Booking Failed', res.error?.message || 'Unable to book class.', 'error');
    }
  };

  const filteredClasses = classes.filter(cls => {
    const matchesCategory = selectedCategory === 'all' || cls.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesTrainer = selectedTrainer === 'all' || cls.trainerId === selectedTrainer;
    const matchesSearch = !search || cls.name.toLowerCase().includes(search.toLowerCase()) || cls.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesTrainer && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Group Fitness Classes</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Discover daily workout sessions, explore expert coaches, and book your spot.
        </p>
      </div>

      {/* Filter Controls Bar */}
      <NeuCard className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-72">
            <NeuInput
              placeholder="Search class name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full md:w-64">
            <NeuSelect
              value={selectedTrainer}
              onChange={e => setSelectedTrainer(e.target.value)}
              options={[
                { label: 'All Trainers', value: 'all' },
                ...trainers.map(t => ({ label: t.name, value: t.id }))
              ]}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="pt-2 border-t border-gray-300/30 overflow-x-auto">
          <NeuTabs
            tabs={categories.map(cat => ({ id: cat, label: cat === 'all' ? 'All Categories' : cat }))}
            activeTab={selectedCategory}
            onChange={id => setSelectedCategory(id)}
          />
        </div>
      </NeuCard>

      {/* Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.length === 0 ? (
          <NeuCard className="col-span-full p-12 text-center text-gray-500 space-y-2">
            <p className="font-semibold text-base">No fitness classes matched your search filter.</p>
            <p className="text-xs">Try selecting another category or searching for a different keyword.</p>
          </NeuCard>
        ) : (
          filteredClasses.map(cls => {
            const isBooked = myBookings.some(b => b.classId === cls.id && b.status === 'confirmed');
            const isFull = cls.bookedCount >= cls.capacity;
            const availableSpots = cls.capacity - cls.bookedCount;

            return (
              <NeuCard key={cls.id} hoverable className="flex flex-col justify-between space-y-4 relative">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <NeuBadge variant="emerald">{cls.category}</NeuBadge>
                    <span className="text-xs font-bold text-gray-500">{formatDate(cls.date)}</span>
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900 leading-snug">{cls.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{cls.description}</p>

                  <div className="space-y-2 pt-2 border-t border-gray-300/40 text-xs text-gray-700 font-semibold">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{cls.location}</span>
                    </div>
                    {cls.trainer && (
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-600" />
                        <span>Trainer: {cls.trainer.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-300/40 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-semibold">Capacity</span>
                    <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {availableSpots} / {cls.capacity} spots left
                    </span>
                  </div>

                  {isBooked ? (
                    <div className="flex gap-2">
                      <NeuButton variant="secondary" className="w-full text-emerald-700 font-bold" disabled>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> You're Booked
                      </NeuButton>
                    </div>
                  ) : isFull ? (
                    <NeuButton variant="secondary" className="w-full text-rose-600" disabled>
                      <XCircle className="w-4 h-4 text-rose-500" /> Class Full
                    </NeuButton>
                  ) : (
                    <NeuButton variant="primary" className="w-full" onClick={() => handleBook(cls.id)}>
                      Book Spot Now
                    </NeuButton>
                  )}
                </div>
              </NeuCard>
            );
          })
        )}
      </div>
    </div>
  );
};
