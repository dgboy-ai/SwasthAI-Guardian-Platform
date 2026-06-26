import { useState } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', org: '', district: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Name and email are required'); return; }
    setSending(true); setError('');
    try {
      await api.post('/contact/demo-request', form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', org: '', district: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Get In Touch</p>
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-8">Contact Sales</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 mb-2">Government & Enterprise</h3>
            <p className="text-xs text-slate-500">State health ministries, district administrations, national health missions.</p>
            <a href="mailto:enterprise@swasthai.in" className="text-emerald-600 text-sm font-bold mt-3 block">enterprise@swasthai.in</a>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 mb-2">NGO & Non-Profit</h3>
            <p className="text-xs text-slate-500">Partner organizations, community health workers, rural development trusts.</p>
            <a href="mailto:ngo@swasthai.in" className="text-emerald-600 text-sm font-bold mt-3 block">ngo@swasthai.in</a>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 mb-2">Technical Support</h3>
            <p className="text-xs text-slate-500">API access, integration support, deployment assistance.</p>
            <a href="mailto:support@swasthai.in" className="text-emerald-600 text-sm font-bold mt-3 block">support@swasthai.in</a>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-black text-slate-900 mb-2">Media & Press</h3>
            <p className="text-xs text-slate-500">Press kits, case studies, partnership announcements.</p>
            <a href="mailto:press@swasthai.in" className="text-emerald-600 text-sm font-bold mt-3 block">press@swasthai.in</a>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-lg font-black mb-2">Request a Demo</h2>
          <p className="text-sm text-slate-400 mb-6">Our team will walk you through the platform with your district's data.</p>

          {sent ? (
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-2xl p-6 text-center">
              <p className="text-lg font-black text-emerald-400 mb-1">✓ Request Sent!</p>
              <p className="text-sm text-slate-300">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="email" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="text" placeholder="Organization" value={form.org} onChange={e => setForm(p => ({ ...p, org: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select District</option>
                  <option value="Sehore">Sehore</option>
                  <option value="Bhopal">Bhopal</option>
                  <option value="Indore">Indore</option>
                  <option value="Varanasi">Varanasi</option>
                  <option value="Pune">Pune</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <textarea placeholder="Message (optional)" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}
              <button type="submit" disabled={sending}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors">
                {sending ? 'Sending...' : 'Schedule Demo'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
