import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Vehicle, MaintenanceRecord, Reminder } from '../types';
import { formatCurrency, formatNumber, formatDate, getDaysRemaining, getKmRemaining } from '../lib/utils';
import { 
  Car, 
  Wrench, 
  Calendar, 
  DollarSign, 
  Gauge, 
  Bell, 
  ArrowUpRight, 
  Plus, 
  ScanLine, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  FileCheck2,
  Clock
} from 'lucide-react';

interface DashboardProps {
  vehicles: Vehicle[];
  records: MaintenanceRecord[];
  reminders: Reminder[];
  onAddVehicleClick: () => void;
  onAddRecordClick: () => void;
  onScanInvoiceClick: () => void;
  onAddReminderClick: () => void;
  onViewTimelineClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  vehicles,
  records,
  reminders,
  onAddVehicleClick,
  onAddRecordClick,
  onScanInvoiceClick,
  onAddReminderClick,
  onViewTimelineClick,
}) => {
  const { language, activeVehicleId, setActiveVehicleId } = useAuth();
  const t = translations[language];

  const currentVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;

  if (!currentVehicle) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-xs text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {t.welcomeUser} {t.appName}
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          {t.appTagline}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="dashboard-first-car-btn"
            onClick={onAddVehicleClick}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addFirstVehicle}</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter records and reminders for active vehicle
  const vehicleRecords = records.filter((r) => r.vehicleId === currentVehicle.id);
  const vehicleReminders = reminders.filter((r) => r.vehicleId === currentVehicle.id && !r.isCompleted);

  // Calculations
  const totalCost = vehicleRecords.reduce((acc, r) => acc + (r.cost || 0), 0);
  const lastRecord = vehicleRecords.length > 0 ? vehicleRecords[0] : null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner: Vehicle selector & quick actions */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 end-0 -me-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-emerald-400">
              <Car className="w-3.5 h-3.5" />
              <span>{currentVehicle.make} {currentVehicle.model} ({currentVehicle.year})</span>
              {currentVehicle.nickname && <span className="text-slate-300">• {currentVehicle.nickname}</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentVehicle.nickname || `${currentVehicle.make} ${currentVehicle.model}`}
            </h1>

            <p className="text-xs sm:text-sm text-slate-400">
              {language === 'ar' ? 'سجل الصيانة الرقمي المعتمد والموثق' : 'Official digital service passport'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-scan-invoice-btn"
              onClick={onScanInvoiceClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xs transition-all hover:scale-[1.02]"
            >
              <ScanLine className="w-4 h-4" />
              <span>{t.navScanInvoice}</span>
            </button>

            <button
              id="dash-add-record-btn"
              onClick={onAddRecordClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addRecord}</span>
            </button>

            <button
              id="dash-add-reminder-btn"
              onClick={onAddReminderClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>{t.addReminder}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Current Odometer */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.currentOdometer}</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatNumber(currentVehicle.currentOdometer || 0, language)}
            </span>
            <span className="text-xs font-semibold text-slate-500 ms-1.5">{t.km}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {language === 'ar' ? 'قابلة للتحديث بنقرة واحدة' : 'Updatable anytime'}
          </span>
        </div>

        {/* Metric 2: Total Maintenance Spending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.totalSpending}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-700">
              {formatNumber(totalCost, language)}
            </span>
            <span className="text-xs font-semibold text-slate-500 ms-1.5">{t.currencySAR}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {language === 'ar' ? `إجمالي تكاليف ${vehicleRecords.length} عملية صيانة` : `Across ${vehicleRecords.length} records`}
          </span>
        </div>

        {/* Metric 3: Records Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.recordsCount}</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">
              {vehicleRecords.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 ms-1.5">
              {language === 'ar' ? 'سجل صيانة' : 'records'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {lastRecord ? `${t.lastMaintenance}: ${formatDate(lastRecord.date, language)}` : t.noActivityYet}
          </span>
        </div>

        {/* Metric 4: Upcoming Reminders Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t.upcomingReminders}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-600">
              {vehicleReminders.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 ms-1.5">
              {language === 'ar' ? 'تذكير نشط' : 'active'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {vehicleReminders.length > 0 ? vehicleReminders[0].service : (language === 'ar' ? 'لا توجد مواعيد متأخرة' : 'All up to date')}
          </span>
        </div>

      </div>

      {/* Main Two Columns: Recent Activity & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left (2 cols): Recent Service History */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">{t.recentActivity}</h3>
            </div>
            {vehicleRecords.length > 0 && (
              <button
                id="dash-view-all-timeline-btn"
                onClick={onViewTimelineClick}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>{language === 'ar' ? 'عرض السجل الكامل' : 'View Full Timeline'}</span>
                {language === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {vehicleRecords.length === 0 ? (
              <div className="py-10 text-center">
                <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">{t.noActivityYet}</p>
                <button
                  onClick={onAddRecordClick}
                  className="mt-3 text-xs font-bold text-emerald-600 hover:underline"
                >
                  + {t.addRecord}
                </button>
              </div>
            ) : (
              vehicleRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                      <Wrench className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {record.description}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>{formatDate(record.date, language)}</span>
                        {record.odometer > 0 && <span>• {record.odometer.toLocaleString()} {t.km}</span>}
                        {record.workshop && <span>• {record.workshop}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-end shrink-0">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block">
                      {formatCurrency(record.cost, record.currency, language)}
                    </span>
                    {record.documentUrl && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                        <FileCheck2 className="w-3 h-3" />
                        <span>{language === 'ar' ? 'فاتورة' : 'Invoice'}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right (1 col): Upcoming Reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">{t.upcomingReminders}</h3>
            </div>
            <button
              id="dash-add-reminder-link"
              onClick={onAddReminderClick}
              className="text-xs font-bold text-slate-700 hover:text-slate-900"
            >
              + {t.addReminder}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {vehicleReminders.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">{language === 'ar' ? 'لا توجد تذكيرات مسجلة حالياً' : 'No upcoming reminders'}</p>
              </div>
            ) : (
              vehicleReminders.map((rem) => {
                const daysLeft = getDaysRemaining(rem.dueDate);
                const kmLeft = getKmRemaining(rem.dueMileage, currentVehicle.currentOdometer);
                const isOverdue = (daysLeft !== null && daysLeft < 0) || (kmLeft !== null && kmLeft <= 0);

                return (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-xl border transition-colors ${
                      isOverdue
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold">{rem.service}</h4>
                      {isOverdue && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-200 text-rose-900">
                          {t.overdue}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                      {rem.dueDate && (
                        <div className="flex items-center justify-between">
                          <span>{t.dueDate}: {formatDate(rem.dueDate, language)}</span>
                          {daysLeft !== null && (
                            <span className={daysLeft < 0 ? 'text-rose-600 font-bold' : ''}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} ${language === 'ar' ? 'يوم تأخير' : 'days late'}` : `${daysLeft} ${t.daysRemaining}`}
                            </span>
                          )}
                        </div>
                      )}

                      {rem.dueMileage && (
                        <div className="flex items-center justify-between">
                          <span>{t.dueMileage}: {rem.dueMileage.toLocaleString()} {t.km}</span>
                          {kmLeft !== null && (
                            <span className={kmLeft <= 0 ? 'text-rose-600 font-bold' : ''}>
                              {kmLeft <= 0 ? `${Math.abs(kmLeft).toLocaleString()} ${language === 'ar' ? 'كم متأخر' : 'km overdue'}` : `${kmLeft.toLocaleString()} ${t.kmRemaining}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
