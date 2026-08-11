import React, { useEffect, useState } from 'react';
import { Plus, Edit3, XCircle, Calendar, Clock, MapPin, UserCheck, AlertTriangle } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { useToast } from '../../context/ToastContext.js';
import { FitnessClass, Trainer } from '../../types/index.js';
import { formatDate, formatTime } from '../../utils/formatters.js';
import { NeuCard, NeuButton, NeuBadge, NeuModal, NeuInput, NeuSelect } from '../../components/neumorphic/index.js';

export const AdminClassesPage: React.FC = () => {
  const { showToast } = useToast();
  const [classes, setClasses] = useState<FitnessClass[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<FitnessClass | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Strength');
  const [trainerId, setTrainerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [capacity, setCapacity] = useState('20');
  const [location, setLocation] = useState('Studio A');
  const [status, setStatus] = useState<'scheduled' | 'cancelled' | 'completed'>('scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [clsRes, trnRes] = await Promise.all([
        apiClient.getClasses(),
        apiClient.getAdminTrainers()
      ]);

      if (clsRes.success) setClasses(clsRes.data.classes || []);
      if (trnRes.success) setTrainers(trnRes.data.trainers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeTrainers = trainers.filter(t => t.status === 'active');

  const handleOpenCreate = () => {
    setEditingClass(null);
    setName('');
    setDescription('');
    setCategory('Strength');
    setTrainerId(activeTrainers[0]?.id || '');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('07:00');
    setEndTime('08:00');
    setCapacity('20');
    setLocation('Studio A');
    setStatus('scheduled');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: FitnessClass) => {
    setEditingClass(c);
    setName(c.name);
    setDescription(c.description);
    setCategory(c.category);
    setTrainerId(c.trainerId);
    setDate(c.date);
    setStartTime(c.startTime);
    setEndTime(c.endTime);
    setCapacity(String(c.capacity));
    setLocation(c.location);
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !trainerId || !date || !startTime) {
      showToast('Validation Error', 'Please complete required class fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name,
      description,
      category,
      trainerId,
      date,
      startTime,
      endTime,
      capacity: Number(capacity),
      location,
      status
    };

    let res;
    if (editingClass) {
      res = await apiClient.updateClass(editingClass.id, payload);
    } else {
      res = await apiClient.createClass(payload);
    }

    setIsSubmitting(false);
    if (res.success) {
      showToast('Class Saved', `Fitness class ${editingClass ? 'updated' : 'scheduled'} successfully.`, 'success');
      setIsModalOpen(false);
      await loadData();
    } else {
      showToast('Error', res.error?.message || 'Failed to save class.', 'error');
    }
  };

  const handleCancelClass = async (id: string) => {
    const res = await apiClient.cancelClassByAdmin(id);
    if (res.success) {
      showToast('Class Cancelled', 'Class status changed to cancelled & member bookings invalidated.', 'info');
      await loadData();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Fitness Schedule & Class Management</h1>
          <p className="text-xs lg:text-sm text-gray-600 mt-1">
            Create group training sessions, assign certified coaches, and adjust studio capacity.
          </p>
        </div>
        <NeuButton variant="primary" size="sm" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" /> Schedule New Class
        </NeuButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <NeuCard key={cls.id} hoverable className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <NeuBadge variant="emerald">{cls.category}</NeuBadge>
                <NeuBadge variant={cls.status === 'scheduled' ? 'blue' : 'rose'}>{cls.status}</NeuBadge>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{cls.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-300/40 text-xs font-semibold text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{formatDate(cls.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>{cls.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Trainer: {cls.trainer?.name || cls.trainerId}</span>
                </div>
              </div>

              <div className="p-3 neu-pressed rounded-xl flex justify-between items-center text-xs font-bold">
                <span className="text-gray-600">Bookings</span>
                <span className="text-emerald-700">{cls.bookedCount} / {cls.capacity} spots filled</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-300/40">
              <NeuButton variant="secondary" size="sm" className="w-1/2" onClick={() => handleOpenEdit(cls)}>
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </NeuButton>
              {cls.status === 'scheduled' && (
                <NeuButton variant="danger" size="sm" className="w-1/2" onClick={() => handleCancelClass(cls.id)}>
                  <XCircle className="w-3.5 h-3.5" /> Cancel Class
                </NeuButton>
              )}
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Class Modal */}
      <NeuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Fitness Class' : 'Schedule New Group Class'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <NeuInput
            label="Class Title"
            placeholder="Power Strength & Hypertrophy"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <NeuInput
            label="Description"
            placeholder="Class session description..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <NeuSelect
              label="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={[
                { label: 'Strength', value: 'Strength' },
                { label: 'Cardio', value: 'Cardio' },
                { label: 'Yoga', value: 'Yoga' },
                { label: 'HIIT', value: 'HIIT' },
                { label: 'Mobility', value: 'Mobility' },
                { label: 'Pilates', value: 'Pilates' },
                { label: 'Functional', value: 'Functional' },
                { label: 'Recovery', value: 'Recovery' }
              ]}
            />

            <NeuSelect
              label="Assign Trainer"
              value={trainerId}
              onChange={e => setTrainerId(e.target.value)}
              options={activeTrainers.map(t => ({ label: `${t.name} (${t.specialization})`, value: t.id }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <NeuInput
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
            <NeuInput
              label="Start Time"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
            <NeuInput
              label="End Time"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NeuInput
              label="Max Studio Capacity"
              type="number"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              required
            />

            <NeuInput
              label="Studio Location"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <NeuButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </NeuButton>
            <NeuButton variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Fitness Class'}
            </NeuButton>
          </div>
        </form>
      </NeuModal>
    </div>
  );
};
