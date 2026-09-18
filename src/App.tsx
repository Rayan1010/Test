import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './lib/AuthContext';
import { translations } from './lib/translations';
import { Vehicle, MaintenanceRecord, Reminder } from './types';
import { 
  getVehicles, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getReminders,
  createReminder,
  toggleReminderStatus,
  deleteReminder
} from './lib/firestoreService';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { VehiclesManager } from './components/VehiclesManager';
import { MaintenanceTimeline } from './components/MaintenanceTimeline';
import { InvoiceScanner } from './components/InvoiceScanner';
import { RemindersManager } from './components/RemindersManager';
import { ServiceReport } from './components/ServiceReport';
import { SettingsView } from './components/SettingsView';
import { VehicleModal } from './components/VehicleModal';
import { MaintenanceRecordModal } from './components/MaintenanceRecordModal';
import { ReminderModal } from './components/ReminderModal';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function MainApp() {
  const { user, isGuest, loading: authLoading, language, activeVehicleId, setActiveVehicleId, signInGoogle, continueAsGuest } = useAuth();
  const t = translations[language];

  // App Navigation Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Modals state
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [extractedInvoiceData, setExtractedInvoiceData] = useState<Partial<MaintenanceRecord> | null>(null);

  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch vehicles for authenticated user (or guest local storage fallback)
  useEffect(() => {
    async function loadVehicles() {
      if (authLoading) return;

      setDataLoading(true);
      try {
        if (user) {
          const userVehicles = await getVehicles(user.uid);
          setVehicles(userVehicles);
          if (userVehicles.length > 0) {
            if (!activeVehicleId || !userVehicles.some((v) => v.id === activeVehicleId)) {
              setActiveVehicleId(userVehicles[0].id);
            }
          }
        } else if (isGuest) {
          // Local fallback for guest
          const localVehicles = localStorage.getItem('sijil_guest_vehicles');
          const parsed: Vehicle[] = localVehicles ? JSON.parse(localVehicles) : [];
          setVehicles(parsed);
          if (parsed.length > 0 && !activeVehicleId) {
            setActiveVehicleId(parsed[0].id);
          }
        } else {
          setVehicles([]);
        }
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setDataLoading(false);
      }
    }

    loadVehicles();
  }, [user, isGuest, authLoading]);

  // Load records and reminders for active vehicle
  const currentVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0] || null;

  useEffect(() => {
    async function loadVehicleData() {
      if (!currentVehicle) {
        setRecords([]);
        setReminders([]);
        return;
      }

      try {
        if (user) {
          const [recs, rems] = await Promise.all([
            getMaintenanceRecords(currentVehicle.id),
            getReminders(currentVehicle.id),
          ]);
          setRecords(recs);
          setReminders(rems);
        } else if (isGuest) {
          const localRecs = localStorage.getItem(`sijil_guest_records_${currentVehicle.id}`);
          setRecords(localRecs ? JSON.parse(localRecs) : []);
          const localRems = localStorage.getItem(`sijil_guest_rems_${currentVehicle.id}`);
          setReminders(localRems ? JSON.parse(localRems) : []);
        }
      } catch (err) {
        console.error('Failed to load records/reminders:', err);
      }
    }

    loadVehicleData();
  }, [currentVehicle?.id, user, isGuest]);

  // Vehicle Handlers
  const handleSaveVehicle = async (vehicleData: any, isEdit: boolean) => {
    try {
      if (user) {
        if (isEdit && editingVehicle) {
          await updateVehicle(editingVehicle.id, vehicleData);
          setVehicles(vehicles.map((v) => (v.id === editingVehicle.id ? { ...v, ...vehicleData } : v)));
          showToast(language === 'ar' ? 'تم تحديث بيانات السيارة بنجاح' : 'Vehicle updated successfully');
        } else {
          const created = await createVehicle({ ...vehicleData, userId: user.uid });
          setVehicles([created, ...vehicles]);
          setActiveVehicleId(created.id);
          showToast(language === 'ar' ? 'تمت إضافة السيارة بنجاح' : 'Vehicle added successfully');
        }
      } else {
        // Guest mode persistence
        if (isEdit && editingVehicle) {
          const updated = vehicles.map((v) => (v.id === editingVehicle.id ? { ...v, ...vehicleData } : v));
          setVehicles(updated);
          localStorage.setItem('sijil_guest_vehicles', JSON.stringify(updated));
          showToast(language === 'ar' ? 'تم حفظ التعديل محلياً' : 'Saved locally');
        } else {
          const newVeh: Vehicle = {
            id: 'guest_veh_' + Date.now(),
            userId: 'guest',
            ...vehicleData,
          };
          const updated = [newVeh, ...vehicles];
          setVehicles(updated);
          setActiveVehicleId(newVeh.id);
          localStorage.setItem('sijil_guest_vehicles', JSON.stringify(updated));
          showToast(language === 'ar' ? 'تمت إضافة السيارة محلياً' : 'Vehicle added locally');
        }
      }
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
      throw err;
    }
  };

  const handleDeleteVehicle = async (vehId: string) => {
    if (!window.confirm(t.deleteVehicleConfirm)) return;

    try {
      if (user) {
        await deleteVehicle(vehId);
      } else {
        const updated = vehicles.filter((v) => v.id !== vehId);
        localStorage.setItem('sijil_guest_vehicles', JSON.stringify(updated));
      }
      const remaining = vehicles.filter((v) => v.id !== vehId);
      setVehicles(remaining);
      if (activeVehicleId === vehId) {
        setActiveVehicleId(remaining.length > 0 ? remaining[0].id : null);
      }
      showToast(language === 'ar' ? 'تم حذف السيارة وسجلاتها' : 'Vehicle deleted successfully');
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
    }
  };

  const handleUpdateOdometer = async (vehId: string, newOdo: number) => {
    try {
      if (user) {
        await updateVehicle(vehId, { currentOdometer: newOdo });
      }
      const updated = vehicles.map((v) => (v.id === vehId ? { ...v, currentOdometer: newOdo } : v));
      setVehicles(updated);
      if (!user) {
        localStorage.setItem('sijil_guest_vehicles', JSON.stringify(updated));
      }
      showToast(t.odometerUpdatedSuccess);
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
    }
  };

  // Maintenance Record Handlers
  const handleSaveRecord = async (recordData: any, isEdit: boolean) => {
    try {
      if (user) {
        if (isEdit && editingRecord) {
          await updateMaintenanceRecord(editingRecord.id, recordData);
          setRecords(records.map((r) => (r.id === editingRecord.id ? { ...r, ...recordData } : r)));
          showToast(language === 'ar' ? 'تم تحديث سجل الصيانة' : 'Record updated successfully');
        } else {
          const created = await createMaintenanceRecord({ ...recordData, userId: user.uid });
          setRecords([created, ...records]);
          // Check if odometer was updated
          if (created.odometer > (currentVehicle?.currentOdometer || 0)) {
            setVehicles(vehicles.map((v) => (v.id === currentVehicle?.id ? { ...v, currentOdometer: created.odometer } : v)));
          }
          showToast(language === 'ar' ? 'تم توثيق سجل الصيانة بنجاح' : 'Service record saved successfully');
        }
      } else {
        // Guest mode
        if (isEdit && editingRecord) {
          const updated = records.map((r) => (r.id === editingRecord.id ? { ...r, ...recordData } : r));
          setRecords(updated);
          if (currentVehicle) localStorage.setItem(`sijil_guest_records_${currentVehicle.id}`, JSON.stringify(updated));
        } else {
          const newRec: MaintenanceRecord = {
            id: 'guest_rec_' + Date.now(),
            userId: 'guest',
            ...recordData,
          };
          const updated = [newRec, ...records];
          setRecords(updated);
          if (currentVehicle) {
            localStorage.setItem(`sijil_guest_records_${currentVehicle.id}`, JSON.stringify(updated));
            if (newRec.odometer > (currentVehicle.currentOdometer || 0)) {
              handleUpdateOdometer(currentVehicle.id, newRec.odometer);
            }
          }
        }
        showToast(language === 'ar' ? 'تم حفظ السجل محلياً' : 'Record saved locally');
      }
      setExtractedInvoiceData(null);
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
      throw err;
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm(t.deleteRecordConfirm)) return;

    try {
      if (user) {
        await deleteMaintenanceRecord(recordId);
      }
      const updated = records.filter((r) => r.id !== recordId);
      setRecords(updated);
      if (!user && currentVehicle) {
        localStorage.setItem(`sijil_guest_records_${currentVehicle.id}`, JSON.stringify(updated));
      }
      showToast(language === 'ar' ? 'تم حذف السجل' : 'Record deleted');
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
    }
  };

  // Reminder Handlers
  const handleSaveReminder = async (reminderData: any) => {
    try {
      if (user) {
        const created = await createReminder({ ...reminderData, userId: user.uid });
        setReminders([...reminders, created]);
      } else {
        const newRem: Reminder = {
          id: 'guest_rem_' + Date.now(),
          ...reminderData,
        };
        const updated = [...reminders, newRem];
        setReminders(updated);
        if (currentVehicle) localStorage.setItem(`sijil_guest_rems_${currentVehicle.id}`, JSON.stringify(updated));
      }
      showToast(language === 'ar' ? 'تمت إضافة التذكير بنجاح' : 'Reminder created');
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
      throw err;
    }
  };

  const handleToggleReminderStatus = async (reminderId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      if (user) {
        await toggleReminderStatus(reminderId, nextStatus);
      }
      const updated = reminders.map((r) => (r.id === reminderId ? { ...r, isCompleted: nextStatus } : r));
      setReminders(updated);
      if (!user && currentVehicle) {
        localStorage.setItem(`sijil_guest_rems_${currentVehicle.id}`, JSON.stringify(updated));
      }
      showToast(nextStatus ? (language === 'ar' ? 'تمت الصيانة بنجاح!' : 'Service marked completed!') : (language === 'ar' ? 'أعيد التذكير إلى قائمة الانتظار' : 'Marked pending'));
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      if (user) {
        await deleteReminder(reminderId);
      }
      const updated = reminders.filter((r) => r.id !== reminderId);
      setReminders(updated);
      if (!user && currentVehicle) {
        localStorage.setItem(`sijil_guest_rems_${currentVehicle.id}`, JSON.stringify(updated));
      }
      showToast(language === 'ar' ? 'تم حذف التذكير' : 'Reminder deleted');
    } catch (err: any) {
      showToast(err.message || t.error, 'error');
    }
  };

  // Auth Landing Guard if not logged in and not guest
  if (!authLoading && !user && !isGuest) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
        
        {/* Top bar */}
        <div className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-xs">
              س
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">سِجل | SIJIL</span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">سجل الصيانة الرقمي المعتمد للسيارات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextLang = language === 'ar' ? 'en' : 'ar';
                localStorage.setItem('sijil_lang', nextLang);
                window.location.reload();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              {language === 'ar' ? 'English' : 'عربي'}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-semibold">
            <span>✨ مدعوم بنموذج Gemini 2.5 Flash لقراءة الفواتير</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {language === 'ar' ? (
              <>سجل صيانة سيارتك بالكامل... <span className="text-emerald-400">بصورة فاتورة فقط</span></>
            ) : (
              <>Complete vehicle maintenance passport... <span className="text-emerald-400">from a single invoice photo</span></>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {language === 'ar' 
              ? 'تتبع فواتير الصيانة الدورية، قطع الغيار، ومواعيد تغيير الزيت والفرامل. حافظ على قيمة سيارتك عند البيع بملف صيانة رقمي موثق بالكامل.'
              : 'Log services, extract workshop invoices using AI, monitor running expenses, and export a certified maintenance log.'}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-google-signin-btn"
              onClick={signInGoogle}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <span>{t.loginWithGoogle}</span>
            </button>

            <button
              id="hero-guest-btn"
              onClick={continueAsGuest}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-colors"
            >
              {t.guestMode}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          سِجل | SIJIL • Cloud Firestore & Gemini Server-Side Production Architecture
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* App Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vehicles={vehicles}
        onAddVehicleClick={() => {
          setEditingVehicle(null);
          setVehicleModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {authLoading || dataLoading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">{t.loading}</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                vehicles={vehicles}
                records={records}
                reminders={reminders}
                onAddVehicleClick={() => {
                  setEditingVehicle(null);
                  setVehicleModalOpen(true);
                }}
                onAddRecordClick={() => {
                  setEditingRecord(null);
                  setExtractedInvoiceData(null);
                  setRecordModalOpen(true);
                }}
                onScanInvoiceClick={() => setActiveTab('scan')}
                onAddReminderClick={() => setReminderModalOpen(true)}
                onViewTimelineClick={() => setActiveTab('timeline')}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesManager
                vehicles={vehicles}
                onAddClick={() => {
                  setEditingVehicle(null);
                  setVehicleModalOpen(true);
                }}
                onEditClick={(veh) => {
                  setEditingVehicle(veh);
                  setVehicleModalOpen(true);
                }}
                onDeleteClick={handleDeleteVehicle}
                onUpdateOdometer={handleUpdateOdometer}
              />
            )}

            {activeTab === 'timeline' && (
              <MaintenanceTimeline
                vehicle={currentVehicle}
                records={records}
                onAddClick={() => {
                  setEditingRecord(null);
                  setExtractedInvoiceData(null);
                  setRecordModalOpen(true);
                }}
                onEditClick={(rec) => {
                  setEditingRecord(rec);
                  setRecordModalOpen(true);
                }}
                onDeleteClick={handleDeleteRecord}
              />
            )}

            {activeTab === 'scan' && (
              <InvoiceScanner
                vehicle={currentVehicle}
                onProceedToSave={(extracted) => {
                  setExtractedInvoiceData(extracted);
                  setEditingRecord(null);
                  setRecordModalOpen(true);
                }}
              />
            )}

            {activeTab === 'reminders' && (
              <RemindersManager
                vehicle={currentVehicle}
                reminders={reminders}
                onAddClick={() => setReminderModalOpen(true)}
                onToggleStatus={handleToggleReminderStatus}
                onDeleteClick={handleDeleteReminder}
              />
            )}

            {activeTab === 'report' && (
              <ServiceReport
                vehicle={currentVehicle}
                records={records}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </>
        )}

      </main>

      {/* Modals */}
      <VehicleModal
        isOpen={vehicleModalOpen}
        onClose={() => setVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        editingVehicle={editingVehicle}
      />

      {currentVehicle && (
        <>
          <MaintenanceRecordModal
            isOpen={recordModalOpen}
            onClose={() => {
              setRecordModalOpen(false);
              setEditingRecord(null);
              setExtractedInvoiceData(null);
            }}
            onSave={handleSaveRecord}
            vehicleId={currentVehicle.id}
            editingRecord={editingRecord}
            initialExtractedData={extractedInvoiceData}
          />

          <ReminderModal
            isOpen={reminderModalOpen}
            onClose={() => setReminderModalOpen(false)}
            onSave={handleSaveReminder}
            vehicle={currentVehicle}
          />
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-slate-800'
              : 'bg-rose-900 text-rose-200 border-rose-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
