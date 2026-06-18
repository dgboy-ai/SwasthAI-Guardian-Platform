import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, Bell, Wifi, WifiOff, Home, AlertTriangle,
  Plus, Users, MoreHorizontal, X, Heart, Clock
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, tab: 'home', route: '/ngo' },
  { label: 'Alerts Logs', icon: AlertTriangle, tab: 'alerts', route: '/ngo/alerts' },
  { label: 'Patients List', icon: Users, tab: 'patients', route: '/ngo/patients' },
  { label: 'Add Record Logs', icon: Plus, tab: 'records', route: '/ngo/records' },
];

export default function NGOSidebarLayout({ children, activeTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const activeTabFromPath = activeTab || (() => {
    const map = { '/ngo': 'home', '/ngo/alerts': 'alerts', '/ngo/patients': 'patients', '/ngo/records': 'records' };
    return map[location.pathname] || 'home';
  })();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const BrandLogo = ({ size }) => (
    <div className="flex items-center gap-2.5">
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
        style={{ width: size === 'lg' ? 36 : size === 'md' ? 32 : 28, height: size === 'lg' ? 36 : size === 'md' ? 32 : 28 }}>
        <Heart className="text-white" style={{ width: size === 'lg' ? 18 : 14, height: size === 'lg' ? 18 : 14 }} />
      </div>
      <span className={`font-black text-slate-800 tracking-tight ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
        Swasth<span className="text-emerald-600">AI</span>
      </span>
    </div>
  );

  const handleNavigation = (route) => {
    navigate(route);
  };

  return (
    <>
      {isDesktop ? (
        /* ═══ DESKTOP LAYOUT (>=1024px): SIDEBAR + CONTENT ═══ */
        <div className="flex h-screen overflow-hidden bg-[#F0F2F5]">
          {/* Sidebar */}
          <aside className={`bg-white border-r border-slate-100 flex flex-col h-full shrink-0 transition-all duration-300 z-30 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}>
            {/* Branding Header */}
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-white justify-between">
              {!sidebarCollapsed && <BrandLogo size="lg" />}
              {sidebarCollapsed && (
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow shadow-emerald-500/20">
                  <Heart className="w-5 h-5 text-white" />
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0 cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <AnimatePresence>
                {NAV_ITEMS.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeTabFromPath === item.tab;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.25, ease: 'easeOut' }}
                    >
                      <button
                        onClick={() => { handleNavigation(item.route); }}
                        className={`relative flex items-center gap-4 w-full px-4 py-4 rounded-2xl transition-all duration-200 border cursor-pointer group ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-50 via-emerald-50/90 to-emerald-100/60 border-emerald-200 text-emerald-900 font-extrabold shadow-lg shadow-emerald-200/40'
                            : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-100 hover:shadow-sm hover:-translate-y-0.5'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeNavIndicator"
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-8 bg-gradient-to-b from-emerald-500 to-emerald-400 rounded-r-full shadow-sm shadow-emerald-500/30"
                          />
                        )}
                        <Icon className={`w-[22px] h-[22px] shrink-0 transition-all duration-200 ${
                          isActive ? 'text-emerald-600 drop-shadow-sm' : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-110'
                        }`} />
                        {!sidebarCollapsed && (
                          <span className="text-sm font-bold tracking-tight">{item.label}</span>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </nav>

            {/* Sidebar footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Online
              </div>
            </div>
          </aside>

          {/* Main Panel */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Topbar */}
            <header className="sticky top-0 bg-white border-b border-slate-100 px-6 xl:px-8 py-2.5 flex items-center justify-between z-20 backdrop-blur-md bg-opacity-95">
              <div className="flex items-center gap-4">
                <h1 className="text-sm lg:text-base font-black text-slate-900 tracking-tight">
                  NGO Health Operations
                </h1>
                <div className="h-5 w-px bg-slate-200 hidden md:block" />
                <div className="hidden md:flex items-center gap-2.5 text-[10px] text-slate-400 font-semibold flex-wrap">
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-600">Live</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all active:scale-95"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 w-full">
              {children}
            </main>
          </div>
        </div>
      ) : (
        /* ═══ MOBILE/TABLET LAYOUT (<1024px): FULL WIDTH + BOTTOM NAV ═══ */
        <div className="min-h-screen bg-[#F0F2F5] flex flex-col">
          {/* Content */}
          <main className="flex-1 pb-20">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-xl z-40">
            <div className="flex items-center justify-between px-3 py-2 max-w-md mx-auto">
              {NAV_ITEMS.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = activeTabFromPath === item.tab;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavigation(item.route)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-black">{item.label === 'Add Record Logs' ? 'Records' : item.label}</span>
                    {isActive && <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-0.5" />}
                  </button>
                );
              })}
              <button
                onClick={() => setShowMenu(true)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[9px] font-black">More</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* More Menu Drawer (Mobile) */}
      <AnimatePresence>
        {showMenu && !isDesktop && (
          <>
            <div className="fixed inset-0 bg-black/30 z-50 backdrop-blur-xs" onClick={() => setShowMenu(false)} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 shadow-2xl flex flex-col text-left"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
                <BrandLogo size="sm" />
                <button onClick={() => setShowMenu(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTabFromPath === item.tab;
                  return (
                    <button
                      key={item.label}
                      onClick={() => { setShowMenu(false); handleNavigation(item.route); }}
                      className={`flex items-center gap-3.5 w-full px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                        isActive ? 'bg-emerald-50 text-emerald-700 font-extrabold' : 'hover:bg-slate-50 font-bold text-slate-700'
                      } text-sm text-left`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
                SwasthAI PWA v1.2.0
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
