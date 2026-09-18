import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Vehicle } from '../types';
import { formatNumber } from '../lib/utils';
import { 
  Car, 
  Plus, 
  Edit3, 
  Trash2, 
  Gauge, 
  Calendar, 
  Check, 
  X,
  AlertCircle
} from 'lucide-react';

interface VehiclesManagerProps {
  vehicles: Vehicle[];
  onAddClick: () => void;
  onEditClick: (v: Vehicle) => void;
  onDeleteClick: (id: string) => void;
  onUpdateOdometer: (vehicleId: string, newOdometer: number) => Promise<void>;
}

export const VehiclesManager: React.FC<VehiclesManagerProps> = ({
  vehicles,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onUpdateOdometer,
}) => {
  const { language, activeVehicleId, setActiveVehicleId } = useAuth();
  const t = translations[language];

  const [editingOdometerId, setEditingOdometerId] = useState<string | null>(null);
  const [odometerInput, setOdometerInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const startEditOdometer = (veh: Vehicle) => {
    setEditingOdometerId(veh.id);
    setOdometerInput(String(veh.currentOdometer || ''));
  };

  const cancelEditOdometer = () => {
    setEditingOdometerId(null);
    setOdometerInput('');
  };

  const handleSaveOdometer = async (vehId: string) => {
    const val = parseInt(odometerInput, 10);
    if (isNaN(val) || val < 0) return;

    try {
      setSubmitting(true);
      await onUpdateOdometer(vehId, val);
      setEditingOdometerId(null);
    } catch (err) {
      console.error('Update odometer failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.vehicles}</h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar' ? 'إدارة سياراتك وتحديث قراءات العداد والبيانات الفنية' : 'Manage your vehicles and maintain odometer readings'}
          </p>
        </div>

        <button
          id="vehicles-add-btn"
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addVehicle}</span>
        </button>
      </div>

      {/* Vehicle Cards Grid */}
      {vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Car className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">{t.noVehiclesYet}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {t.addFirstVehicle}
          </p>
          <button
            onClick={onAddClick}
            className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addVehicle}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((veh) => {
            const isSelected = veh.id === activeVehicleId;
            const isEditingOdo = editingOdometerId === veh.id;

            return (
              <div
                key={veh.id}
                className={`bg-white rounded-2xl p-6 border transition-all ${
                  isSelected 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                
                {/* Vehicle title & active badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-base border border-slate-200">
                      <Car className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {veh.make} {veh.model}
                        </h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {veh.year}
                        </span>
                      </div>
                      {veh.nickname && (
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{veh.nickname}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`edit-vehicle-${veh.id}`}
                      onClick={() => onEditClick(veh)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                      title={t.edit}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-vehicle-${veh.id}`}
                      onClick={() => onDeleteClick(veh.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Odometer Section */}
                <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <Gauge className="w-4 h-4 text-slate-500" />
                    <span>{t.currentOdometer}:</span>
                  </div>

                  {isEditingOdo ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={odometerInput}
                        onChange={(e) => setOdometerInput(e.target.value)}
                        className="w-24 px-2 py-1 text-xs font-bold rounded-lg border border-emerald-500 bg-white"
                        autoFocus
                      />
                      <button
                        id={`save-odo-${veh.id}`}
                        onClick={() => handleSaveOdometer(veh.id)}
                        disabled={submitting}
                        className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        title={t.save}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelEditOdometer}
                        className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
                        title={t.cancel}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatNumber(veh.currentOdometer || 0, language)} {t.km}
                      </span>
                      <button
                        id={`edit-odo-btn-${veh.id}`}
                        onClick={() => startEditOdometer(veh)}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      >
                        {t.updateOdometer}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action footer: Select as active vehicle */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'أضيف بتاريخ:' : 'Added on:'} {veh.createdAt ? veh.createdAt.split('T')[0] : '-'}
                  </span>

                  {isSelected ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{t.selectedVehicle}</span>
                    </span>
                  ) : (
                    <button
                      id={`select-car-btn-${veh.id}`}
                      onClick={() => setActiveVehicleId(veh.id)}
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      {language === 'ar' ? 'تحديد كسيارة حالية' : 'Set as Active'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
