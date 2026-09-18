import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { Vehicle, MaintenanceRecord, AiExtractedInvoice } from '../types';
import { compressImageIfNeeded } from '../lib/utils';
import { 
  ScanLine, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Wrench,
  Calendar,
  DollarSign,
  Gauge,
  Store
} from 'lucide-react';

interface InvoiceScannerProps {
  vehicle: Vehicle | null;
  onProceedToSave: (extracted: Partial<MaintenanceRecord>) => void;
}

export const InvoiceScanner: React.FC<InvoiceScannerProps> = ({
  vehicle,
  onProceedToSave,
}) => {
  const { language } = useAuth();
  const t = translations[language];

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<AiExtractedInvoice | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setExtractedData(null);

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg(language === 'ar' ? 'حجم الملف يتجاوز 15 ميجابايت' : 'File exceeds 15MB limit');
      return;
    }

    setSelectedFile(file);

    try {
      setAnalyzing(true);
      const { base64, mimeType } = await compressImageIfNeeded(file);
      setPreviewUrl(base64);

      // Call server-side Gemini API endpoint
      const response = await fetch('/api/analyze-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          vehicleDetails: vehicle 
            ? `${vehicle.make} ${vehicle.model} ${vehicle.year} (عداد: ${vehicle.currentOdometer} كم)` 
            : undefined,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || t.invoiceNotReadable);
      }

      const extracted: AiExtractedInvoice = resData.data;
      setExtractedData(extracted);
    } catch (err: any) {
      console.error('Invoice analysis error:', err);
      setErrorMsg(err.message || (language === 'ar' ? 'حدث خطأ أثناء استخراج بيانات الفاتورة' : 'Error parsing invoice'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    if (!extractedData) return;

    // Map extracted services/parts to description
    const desc = extractedData.services.length > 0
      ? extractedData.services.join('، ')
      : (extractedData.parts.length > 0 ? extractedData.parts.join('، ') : 'صيانة دورية مسجلة بالفاتورة');

    // Estimate service type based on extracted terms
    const textLower = (desc + ' ' + (extractedData.parts || []).join(' ')).toLowerCase();
    let detectedType: any = 'other';
    if (textLower.includes('زيت') || textLower.includes('oil') || textLower.includes('فلتر')) {
      detectedType = 'oil_filter';
    } else if (textLower.includes('فرامل') || textLower.includes('brake') || textLower.includes('فحمات')) {
      detectedType = 'brakes';
    } else if (textLower.includes('كفر') || textLower.includes('tire') || textLower.includes('إطار') || textLower.includes('ترصيص')) {
      detectedType = 'tires';
    } else if (textLower.includes('بطارية') || textLower.includes('battery')) {
      detectedType = 'battery';
    } else if (textLower.includes('مكيف') || textLower.includes('ac') || textLower.includes('رديتر')) {
      detectedType = 'ac_cooling';
    } else if (textLower.includes('قير') || textLower.includes('transmission')) {
      detectedType = 'transmission';
    }

    onProceedToSave({
      date: extractedData.invoiceDate || new Date().toISOString().split('T')[0],
      odometer: extractedData.odometer || (vehicle?.currentOdometer || 0),
      serviceType: detectedType,
      description: desc,
      parts: extractedData.parts || [],
      cost: extractedData.totalCost || 0,
      currency: extractedData.currency || 'SAR',
      workshop: extractedData.workshopName || '',
      notes: extractedData.notes || '',
      documentUrl: previewUrl || undefined,
      documentName: selectedFile?.name || 'فاتورة صيانة',
      isAiExtracted: true,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mb-3 border border-emerald-200 shadow-xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {t.scanTitle}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
          {t.scanSubtitle}
        </p>

        {/* Selected vehicle hint */}
        {vehicle && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
            <span>{vehicle.make} {vehicle.model} ({vehicle.year})</span>
            {vehicle.currentOdometer > 0 && (
              <span className="text-slate-500 font-normal">
                • العداد المسجل: {vehicle.currentOdometer.toLocaleString()} كم
              </span>
            )}
          </div>
        )}
      </div>

      {/* Upload Box */}
      {!extractedData && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white ${
            dragActive ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <input
            id="invoice-file-input"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileInput}
            disabled={analyzing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          {analyzing ? (
            <div className="py-6 space-y-3 flex flex-col items-center">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <ScanLine className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                {t.analyzingInvoice}
              </h4>
              <p className="text-xs text-slate-500 max-w-md">
                {t.analyzingHint}
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-3 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {t.dragDropInvoice}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {t.supportedFormats}
                </p>
              </div>
              <button
                type="button"
                id="select-invoice-btn"
                className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xs hover:bg-slate-800 transition-colors"
              >
                {language === 'ar' ? 'اختيار ملف الفاتورة' : 'Select Invoice File'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">{language === 'ar' ? 'تعذر إكمال التحليل:' : 'Analysis Notice:'} </span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => { setErrorMsg(null); setSelectedFile(null); }}
            className="text-xs underline font-semibold text-rose-900 hover:text-rose-950 shrink-0"
          >
            {t.reUpload}
          </button>
        </div>
      )}

      {/* Extracted Data Review Panel */}
      {extractedData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in-50">
          
          <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base sm:text-lg">{t.reviewExtractedData}</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">{t.reviewHint}</p>
            </div>

            {extractedData.confidenceScore !== undefined && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
                <span className="text-slate-400">{t.aiConfidence}:</span>
                <span className={`font-bold ${
                  extractedData.confidenceScore > 0.7 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {Math.round(extractedData.confidenceScore * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Invoice Image Preview */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {language === 'ar' ? 'مستند الفاتورة المرفوع' : 'Uploaded Invoice Document'}
              </h4>
              {previewUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-96 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Invoice Preview"
                    className="max-h-96 w-auto object-contain rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Right: Extracted fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {language === 'ar' ? 'البيانات المستخلصة' : 'Extracted Fields'}
              </h4>

              {/* Grid stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.serviceDate}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {extractedData.invoiceDate || <span className="text-slate-400 font-normal">{language === 'ar' ? 'غير محدد' : 'Not detected'}</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{t.odometer}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {extractedData.odometer 
                      ? `${extractedData.odometer.toLocaleString()} ${t.km}` 
                      : <span className="text-slate-400 font-normal">{language === 'ar' ? 'غير مسجل' : 'Not detected'}</span>}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{t.totalSpending}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300">
                      {extractedData.currency || 'SAR'}
                    </span>
                  </div>
                  <p className="text-xl font-extrabold text-emerald-900">
                    {extractedData.totalCost !== null ? extractedData.totalCost.toLocaleString() : '-'}
                  </p>
                </div>
              </div>

              {/* Workshop */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Store className="w-3.5 h-3.5" />
                  <span>{t.workshop}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {extractedData.workshopName || <span className="text-slate-400 font-normal">{language === 'ar' ? 'غير محدد' : 'Unknown'}</span>}
                </p>
              </div>

              {/* Services */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{t.description}</span>
                </div>
                {extractedData.services.length > 0 ? (
                  <ul className="list-disc list-inside text-xs font-medium text-slate-800 space-y-1">
                    {extractedData.services.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">{language === 'ar' ? 'لم يتم تحديد بنود صيانة منفصلة' : 'No explicit services listed'}</p>
                )}
              </div>

              {/* Parts */}
              {extractedData.parts.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="block text-xs text-slate-500 mb-1.5">{t.partsUsed}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.parts.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {extractedData.notes && (
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs text-amber-900">
                  <span className="font-semibold block mb-0.5">{t.notes}:</span>
                  <p>{extractedData.notes}</p>
                </div>
              )}

            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              id="reupload-invoice-btn"
              onClick={() => {
                setExtractedData(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {t.reUpload}
            </button>

            <button
              type="button"
              id="confirm-invoice-save-btn"
              onClick={handleConfirm}
              className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span>{t.confirmAndSave}</span>
              {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
