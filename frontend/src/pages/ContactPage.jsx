import Navbar from '../components/Navbar';

export default function ContactPage() {
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
          <a
            href="mailto:sales@swasthai.in?subject=Demo Request"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-wider transition-colors"
          >
            Schedule Demo
          </a>
        </div>
      </div>
    </div>
  );
}
