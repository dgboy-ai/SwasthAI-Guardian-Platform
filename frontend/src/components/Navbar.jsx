import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HeartPulse, User, LogOut, Menu, X, Shield,
  Activity, Truck, Scan, Home, Globe, Droplets, Mic, BookOpen,
  WifiOff, Wifi, Download, Share2, QrCode, Copy, Check, Sparkles, Plus
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const getNetworkState = () => {
    const simulated = localStorage.getItem('simulated_network_state');
    if (simulated === 'offline') return false;
    if (simulated === 'online') return true;
    return navigator.onLine;
  };
  const [isOnline, setIsOnline] = useState(getNetworkState);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (user) {
      if (user.role === 'villager') navigate('/villager');
      else if (user.role === 'ngo') navigate('/ngo');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const goOnline = () => {
      const simulated = localStorage.getItem('simulated_network_state');
      if (simulated === 'offline') return;
      setIsOnline(true);
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const languages = [
    { code: 'hi', label: 'हिन्दी' },
    { code: 'en', label: 'English' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'bn', label: 'বাংলা' },
  ];

  const villagerLinks = (t) => [
    { name: t.nav?.home || 'Home', path: '/villager', icon: Home },
    { name: t.nav?.schemes || 'Schemes 📋', path: '/schemes', icon: BookOpen },
    { name: t.nav?.check_symptoms || 'Symptom Check', path: '/symptoms', icon: Activity },
    { name: t.nav?.skin_care || 'Skin Scan', path: '/skin-disease', icon: Scan },
    { name: t.nav?.ambulance || 'Ambulance', path: '/ambulance', icon: Truck },
    { name: t.nav?.menstrual_health || 'Menstrual', path: '/menstrual-health', icon: Droplets },
  ];

  const ngoLinks = (t) => [
    { name: t.nav?.home || 'Dashboard', path: '/ngo', icon: Home },
    { name: t.ngo?.maternal_care || 'Maternal Care', path: '/ngo/maternal', icon: HeartPulse },
    { name: t.ngo?.child_nutrition || 'Child Nutrition', path: '/ngo/child-nutrition', icon: Activity },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`sticky top-0 z-[100] transition-all duration-300 w-full ${isScrolled
          ? 'py-2 sm:py-3 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-xl'
          : 'py-2.5 sm:py-4 bg-white border-b border-slate-100'
        }`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">

          {/* Logo */}
          <div onClick={handleHomeClick} className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 flex items-center justify-center rounded-xl shadow-lg group-hover:rotate-12 transition-transform shrink-0">
              <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black text-slate-900 tracking-tighter uppercase group-hover:text-emerald-700 transition-colors">
                SwasthAI <span className="text-emerald-600 font-medium hidden xs:inline">Guardian</span>
              </span>
              <span className="hidden sm:block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Rural Health Network
              </span>
            </div>
          </div>

          {/* Villager Navigation Links (Desktop Only) */}
          {user && user.role === 'villager' && (
            <div className="hidden xl:flex items-center gap-1">
              {villagerLinks(t).map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${isActive(link.path)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                    }`}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {/* NGO Navigation Links (Desktop Only) */}
          {user && user.role === 'ngo' && (
            <div className="hidden xl:flex items-center gap-1">
              {ngoLinks(t).map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all whitespace-nowrap ${isActive(link.path)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                    }`}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {/* Admin links */}
          {user && user.role === 'admin' && (
            <div className="hidden xl:flex items-center gap-1">
              <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all ${isActive('/admin') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'}`}>
                <Home className="w-3.5 h-3.5" /> {t.nav?.admin_hub || 'District Hub'}
              </Link>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

            {/* Language Selector - compact on mobile */}
            <div className="flex items-center">
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="bg-slate-100/80 border border-slate-200 text-emerald-700 text-[10px] sm:text-xs font-black uppercase rounded-lg sm:rounded-xl px-1.5 sm:px-2 py-1 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[70px] sm:max-w-none"
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code} className="text-slate-900 font-bold uppercase">
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Share App Button (Permanent) */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
              title="Share App / QR Code"
            >
              <Share2 className="w-3 h-3" /> {t.nav?.share || 'Share'}
            </button>

            {/* PWA Download Button (Desktop) */}
            {installPrompt && (
              <button
                onClick={handleInstallClick}
                className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all border border-emerald-200"
              >
                <Download className="w-3 h-3" /> {t.nav?.app_download || 'App Download'}
              </button>
            )}

            <div className="hidden xl:block w-px h-6 bg-slate-200 mx-1" />

            {/* Auth Buttons */}
            {user ? (
              <div className="hidden xl:flex items-center gap-2">
                <Link
                  to="/profile"
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${isActive('/profile')
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  title="My Profile"
                >
                  <User className="w-4 h-4" />
                </Link>
                <button
                  onClick={logout}
                  className="w-9 h-9 flex items-center justify-center bg-slate-900 text-white rounded-xl hover:bg-rose-600 transition-all border border-slate-900"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link to="/pricing" className="hidden xl:block px-4 py-2 text-[11px] font-black text-slate-700 hover:text-emerald-600 uppercase tracking-widest transition-colors">Pricing</Link>
                <Link to="/about" className="hidden xl:block px-4 py-2 text-[11px] font-black text-slate-700 hover:text-emerald-600 uppercase tracking-widest transition-colors">About</Link>
                <Link to="/contact" className="hidden xl:block px-4 py-2 text-[11px] font-black text-slate-700 hover:text-emerald-600 uppercase tracking-widest transition-colors">Contact</Link>
                <Link to="/login" className="hidden xl:block px-5 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                  {t.login || 'Sign In'}
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 sm:p-2 bg-slate-100 rounded-lg text-slate-900 border border-slate-200 shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - slides down */}
        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 shadow-2xl p-3 sm:p-4 z-50 overflow-y-auto max-h-[80vh]">
            <div className="flex flex-col gap-2">

              {/* PWA Download Button (Mobile) */}
              {installPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center justify-between p-4 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-200 mb-2 group"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 group-hover:bounce" />
                    {t.nav?.app_download_prompt || 'App Download / डाउनलोड करें'}
                  </div>
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* User Profile Info in Mobile */}
              {user && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl mb-2">
                  <div className="w-10 h-10 bg-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center font-black">
                    {(user.name || user.username || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm leading-tight">{user.name || user.username || 'User'}</p>
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
              )}

              {/* Villager pages in mobile */}
              {user && user.role === 'villager' && villagerLinks(t).map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all ${isActive(link.path) ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'text-white' : 'text-emerald-600'}`} />
                  {link.name}
                </Link>
              ))}

              {/* NGO pages in mobile */}
              {user && user.role === 'ngo' && ngoLinks(t).map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all ${isActive(link.path) ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'text-white' : 'text-emerald-600'}`} />
                  {link.name}
                </Link>
              ))}

              {/* Admin pages in mobile */}
              {user && user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all ${isActive('/admin') ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <Home className={`w-4 h-4 ${isActive('/admin') ? 'text-white' : 'text-emerald-600'}`} /> {t.nav?.admin_hub || 'District Hub'}
                </Link>
              )}

              {/* Profile Link (for all roles) */}
              {user && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all ${isActive('/profile') ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <User className={`w-4 h-4 ${isActive('/profile') ? 'text-white' : 'text-emerald-600'}`} /> {t.nav?.profile || 'My Profile'}
                </Link>
              )}

              {/* Logout */}
              {user && (
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  className="flex items-center justify-center gap-3 p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-wide mt-2 w-full text-sm transition-colors border border-rose-100"
                >
                  <LogOut className="w-4 h-4" />
                  {t.logout || 'Secure Logout'}
                </button>
              )}

              {/* Not logged in */}
              {!user && (
                <>
                  <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3.5 text-slate-700 hover:text-emerald-600 rounded-2xl font-black uppercase tracking-wide text-sm transition-colors">Pricing</Link>
                  <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3.5 text-slate-700 hover:text-emerald-600 rounded-2xl font-black uppercase tracking-wide text-sm transition-colors">About</Link>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3.5 text-slate-700 hover:text-emerald-600 rounded-2xl font-black uppercase tracking-wide text-sm transition-colors">Contact</Link>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-3 p-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-wide text-sm mt-2 shadow-lg shadow-emerald-200">
                    {t.login || 'Sign In'}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Offline Status Banner */}
        {!isOnline && (
          <div className="w-full bg-amber-50 border-b border-amber-200 py-2">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex-1">
                {t.nav?.offline_mode || 'Offline Mode'} — {t.nav?.offline_desc || 'Symptom Checker works. Voice & AI need internet.'}
              </p>
              <span className="text-[9px] text-amber-400 font-medium shrink-0">No data used</span>
            </div>
          </div>
        )}

      </nav>

      {/* 📱 Bottom Navigation Bar — Critical for one-handed rural mobile use */}
      {user && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-2 py-2 pb-safe-area flex items-center justify-around z-[150] shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
          {(user.role === 'villager'
            ? [
              { name: t.nav?.home || 'Home', path: '/villager', icon: Home },
              { name: t.nav?.check_symptoms?.split(' ')[0] || 'Symptoms', path: '/symptoms', icon: Activity },
              { name: t.nav?.skin_care?.split(' ')[0] || 'Skin Scan', path: '/skin-disease', icon: Scan },
              { name: t.nav?.ambulance || 'Ambulance', path: '/ambulance', icon: Truck },
            ]
            : ngoLinks(t)
          ).map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive(link.path) ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isActive(link.path) ? 'bg-emerald-50' : 'bg-transparent'
                }`}>
                <link.icon className={`w-4.5 h-4.5 ${isActive(link.path) ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter">{link.name}</span>
            </Link>
          ))}
          {/* Mobile Profile Trigger */}
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive('/profile') ? 'text-emerald-600' : 'text-slate-400'
              }`}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${isActive('/profile') ? 'bg-emerald-50' : ''}`}>
              <User className="w-4.5 h-4.5" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-tighter">{t.nav?.profile || 'Profile'}</span>
          </Link>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => setShareModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 lg:p-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{t.nav?.share_title || 'Share SwasthAI'}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.nav?.share_subtitle || 'Village Health QR Code'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <QRCodeCanvas value={appUrl} size={180} level="H" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 text-center px-4">
                    {t.nav?.share_scan_desc || 'Scan this code to open the app instantly on another phone.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCopyLink}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all"
                  >
                    {copied ? (
                      <><Check className="w-4 h-4" /> {t.nav?.link_copied || 'Link Copied!'}</>
                    ) : (
                      <><Copy className="w-4 h-4" /> {t.nav?.copy_link || 'Copy App Link'}</>
                    )}
                  </button>

                  {installPrompt && (
                    <button
                      onClick={() => { setShareModalOpen(false); handleInstallClick(); }}
                      className="w-full h-14 bg-emerald-100 text-emerald-700 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-200 transition-all border border-emerald-200"
                    >
                      <Download className="w-4 h-4" /> {t.nav?.install_phone || 'Install on this Phone'}
                    </button>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                    {t.nav?.space_offline || 'Requires only 2MB space • Works Offline'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
