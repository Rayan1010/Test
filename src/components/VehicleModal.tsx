import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Vehicle } from '../types';
import { X, Car, AlertCircle } from 'lucide-react';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id'> | Partial<Vehicle>, isEdit: boolean) => Promise<void>;
  editingVehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingVehicle,
}) => {
  const { user, language } = useAuth();
  const t = translations[language];

  const [make, setMake] = useState(editingVehicle?.make || '');
  const [model, setModel] = useState(editingVehicle?.model || '');
  const [year, setYear] = useState<string>(editingVehicle ? String(editingVehicle.year) : String(new Date().getFullYear()));
  const [odometer, setOdometer] = useState<string>(editingVehicle ? String(editingVehicle.currentOdometer) : '');
  const [nickname, setNickname] = useState(editingVehicle?.nickname || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (editingVehicle) {
      setMake(editingVehicle.make);
      setModel(editingVehicle.model);
      setYear(String(editingVehicle.year));
      setOdometer(String(editingVehicle.currentOdometer));
      setNickname(editingVehicle.nickname || '');
    } else {
      setMake('');
      setModel('');
      setYear(String(new Date().getFullYear()));
      setOdometer('');
      setNickname('');
    }
    setErrorMsg(null);
  }, [editingVehicle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!make.trim()) {
      setErrorMsg(language === 'ar' ? 'الرجاء إدخال الشركة الصانعة للسيارة' : 'Please enter vehicle make');
      return;
    }
    if (!model.trim()) {
      setErrorMsg(language === 'ar' ? 'الرجاء إدخال موديل السيارة' : 'Please enter vehicle model');
      return;
    }

    const parsedYear = parseInt(year, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(parsedYear) || parsedYear < 1950 || parsedYear > currentYear + 2) {
      setErrorMsg(language === 'ar' ? `يرجى إدخال سنة صنع صحيحة (بين 1950 و ${currentYear + 1})` : 'Please enter a valid model year');
      return;
    }

    const parsedOdometer = parseInt(odometer, 10);
    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      setErrorMsg(language === 'ar' ? 'يرجى إدخال قراءة عداد صحيحة غير سالبة' : 'Please enter a valid non-negative odometer reading');
      return;
    }

    setLoading(true);
    try {
      if (editingVehicle) {
        await onSave({
          make: make.trim(),
          model: model.trim(),
          year: parsedYear,
          currentOdometer: parsedOdometer,
          nickname: nickname.trim() || undefined,
        }, true);
      } else {
        await onSave({
          userId: user?.uid || 'guest-user',
          make: make.trim(),
          model: model.trim(),
          year: parsedYear,
          currentOdometer: parsedOdometer,
          nickname: nickname.trim() || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, false);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save vehicle:', err);
      setErrorMsg(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {editingVehicle ? t.editVehicle : t.addVehicle}
            </h3>
          </div>
          <button
            id="close-vehicle-modal-btn"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="vehicle-make-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.make} <span className="text-rose-500">*</span>
              </label>
              <input
                id="vehicle-make-input"
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder={t.makePlaceholder}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="vehicle-model-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.model} <span className="text-rose-500">*</span>
              </label>
              <input
                id="vehicle-model-input"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={t.modelPlaceholder}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="vehicle-year-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.year} <span className="text-rose-500">*</span>
              </label>
              <input
                id="vehicle-year-input"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={t.yearPlaceholder}
                min="1950"
                max={new Date().getFullYear() + 2}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="vehicle-odometer-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.odometer} <span className="text-rose-500">*</span>
              </label>
              <input
                id="vehicle-odometer-input"
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder={t.odometerPlaceholder}
                min="0"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="vehicle-nickname-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.nickname}
            </label>
            <input
              id="vehicle-nickname-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nicknamePlaceholder}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              id="cancel-vehicle-btn"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="save-vehicle-submit-btn"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {loading ? t.loading : t.saveVehicle}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
