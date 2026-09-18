import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { MaintenanceRecord, Vehicle } from '../types';
import { formatDate, formatCurrency } from '../lib/utils';
import { 
  Wrench, 
  Calendar, 
  Gauge, 
  Store, 
  FileText, 
  Trash2, 
  Edit3, 
  Plus, 
  ExternalLink,
  Sparkles,
  Filter,
  X
} from 'lucide-react';

interface MaintenanceTimelineProps {
  vehicle: Vehicle | null;
  records: MaintenanceRecord[];
  onAddClick: () => void;
  onEditClick: (record: MaintenanceRecord) => void;
  onDeleteClick: (recordId: string) => void;
}

export const MaintenanceTimeline: React.FC<MaintenanceTimelineProps> = ({
  vehicle,
  records,
  onAddClick,
  onEditClick,
  onDeleteClick,
}) => {
  const { language } = useAuth();
  const t = translations[language];

  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  if (!vehicle) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
        <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 mb-1">{t.noVehiclesYet}</h3>
        <p className="text-xs text-slate-500 mb-4">{t.addFirstVehicle}</p>
      </div>
    );
  }

  const filteredRecords = records.filter((r) => {
    if (selectedFilter === 'all') return true;
    return r.serviceType === selectedFilter;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.maintenanceRecords}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {records.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {vehicle.make} {vehicle.model} ({vehicle.year}) {vehicle.nickname ? `• ${vehicle.nickname}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Service filter */}
          <select
            id="service-filter-select"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden"
          >
            <option value="all">{language === 'ar' ? 'جميع الخدمات' : 'All Services'}</option>
            {Object.entries(t.serviceTypes).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>

          <button
            id="timeline-add-record-btn"
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRecord}</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">{t.noActivityYet}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {language === 'ar' 
              ? 'سجّل عمليات الصيانة أو قم برفع فواتيرك ليتم استخراجها والاحتفاظ بتاريخ سيارتك كاملاً.'
              : 'Log your services or scan invoices with AI to maintain a comprehensive vehicle service history.'}
          </p>
          <button
            id="empty-add-record-btn"
            onClick={onAddClick}
            className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addRecord}</span>
          </button>
        </div>
      ) : (
        /* Timeline Feed */
        <div className="relative border-s-2 border-slate-200 ms-4 sm:ms-6 space-y-6">
          {filteredRecords.map((record) => {
            const serviceLabel = t.serviceTypes[record.serviceType] || t.serviceTypes.other;
            return (
              <div key={record.id} className="relative ps-6 sm:ps-8 group">
                
                {/* Timeline Dot */}
                <div className="absolute -start-[17px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-300 group-hover:border-emerald-600 flex items-center justify-center transition-colors shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                </div>

                {/* Record Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
                  
                  {/* Top Bar: Service type, Cost, Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white">
                        {serviceLabel}
                      </span>
                      {record.isAiExtracted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="w-3 h-3" />
                          <span>{language === 'ar' ? 'فحص بالذكاء الاصطناعي' : 'AI Extracted'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-emerald-700">
                        {formatCurrency(record.cost, record.currency, language)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          id={`edit-record-btn-${record.id}`}
                          onClick={() => onEditClick(record)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title={t.edit}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-record-btn-${record.id}`}
                          onClick={() => onDeleteClick(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm font-semibold text-slate-900 mt-3 leading-relaxed">
                    {record.description}
                  </p>

                  {/* Metadata chips: Date, Odometer, Workshop */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(record.date, language)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-slate-400" />
                      <span>{record.odometer ? `${record.odometer.toLocaleString()} ${t.km}` : '-'}</span>
                    </div>

                    {record.workshop && (
                      <div className="flex items-center gap-1">
                        <Store className="w-3.5 h-3.5 text-slate-400" />
                        <span>{record.workshop}</span>
                      </div>
                    )}
                  </div>

                  {/* Spare parts */}
                  {record.parts && record.parts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        {t.partsUsed}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {record.parts.map((p, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs rounded-md bg-slate-100 text-slate-700">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {record.notes && (
                    <p className="text-xs text-slate-500 italic mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {record.notes}
                    </p>
                  )}

                  {/* Attached invoice thumbnail */}
                  {record.documentUrl && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setActiveImageModal(record.documentUrl || null)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t.viewInvoice}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] text-slate-400">{record.documentName || 'مستند مرفق'}</span>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-3xl w-full p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800">{t.attachedInvoice}</h4>
              <button
                onClick={() => setActiveImageModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex justify-center max-h-[80vh] overflow-y-auto">
              <img
                src={activeImageModal}
                alt="Full Invoice Preview"
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
