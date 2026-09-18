import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Reminder, Vehicle } from '../types';
import { formatDate, getDaysRemaining, getKmRemaining } from '../lib/utils';
import { 
  Bell, 
  CalendarCheck, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  AlertTriangle,
  Clock,
  Gauge
} from 'lucide-react';

interface RemindersManagerProps {
  vehicle: Vehicle | null;
  reminders: Reminder[];
  onAddClick: () => void;
  onToggleStatus: (reminderId: string, currentStatus: boolean) => Promise<void>;
  onDeleteClick: (reminderId: string) => Promise<void>;
}

export const RemindersManager: React.FC<RemindersManagerProps> = ({
  vehicle,
  reminders,
  onAddClick,
  onToggleStatus,
  onDeleteClick,
}) => {
  const { language } = useAuth();
  const t = translations[language];

  if (!vehicle) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
        <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 mb-1">{t.noVehiclesYet}</h3>
        <p className="text-xs text-slate-500 mb-4">{t.addFirstVehicle}</p>
      </div>
    );
  }

  const activeReminders = reminders.filter((r) => !r.isCompleted);
  const completedReminders = reminders.filter((r) => r.isCompleted);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.reminders}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {activeReminders.length} {t.pending}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {vehicle.make} {vehicle.model} ({vehicle.year}) • {t.currentOdometer}: {vehicle.currentOdometer.toLocaleString()} {t.km}
          </p>
        </div>

        <button
          id="reminders-add-btn"
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addReminder}</span>
        </button>
      </div>

      {/* Active Reminders List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {language === 'ar' ? 'التذكيرات النشطة والقادمة' : 'Active Reminders'}
        </h3>

        {activeReminders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">
              {language === 'ar' ? 'لا توجد مواعيد صيانة متأخرة أو قادمة' : 'No upcoming maintenance tasks'}
            </p>
            <button
              onClick={onAddClick}
              className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
            >
              + {t.addReminder}
            </button>
          </div>
        ) : (
          activeReminders.map((rem) => {
            const daysLeft = getDaysRemaining(rem.dueDate);
            const kmLeft = getKmRemaining(rem.dueMileage, vehicle.currentOdometer);
            const isOverdue = (daysLeft !== null && daysLeft < 0) || (kmLeft !== null && kmLeft <= 0);

            return (
              <div
                key={rem.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex items-start justify-between gap-4 ${
                  isOverdue ? 'border-rose-300 bg-rose-50/40 shadow-xs' : 'border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    id={`toggle-rem-${rem.id}`}
                    onClick={() => onToggleStatus(rem.id, rem.isCompleted)}
                    className="mt-0.5 text-slate-300 hover:text-emerald-600 transition-colors"
                    title={t.markCompleted}
                  >
                    <Circle className="w-5 h-5" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900">{rem.service}</h4>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {t.overdue}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                      {rem.dueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.dueDate}: {formatDate(rem.dueDate, language)}</span>
                          {daysLeft !== null && (
                            <span className={`font-semibold ${daysLeft < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                              ({daysLeft < 0 ? `${Math.abs(daysLeft)} ${language === 'ar' ? 'يوم متأخر' : 'days late'}` : `${daysLeft} ${t.daysRemaining}`})
                            </span>
                          )}
                        </div>
                      )}

                      {rem.dueMileage && (
                        <div className="flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.dueMileage}: {rem.dueMileage.toLocaleString()} {t.km}</span>
                          {kmLeft !== null && (
                            <span className={`font-semibold ${kmLeft <= 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                              ({kmLeft <= 0 ? `${Math.abs(kmLeft).toLocaleString()} ${language === 'ar' ? 'كم متأخر' : 'km overdue'}` : `${kmLeft.toLocaleString()} ${t.kmRemaining}`})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {rem.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {rem.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  id={`delete-rem-${rem.id}`}
                  onClick={() => onDeleteClick(rem.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Reminders Archive */}
      {completedReminders.length > 0 && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.completed} ({completedReminders.length})
          </h3>

          <div className="space-y-2 opacity-75">
            {completedReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleStatus(rem.id, rem.isCompleted)}
                    className="text-emerald-600 hover:text-slate-400 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-semibold text-slate-600 line-through">
                    {rem.service}
                  </span>
                </div>

                <button
                  onClick={() => onDeleteClick(rem.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
