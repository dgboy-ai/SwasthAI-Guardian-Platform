import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, QrCode, Calendar, Droplets, MapPin, Phone, Mail,
  LogOut, Edit3, Shield, Camera, Activity, Scan, Truck,
  HeartPulse, CheckCircle, ArrowRight, ShieldCheck, Star
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function UserProfile() {
  const { t } = useLanguage();
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [history, setHistory] = useState(null); // { symptoms:[], ambulances:[] }
  const [historyLoading, setHistoryLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      // localStorage bridge: profile image persisted locally until backend file storage is wired
      const stored = localStorage.getItem(`swasthai_profileImg_${user.id}`);
      setProfileImage(stored || null);
    }
  }, [user]);

  // Fetch health history from backend
  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    import('../services/api').then(({ default: api }) => {
      api.get('/villager/my-history')
        .then(r => setHistory(r.data))
        .catch(() => setHistory({ symptoms: [], ambulances: [] }))
        .finally(() => setHistoryLoading(false));
    });
  }, [user]);

  const userName   = user?.name     || 'User';
  const villageId  = user?.villageId || '—';
  const userRole   = user?.role     || 'villager';
  const userId     = user?.id       || '—';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setProfileImage(base64String);
      // Persist to localStorage so image survives page refresh and re-login
      if (user?.id) {
        localStorage.setItem(`swasthai_profileImg_${user.id}`, base64String);
      }
      // Forward-compat: try backend (currently no image column, localStorage is source of truth)
      try { await updateProfile({ profileImage: base64String }); }
      catch { /* localStorage covers this until DB migration */ }
    };
    reader.readAsDataURL(file);
  };

  const handleNameSave = async () => {
    if (!editName.trim()) return;
    try {
      await updateProfile({ name: editName.trim() });
      setSaveStatus('✓ Saved');
      setIsEditingName(false);
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('Failed to save');
    }
  };

  const roleLabelMap = {
    villager: t.login?.roles?.[0] || 'Patient / Villager',
    ngo:      t.login?.roles?.[1] || 'ASHA / NGO Worker',
    admin:    t.login?.roles?.[2] || 'District Admin'
  };

  const roleBadgeColor = {
    villager: 'bg-emerald-100 text-emerald-700',
    ngo:      'bg-blue-100 text-blue-700',
    admin:    'bg-slate-100 text-slate-700'
  }[userRole] || 'bg-slate-100 text-slate-700';

  // Quick-access shortcuts only for villagers
  const villagerShortcuts = [
    { label: t.villager?.services?.[0]?.title || 'Symptom Check',   path: '/symptoms',        icon: Activity,   color: 'text-emerald-600 bg-emerald-50' },
    { label: t.villager?.services?.[1]?.title || 'Skin Scan',       path: '/skin-disease',    icon: Scan,       color: 'text-teal-600 bg-teal-50'      },
    { label: t.villager?.services?.[2]?.title || 'Ambulance',       path: '/ambulance',       icon: Truck,      color: 'text-rose-600 bg-rose-50'      },
    { label: t.villager?.services?.[4]?.title || 'Menstrual',       path: '/menstrual-health', icon: Droplets,  color: 'text-pink-600 bg-pink-50'      },
  ];

  return (
    <div className="flex flex-col bg-[#F7F9FB] min-h-screen font-inter pb-24">
      <Navbar />
      
      <main className="flex-1 px-4 pt-10 max-w-lg mx-auto w-full space-y-6">

        {/* PROFILE HEADER */}
        <section className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="relative">
            <div className="w-28 h-28 bg-white rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center">
                  <span className="text-4xl font-black text-white uppercase">
                    {userName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <input 
              type="file" ref={fileInputRef} className="hidden" 
              accept="image/*" onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border-2 border-white"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t.villager?.greeting?.split(',')[0] || 'Namaste'}, {userName} 🙏
            </h1>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleBadgeColor}`}>
              {roleLabelMap[userRole] || userRole}
            </span>
          </div>

          {saveStatus && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold">
              <CheckCircle className="w-4 h-4" /> {saveStatus}
            </div>
          )}
        </section>

        {/* HEALTH ID CARD — shows real user ID, not fake ABHA */}
        <section className="bg-gradient-to-br from-[#0A2E24] to-emerald-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <ShieldCheck className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-emerald-300 font-bold text-[9px] uppercase tracking-[0.2em]">SwasthAI Health ID</p>
              <h2 className="text-xl font-black">{userName}</h2>
              <p className="text-emerald-200 font-mono text-xs tracking-widest bg-black/20 px-2.5 py-1 rounded-lg inline-block mt-1">
                SID-{String(userId).padStart(6, '0')}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-100 text-[11px] font-bold">{villageId}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  userRole === 'villager' ? 'bg-emerald-500/30 text-emerald-200' :
                  userRole === 'ngo' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-500/30 text-slate-200'
                }`}>{userRole}</span>
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-lg border border-white/20">
              <QRCodeSVG
                value={`https://swasthai.app/verify/SID-${String(userId).padStart(6, '0')}`}
                size={64}
                bgColor="#ffffff"
                fgColor="#0A2E24"
                level="M"
              />
            </div>
          </div>
        </section>

        {/* PERSONAL DETAILS — editable name, real data from JWT */}
        <section className="space-y-3">
          <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest pl-1">{t.register?.form_title || 'Account Details'}</h3>
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">

            {/* Name (editable) */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.register?.full_name || 'Full Name'}</p>
                  {isEditingName ? (
                    <input 
                      type="text" value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                      className="text-base font-bold text-slate-900 bg-transparent border-b-2 border-emerald-500 outline-none w-full pb-0.5"
                      autoFocus
                    />
                  ) : (
                    <p className="text-base font-bold text-slate-900 truncate">{userName}</p>
                  )}
                </div>
              </div>
              {isEditingName ? (
                <button onClick={handleNameSave} className="ml-3 px-3 py-1.5 bg-emerald-500 text-white text-xs font-black rounded-xl uppercase tracking-wider hover:bg-emerald-600 shrink-0">
                  {t.login?.login_btn || 'Save'}
                </button>
              ) : (
                <button onClick={() => setIsEditingName(true)} className="p-2 ml-2 rounded-full active:bg-slate-100 shrink-0">
                  <Edit3 className="w-4 h-4 text-slate-300 hover:text-emerald-500" />
                </button>
              )}
            </div>

            {/* Village ID — real from JWT */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.register?.village_id || 'Village / Area ID'}</p>
                  <p className="text-base font-bold text-slate-900">{villageId}</p>
                </div>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.login?.select_role || 'Account Type'}</p>
                  <p className="text-base font-bold text-slate-900 capitalize">{roleLabelMap[userRole] || userRole}</p>
                </div>
              </div>
            </div>

            {/* User ID */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Health ID</p>
                  <p className="text-base font-bold text-slate-900 font-mono tracking-wider">
                    SID-{String(userId).padStart(6, '0')}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* QUICK-ACCESS SERVICES — only for villagers */}
        {userRole === 'villager' && (
          <section className="space-y-3">
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest pl-1">{t.villager?.service_title || 'Your Services'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {villagerShortcuts.map((s) => (
                <button
                  key={s.path}
                  onClick={() => navigate(s.path)}
                  className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight">{s.label}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* MY HEALTH HISTORY */}
        {userRole === 'villager' && (
          <section className="space-y-3">
            <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest pl-1">My Health History</h3>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">

              {historyLoading ? (
                <div className="p-5 space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Symptom checks */}
                  {(history?.symptoms || []).length === 0 && (history?.ambulances || []).length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm font-medium">
                      No activity recorded yet. Use the health tools to get started.
                    </div>
                  ) : (
                    <>
                      {(history?.symptoms || []).map((s, i) => (
                        <div key={i} className="flex items-center gap-4 p-4">
                          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <HeartPulse className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{s.prediction || 'Symptom Check'}</p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{s.symptoms?.slice(0, 60)}</p>
                          </div>
                          <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase shrink-0">Check</span>
                        </div>
                      ))}
                      {(history?.ambulances || []).map((a, i) => (
                        <div key={i} className="flex items-center gap-4 p-4">
                          <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{a.location?.slice(0, 50) || 'Ambulance Request'}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Priority: {a.priority} · {a.status}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase shrink-0 ${
                            a.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                            a.status === 'in_progress' ? 'text-blue-600 bg-blue-50' : 'text-rose-500 bg-rose-50'
                          }`}>{a.status || 'pending'}</span>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* LOGOUT */}
        <button 
          onClick={logout}
          className="w-full p-4 bg-white border border-rose-100 text-rose-600 rounded-2xl font-black uppercase tracking-widest hover:bg-rose-50 hover:border-rose-200 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-sm text-sm"
        >
          <LogOut className="w-5 h-5" />
          {t.login?.logout_btn || 'Logout'}
        </button>

      </main>
    </div>
  );
}
