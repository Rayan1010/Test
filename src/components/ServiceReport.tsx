import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Vehicle, MaintenanceRecord } from '../types';
import { formatDate, formatCurrency, formatNumber } from '../lib/utils';
import { 
  FileText, 
  Printer, 
  Car, 
  Wrench, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  FileCheck2,
  ShieldCheck,
  Award
} from 'lucide-react';

interface ServiceReportProps {
  vehicle: Vehicle | null;
  records: MaintenanceRecord[];
}

export const ServiceReport: React.FC<ServiceReportProps> = ({
  vehicle,
  records,
}) => {
  const { language } = useAuth();
  const t = translations[language];

  if (!vehicle) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 mb-1">{t.noVehiclesYet}</h3>
        <p className="text-xs text-slate-500 mb-4">{t.addFirstVehicle}</p>
      </div>
    );
  }

  const vehicleRecords = records.filter((r) => r.vehicleId === vehicle.id);
  const totalCost = vehicleRecords.reduce((acc, r) => acc + (r.cost || 0), 0);

  // Group services
  const serviceCategoriesCount: Record<string, number> = {};
  const allPartsList: string[] = [];

  vehicleRecords.forEach((r) => {
    serviceCategoriesCount[r.serviceType] = (serviceCategoriesCount[r.serviceType] || 0) + 1;
    if (r.parts) {
      allPartsList.push(...r.parts);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Action Header - Hidden when printing */}
      <div className="print:hidden bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.serviceReport}</h2>
          <p className="text-xs text-slate-500 mt-1">{t.reportSubtitle}</p>
        </div>

        <button
          id="print-report-btn"
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>{t.printReport}</span>
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 print:p-0 print:border-none print:shadow-none space-y-8">
        
        {/* Document Header */}
        <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black tracking-tight text-slate-900">سِجل | SIJIL</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                PASSPORT
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{t.serviceReport}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {t.reportGeneratedAt}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="text-end">
            <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>{language === 'ar' ? 'سجل صيانة معتمد' : 'Verified Service Log'}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Metadata Summary */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {t.vehicleInfo}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-400 block">{t.make}</span>
              <span className="text-sm font-bold text-slate-900">{vehicle.make}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t.model}</span>
              <span className="text-sm font-bold text-slate-900">{vehicle.model}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t.year}</span>
              <span className="text-sm font-bold text-slate-900">{vehicle.year}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">{t.currentOdometer}</span>
              <span className="text-sm font-bold text-slate-900">
                {formatNumber(vehicle.currentOdometer || 0, language)} {t.km}
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Volume Summary */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {t.summaryStats}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-900 block">{t.totalSpentOnVehicle}</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {formatCurrency(totalCost, 'SAR', language)}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block">{t.recordsCount}</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {vehicleRecords.length}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-semibold text-slate-700 block">{language === 'ar' ? 'قطع الغيار المستهلكة' : 'Parts Replaced'}</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                {allPartsList.length}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Records Table */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            {t.serviceHistory}
          </h3>

          {vehicleRecords.length === 0 ? (
            <p className="text-xs text-slate-400 italic">{t.noActivityYet}</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3 text-start">{t.serviceDate}</th>
                    <th className="p-3 text-start">{t.odometer}</th>
                    <th className="p-3 text-start">{t.serviceType}</th>
                    <th className="p-3 text-start">{t.description}</th>
                    <th className="p-3 text-start">{t.workshop}</th>
                    <th className="p-3 text-end">{t.cost}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicleRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">{formatDate(r.date, language)}</td>
                      <td className="p-3 text-slate-700 whitespace-nowrap">
                        {r.odometer ? `${r.odometer.toLocaleString()} ${t.km}` : '-'}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold whitespace-nowrap">
                          {t.serviceTypes[r.serviceType] || r.serviceType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 max-w-xs">
                        <p className="font-medium leading-relaxed">{r.description}</p>
                        {r.parts && r.parts.length > 0 && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {t.partsUsed}: {r.parts.join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{r.workshop || '-'}</td>
                      <td className="p-3 font-bold text-emerald-700 text-end whitespace-nowrap">
                        {formatCurrency(r.cost, r.currency, language)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Report Footer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>سِجل | SIJIL - منصة إدارة وتوثيق صيانة المركبات الرقمية</span>
          <span>صفحة 1 من 1 • رمز التوثيق: #{vehicle.id.slice(0, 8).toUpperCase()}</span>
        </div>

      </div>

    </div>
  );
};
