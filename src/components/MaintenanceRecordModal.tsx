import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { MaintenanceRecord, ServiceType } from '../types';
import { compressImageIfNeeded } from '../lib/utils';
import { X, Wrench, UploadCloud, Plus, Trash2, AlertCircle, FileCheck } from 'lucide-react';

interface MaintenanceRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<MaintenanceRecord, 'id'> | Partial<MaintenanceRecord>, isEdit: boolean) => Promise<void>;
  vehicleId: string;
  editingRecord?: MaintenanceRecord | null;
  initialExtractedData?: Partial<MaintenanceRecord> | null;
}

export const MaintenanceRecordModal: React.FC<MaintenanceRecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleId,
  editingRecord,
  initialExtractedData,
}) => {
  const { user, language } = useAuth();
  const t = translations[language];

  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [odometer, setOdometer] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>('oil_filter');
  const [description, setDescription] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [currency, setCurrency] = useState<string>('SAR');
  const [workshop, setWorkshop] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [parts, setParts] = useState<string[]>([]);
  const [newPartInput, setNewPartInput] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string | undefined>(undefined);
  const [documentName, setDocumentName] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (editingRecord) {
      setDate(editingRecord.date || todayStr);
      setOdometer(editingRecord.odometer ? String(editingRecord.odometer) : '');
      setServiceType(editingRecord.serviceType || 'oil_filter');
      setDescription(editingRecord.description || '');
      setCost(editingRecord.cost !== undefined ? String(editingRecord.cost) : '');
      setCurrency(editingRecord.currency || 'SAR');
      setWorkshop(editingRecord.workshop || '');
      setNotes(editingRecord.notes || '');
      setParts(editingRecord.parts || []);
      setDocumentUrl(editingRecord.documentUrl);
      setDocumentName(editingRecord.documentName);
    } else if (initialExtractedData) {
      setDate(initialExtractedData.date || todayStr);
      setOdometer(initialExtractedData.odometer ? String(initialExtractedData.odometer) : '');
      setServiceType(initialExtractedData.serviceType || 'oil_filter');
      setDescription(initialExtractedData.description || '');
      setCost(initialExtractedData.cost !== undefined ? String(initialExtractedData.cost) : '');
      setCurrency(initialExtractedData.currency || 'SAR');
      setWorkshop(initialExtractedData.workshop || '');
      setNotes(initialExtractedData.notes || '');
      setParts(initialExtractedData.parts || []);
      setDocumentUrl(initialExtractedData.documentUrl);
      setDocumentName(initialExtractedData.documentName);
    } else {
      setDate(todayStr);
      setOdometer('');
      setServiceType('oil_filter');
      setDescription('');
      setCost('');
      setCurrency('SAR');
      setWorkshop('');
      setNotes('');
      setParts([]);
      setDocumentUrl(undefined);
      setDocumentName(undefined);
    }
    setErrorMsg(null);
  }, [editingRecord, initialExtractedData, isOpen]);

  if (!isOpen) return null;

  const handleAddPart = () => {
    if (newPartInput.trim() && !parts.includes(newPartInput.trim())) {
      setParts([...parts, newPartInput.trim()]);
      setNewPartInput('');
    }
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg(language === 'ar' ? 'حجم الملف يتجاوز 15 ميجابايت' : 'File exceeds 15MB limit');
      return;
    }

    try {
      setLoading(true);
      const { base64 } = await compressImageIfNeeded(file);
      setDocumentUrl(base64);
      setDocumentName(file.name);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تحميل الملف');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى كتابة وصف للعملية المنفذة' : 'Please provide a service description');
      return;
    }

    const parsedOdometer = parseInt(odometer, 10);
    if (isNaN(parsedOdometer) || parsedOdometer < 0) {
      setErrorMsg(language === 'ar' ? 'قراءة العداد غير صحيحة' : 'Invalid odometer reading');
      return;
    }

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      setErrorMsg(language === 'ar' ? 'التكلفة يجب أن تكون رقماً غير سالب' : 'Cost must be a positive number');
      return;
    }

    setLoading(true);
    try {
      if (editingRecord) {
        await onSave({
          date,
          odometer: parsedOdometer,
          serviceType,
          description: description.trim(),
          cost: parsedCost,
          currency,
          workshop: workshop.trim(),
          parts,
          notes: notes.trim(),
          documentUrl,
          documentName,
        }, true);
      } else {
        await onSave({
          userId: user?.uid || 'guest-user',
          vehicleId,
          date,
          odometer: parsedOdometer,
          serviceType,
          description: description.trim(),
          cost: parsedCost,
          currency,
          workshop: workshop.trim(),
          parts,
          notes: notes.trim(),
          documentUrl,
          documentName,
          isAiExtracted: !!initialExtractedData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, false);
      }
      onClose();
    } catch (err: any) {
      console.error('Save record error:', err);
      setErrorMsg(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingRecord ? t.editRecord : t.addRecord}
              </h3>
              {initialExtractedData && (
                <span className="text-[11px] font-medium text-emerald-600">
                  ✨ {t.reviewExtractedData}
                </span>
              )}
            </div>
          </div>
          <button
            id="close-maintenance-modal-btn"
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
          
          {/* Service Date & Odometer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="record-date-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.serviceDate} <span className="text-rose-500">*</span>
              </label>
              <input
                id="record-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="record-odometer-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.serviceOdometer} <span className="text-rose-500">*</span>
              </label>
              <input
                id="record-odometer-input"
                type="number"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="مثال: 54000"
                min="0"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                required
              />
            </div>
          </div>

          {/* Service Type & Workshop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="record-type-select" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.serviceType} <span className="text-rose-500">*</span>
              </label>
              <select
                id="record-type-select"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                {Object.entries(t.serviceTypes).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="record-workshop-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.workshop}
              </label>
              <input
                id="record-workshop-input"
                type="text"
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value)}
                placeholder={t.workshopPlaceholder}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="record-desc-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.description} <span className="text-rose-500">*</span>
            </label>
            <input
              id="record-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              required
            />
          </div>

          {/* Parts List */}
          <div>
            <label htmlFor="record-add-part-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.partsUsed}
            </label>
            <div className="flex gap-2">
              <input
                id="record-add-part-input"
                type="text"
                value={newPartInput}
                onChange={(e) => setNewPartInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPart();
                  }
                }}
                placeholder={t.partsPlaceholder}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button
                type="button"
                id="add-part-btn"
                onClick={handleAddPart}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.addPart}</span>
              </button>
            </div>
            
            {parts.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {parts.map((part, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    <span>{part}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">{t.noPartsAdded}</p>
            )}
          </div>

          {/* Cost & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="record-cost-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.cost} <span className="text-rose-500">*</span>
              </label>
              <input
                id="record-cost-input"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder={t.costPlaceholder}
                min="0"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                required
              />
            </div>
            <div>
              <label htmlFor="record-currency-input" className="block text-xs font-semibold text-slate-700 mb-1">
                {t.currency}
              </label>
              <select
                id="record-currency-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-semibold"
              >
                <option value="SAR">SAR - ريال سعودي</option>
                <option value="AED">AED - درهم إماراتي</option>
                <option value="KWD">KWD - دينار كويتي</option>
                <option value="USD">USD - دولار أمريكي</option>
                <option value="EUR">EUR - يورو</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="record-notes-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {t.notes}
            </label>
            <textarea
              id="record-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Attachment upload / preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t.attachedInvoice}
            </label>
            {documentUrl ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-900 truncate">
                    {documentName || 'فاتورة صيانة مرفقة'}
                  </span>
                </div>
                <button
                  type="button"
                  id="remove-invoice-doc-btn"
                  onClick={() => {
                    setDocumentUrl(undefined);
                    setDocumentName(undefined);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-xl p-3 text-center transition-colors">
                <input
                  id="record-file-upload-input"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-600 font-medium">{t.uploadInvoiceHint}</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              id="cancel-record-btn"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              id="save-record-submit-btn"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {loading ? t.loading : t.saveRecord}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
