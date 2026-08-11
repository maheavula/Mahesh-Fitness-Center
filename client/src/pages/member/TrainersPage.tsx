import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Award, Dumbbell, Calendar, ChevronRight } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';
import { Trainer, FitnessClass } from '../../types/index.js';
import { NeuCard, NeuButton, NeuBadge, NeuAvatar, NeuModal } from '../../components/neumorphic/index.js';

export const TrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [trainerClasses, setTrainerClasses] = useState<FitnessClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrainers() {
      try {
        const res = await apiClient.getTrainers();
        if (res.success) setTrainers(res.data.trainers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTrainers();
  }, []);

  const handleOpenTrainerModal = async (t: Trainer) => {
    setSelectedTrainer(t);
    try {
      const res = await apiClient.getClasses({ trainerId: t.id });
      if (res.success) setTrainerClasses(res.data.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Elite Certified Trainers</h1>
        <p className="text-xs lg:text-sm text-gray-600 mt-1">
          Learn from industry leaders in strength conditioning, functional yoga, boxing, and rehab.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map(t => (
          <NeuCard key={t.id} hoverable className="flex flex-col justify-between space-y-6">
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <NeuAvatar src={t.avatar} name={t.name} size="lg" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{t.specialization}</p>
                <NeuBadge variant="blue" size="sm" className="mt-2">
                  <Award className="w-3 h-3" /> {t.experienceYears} Years Exp
                </NeuBadge>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed italic">"{t.bio}"</p>
            </div>

            <NeuButton variant="secondary" className="w-full" onClick={() => handleOpenTrainerModal(t)}>
              View Bio & Schedule <ChevronRight className="w-4 h-4" />
            </NeuButton>
          </NeuCard>
        ))}
      </div>

      {/* Trainer Detail Modal */}
      <NeuModal
        isOpen={!!selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
        title="Trainer Profile"
      >
        {selectedTrainer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <NeuAvatar src={selectedTrainer.avatar} name={selectedTrainer.name} size="lg" />
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">{selectedTrainer.name}</h3>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{selectedTrainer.specialization}</p>
                <p className="text-xs text-gray-500">{selectedTrainer.experienceYears} Years Professional Coaching Experience</p>
              </div>
            </div>

            <div className="p-4 neu-pressed rounded-2xl space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Biography</span>
              <p className="text-xs text-gray-700 leading-relaxed">{selectedTrainer.bio}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" /> Upcoming Classes with {selectedTrainer.name}
              </h4>

              {trainerClasses.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-3 neu-pressed rounded-xl">No upcoming group classes currently assigned to this coach.</p>
              ) : (
                <div className="space-y-2">
                  {trainerClasses.map(cls => (
                    <div key={cls.id} className="p-3 neu-pressed rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-900 block">{cls.name}</span>
                        <span className="text-gray-500">{cls.date} • {cls.startTime} ({cls.category})</span>
                      </div>
                      <Link to="/app/classes">
                        <NeuButton variant="primary" size="sm">Book</NeuButton>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </NeuModal>
    </div>
  );
};
