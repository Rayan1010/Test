import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { translations } from '../lib/translations';
import { 
  Car, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Wrench, 
  ScanLine, 
  CalendarCheck, 
  FileText, 
  Settings as SettingsIcon,
  LogOut, 
  LogIn, 
  Globe, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { Vehicle } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  vehicles: Vehicle[];
  onAddVehicleClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  vehicles,
  onAddVehicleClick,
}) => {
  const { user, isGuest, language, setLanguage, signOut, signInGoogle, activeVehicleId, setActiveVehicleId } = useAuth();
  const t = translations[language];
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const selectedVehicle = vehicles.find((v) => v.id === activeVehicleId) || vehicles[0];

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: Car },
    { id: 'vehicles', label: t.navVehicles, icon: Car },
    { id: 'timeline', label: t.navTimeline, icon: Wrench },
    { id: 'scan', label: t.navScanInvoice, icon: ScanLine, highlight: true },
    { id: 'reminders', label: t.navReminders, icon: CalendarCheck },
    { id: 'report', label: t.navReport, icon: FileText },
    { id: 'settings', label: t.navSettings, icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-start group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shadow-xs border border-slate-800 transition-transform group-hover:scale-105">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">{t.appName}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider">SIJIL</span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5 font-medium">{t.appSubtitle}</p>
              </div>
            </button>
          </div>

          {/* Active Vehicle Quick Selector (Desktop) */}
          {vehicles.length > 0 && (
            <div className="hidden md:flex items-center bg-slate-100/90 hover:bg-slate-200/80 transition-colors rounded-xl px-3 py-1.5 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium me-2">{t.selectedVehicle}:</span>
              <select
                id="active-vehicle-select"
                value={selectedVehicle?.id || ''}
                onChange={(e) => setActiveVehicleId(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {vehicles.map((veh) => (
                  <option key={veh.id} value={veh.id} className="bg-white text-slate-900">
                    {veh.make} {veh.model} ({veh.year}) {veh.nickname ? `• ${veh.nickname}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : item.highlight
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : item.highlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Lang + Auth */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
              title="تغيير اللغة / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            {/* Auth status */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full ring-2 ring-emerald-500/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  id="user-signout-btn"
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title={t.logout}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="user-signin-btn"
                onClick={signInGoogle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.loginWithGoogle}</span>
                <span className="sm:hidden">{t.login}</span>
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-lg animate-in slide-in-from-top-2">
          {vehicles.length > 0 && (
            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <label htmlFor="mobile-active-vehicle" className="block text-xs font-medium text-slate-500 mb-1">
                {t.selectedVehicle}
              </label>
              <select
                id="mobile-active-vehicle"
                value={selectedVehicle?.id || ''}
                onChange={(e) => setActiveVehicleId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
              >
                {vehicles.map((veh) => (
                  <option key={veh.id} value={veh.id}>
                    {veh.make} {veh.model} ({veh.year}) {veh.nickname ? `• ${veh.nickname}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-start transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : item.highlight
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              id="mobile-add-car-btn"
              onClick={() => {
                onAddVehicleClick();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 p-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addVehicle}</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">سِجل • v1.0.0</span>
          </div>
        </div>
      )}

      {/* Guest Notice banner */}
      {isGuest && !user && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl">
            <span className="font-bold shrink-0">⚠️ {t.guestMode}:</span>
            <span className="truncate">{t.guestNotice}</span>
          </div>
          <button
            id="banner-google-signin"
            onClick={signInGoogle}
            className="shrink-0 font-bold underline hover:text-amber-950 ms-3"
          >
            {t.loginWithGoogle}
          </button>
        </div>
      )}
    </header>
  );
};
