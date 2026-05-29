import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  HeartPulse, Shield, Phone, Mail, Lock, User,
  ArrowRight, ChevronLeft, MapPin, AlertCircle,
  CheckCircle, Globe, Heart, Activity
} from 'lucide-react';

export default function RegisterPage() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    role: 'villager',
    villageId: 'v101',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, loginPassword } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (!formData.name || !formData.username || !formData.password) {
        throw new Error('Full name, username, and password are required.');
      }
      if (!formData.phone && !formData.email) {
        throw new Error('Please provide at least a phone number or email address.');
      }
      await register(formData);
      const identifier = formData.email || formData.phone;
      await loginPassword(identifier, formData.password, formData.role);
      setSuccess(true);
      setTimeout(() => navigate(`/${formData.role}`), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'villager', label: 'Villager',    sub: 'Patient / Citizen',   icon: User,   desc: 'Check symptoms, request ambulance, track health.' },
    { id: 'ngo',      label: 'ASHA Worker', sub: 'Healthcare Provider', icon: Shield, desc: 'Manage village health, pregnancies, child nutrition.' },
    { id: 'admin',    label: 'Admin',       sub: 'District Management', icon: MapPin, desc: 'Analytics, outbreak alerts, dispatch oversight.' },
  ];

  const whyJoin = [
    { icon: Heart,    text: 'Free AI health screening in your language' },
    { icon: Activity, text: 'One-tap ambulance dispatch in emergencies' },
    { icon: Globe,    text: 'Offline-first — works without internet' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-inter overflow-hidden">

      {/* ── LEFT PANEL ── */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="hidden lg:flex w-[42%] relative overflow-hidden bg-[#0A2E24] flex-col justify-between p-14"
      >
        <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] left-[-10%] w-72 h-72 bg-teal-400 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-100/60 hover:text-white transition-all text-sm font-bold mb-16 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="p-3.5 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10">
              <HeartPulse className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">SwasthAI</h1>
              <p className="text-emerald-400/70 text-[10px] font-bold uppercase tracking-widest">Rural Health Network</p>
            </div>
          </div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6 tracking-tight"
          >
            Join India's largest<br />
            <span className="text-emerald-400 italic">rural health network.</span>
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-emerald-100/60 text-base leading-relaxed font-medium max-w-sm mb-10"
          >
            Create a free account in under 60 seconds. Access AI diagnostics, emergency services, and maternal health tracking - all in your local language.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            {whyJoin.map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-emerald-100/70 text-sm font-medium">{item.text}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom privacy note */}
        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
          className="relative z-10 p-5 bg-white/5 border border-white/10 rounded-2xl"
        >
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Your privacy matters</p>
          <p className="text-emerald-100/50 text-xs font-medium leading-relaxed">
            We never share your health data. All records are encrypted and only accessible to you and the healthcare workers you authorize.
          </p>
        </motion.div>
      </motion.div>

      {/* ── RIGHT PANEL — FORM ── */}
      <div className="w-full lg:w-[58%] flex flex-col justify-center items-center p-5 sm:p-8 lg:p-14 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg py-8"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <HeartPulse className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-black text-slate-900 text-lg">SwasthAI</span>
          </div>

          {/* Header */}
          <div className="mb-5 sm:mb-10">
            <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-full mb-2 sm:mb-4">
              Free Account - Under 60s
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-1.5 sm:mb-2">
              Create Account
            </h2>
            <p className="text-slate-400 font-medium text-[11px] sm:text-sm max-w-sm leading-relaxed">
              Join thousands in rural India who use SwasthAI to stay healthy and get help fast.
            </p>
          </div>

          {/* Error / Success */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-3 text-sm font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="mb-6 p-5 bg-emerald-600 text-white rounded-2xl flex items-center gap-3 text-sm font-black shadow-xl shadow-emerald-200"
              >
                <CheckCircle className="w-5 h-5 shrink-0" /> Account created! Taking you to your dashboard...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1 — Role */}
          <div className="mb-8">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
              Step 1 - I am registering as a...
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
              {roles.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'role', value: r.id } })}
                  className={`p-2.5 sm:p-4 rounded-xl border-2 text-left transition-all ${
                    formData.role === r.id
                      ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-100'
                      : 'bg-slate-50 border-slate-100 hover:border-emerald-200'
                  }`}
                >
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 transition-all ${formData.role === r.id ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                    <r.icon className="w-3.5 h-3.5" />
                  </div>
                  <p className={`font-black text-[9px] sm:text-xs leading-tight ${formData.role === r.id ? 'text-slate-900' : 'text-slate-500'}`}>{r.label}</p>
                  <p className={`text-[7px] sm:text-[9px] font-bold mt-0.5 ${formData.role === r.id ? 'text-emerald-600' : 'text-slate-300'}`}>{r.sub}</p>
                </button>
              ))}
            </div>
            {/* Role description */}
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-800 font-medium">
                {roles.find(r => r.id === formData.role)?.desc}
              </p>
            </div>
          </div>

          {/* Step 2 — Details */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step 2 - Your Details</p>

            {/* Name + Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {[
                { name: 'name',     label: 'Full Name',  icon: User,   placeholder: 'Name...',    type: 'text', required: true  },
                { name: 'username', label: 'Username',   icon: User,   placeholder: 'Username...',    type: 'text', required: true  },
              ].map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                      <field.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Mobile..."
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
 
              <div className="space-y-1">
                <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email <span className="normal-case font-medium text-slate-300">(opt)</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Village ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Village / Area Code</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="villageId"
                  value={formData.villageId}
                  onChange={handleInputChange}
                  placeholder="e.g. v101, rampur-sec4"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">This links you to your village's health data. Use the default "v101" for the demo.</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Create a Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Min. 8 characters recommended"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 text-sm font-bold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || success}
              whileHover={{ y: -2, boxShadow: '0 16px 32px -8px rgba(16,185,129,0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating your account...</>
                ) : success ? (
                  <><CheckCircle className="w-4 h-4" /> Account Created!</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </span>
            </motion.button>
          </form>

          {/* Login link */}
          <div className="mt-8 text-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">
              Already have an account?{' '}
              <Link to="/login" className="font-black text-emerald-600 hover:text-emerald-700 transition-colors underline underline-offset-2">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
