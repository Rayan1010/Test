import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Database, 
  Cpu, 
  Info, 
  CheckCircle2, 
  ShieldCheck,
  Github,
  KeyRound
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { language, setLanguage, user, isGuest, signInGoogle, signOut } = useAuth();
  const t = translations[language];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{t.navSettings}</h2>
            <p className="text-xs text-slate-500">{language === 'ar' ? 'تفضيلات التطبيق، اللغة، والخدمات السحابية' : 'App preferences, language, and connected cloud services'}</p>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Globe className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t.language}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            id="lang-select-ar"
            onClick={() => setLanguage('ar')}
            className={`p-4 rounded-xl border text-start flex items-center justify-between transition-all ${
              language === 'ar'
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold ring-1 ring-emerald-500'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div>
              <p className="text-sm font-bold">العربية (RTL)</p>
              <p className="text-xs text-slate-500 mt-0.5">اللغة الأساسية لواجهات التطبيق</p>
            </div>
            {language === 'ar' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </button>

          <button
            id="lang-select-en"
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border text-start flex items-center justify-between transition-all ${
              language === 'en'
                ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold ring-1 ring-emerald-500'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div>
              <p className="text-sm font-bold">English (LTR)</p>
              <p className="text-xs text-slate-500 mt-0.5">Left-to-Right English Interface</p>
            </div>
            {language === 'en' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* Account & Security Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">
            {language === 'ar' ? 'حساب المستخدم والأمان' : 'User Account & Security'}
          </h3>
        </div>

        {user ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
                  {(user.displayName || user.email || 'U').charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-slate-900">{user.displayName || 'Google User'}</p>
                <p className="text-[11px] text-slate-500">{user.email}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'ar' ? 'بياناتك محفوظة سحابياً في Firestore' : 'Data secured in Cloud Firestore'}
                </span>
              </div>
            </div>

            <button
              onClick={signOut}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
            >
              {t.logout}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-900">{t.guestMode}</p>
              <p className="text-[11px] text-amber-800 mt-0.5">{t.guestNotice}</p>
            </div>
            <button
              onClick={signInGoogle}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shrink-0 shadow-xs"
            >
              {t.loginWithGoogle}
            </button>
          </div>
        )}
      </div>

      {/* Cloud & AI Status */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{t.storage}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">Firebase Firestore & Auth</span>
                <span className="text-[11px] text-slate-500 block">قواعد الأمان مفعلة (RBAC) لحماية بيانات كل مستخدم</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {t.activeAndReady}
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-900 block">{t.geminiStatus}</span>
                <span className="text-[11px] text-slate-500 block">يعمل حصرياً من خلال Server-side runtime لحماية المفاتيح</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {t.activeAndReady}
            </span>
          </div>
        </div>
      </div>

      {/* About Box */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-slate-600 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>{t.aboutSijil}</span>
        </div>
        <p>{t.aboutText}</p>
        <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-200">
          سِجل • Production Version 1.0.0
        </p>
      </div>

    </div>
  );
};
