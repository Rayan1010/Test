import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Reminder, ServiceType, Vehicle } from '../types';
import { X, CalendarCheck, AlertCircle } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  vehicle: Vehicle;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicle,
}) => {
  const { user, language } = useAuth();
  const t = translations[language];

  const [service, setService] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('oil_filter');
  const [dueDate, setDueDate] = useState('');
  const [dueMileage, setDueMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setService('');
      setServiceType('oil_filter');
      setDueDate('');
      // Suggest next 5000 km by default
      const defaultNextKm = vehicle.currentOdometer ? vehicle.currentOdometer + 5000 : '';
      setDueMileage(defaultNextKm ? String(defaultNextKm) : '');
      setNotes('');
      setErrorMsg(null);
    }
  }, [isOpen, vehicle]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!service.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى كتابة اسم الخدمة المطلوبة' : 'Please provide service title');
      return;
    }

    if (!dueDate && !dueMileage) {
      setErrorMsg(
        language === 'ar' 
          ? 'يرجى تحديد تاريخ استحقاق أو قراءة عداد مستهدفة على الأقل' 
          : 'Please specify at least a due date or a target mileage'
      );
      return;
    }

    const parsedMileage = dueMileage ? parseInt(dueMileage, 10) : undefined;
    if (parsedMileage !== undefined && (isNaN(parsedMileage) || parsedMileage < 0)) {
      setErrorMsg(language === 'ar' ? 'قراءة العداد غير صحيحة' : 'Invalid mileage');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        userId: user?.uid || 'guest-user',
        vehicleId: vehicle.id,
        service: service.trim(),
        serviceType,
        dueDate: dueDate || undefined,
        dueMileage: parsedMileage,
        notes: notes.trim() || undefined,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {t.addReminder}
            </h3>
          </div>
          <button
            id="close-reminder-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="reminder-service-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.reminderService} <span className="text-rose-500">*</span>
            </label>
            <input
              id="reminder-service-input"
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder={t.reminderServicePlaceholder}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="reminder-type-select" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.serviceType}
            </label>
            <select
              id="reminder-type-select"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {Object.entries(t.serviceTypes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reminder-date-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.dueDate}
              </label>
              <input
                id="reminder-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label htmlFor="reminder-mileage-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.dueMileage}
              </label>
              <input
                id="reminder-mileage-input"
                type="number"
                value={dueMileage}
                onChange={(e) => setDueMileage(e.target.value)}
                placeholder={t.dueMileagePlaceholder}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reminder-notes-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.notes}
            </label>
            <textarea
              id="reminder-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يفضل الشراء من الموزع المعتمد"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              id="cancel-reminder-btn"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="save-reminder-submit-btn"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
            >
              {loading ? t.loading : t.saveReminder}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
