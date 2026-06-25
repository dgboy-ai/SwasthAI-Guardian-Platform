import Navbar from '../components/Navbar';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">Legal</p>
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-8">Privacy & Data Security</h1>

        <div className="prose prose-slate max-w-none">
          <h2 className="text-xl font-black text-slate-900 mt-8 mb-3">Data Protection</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            SwasthAI Guardian is designed with privacy-first architecture in compliance with India's Digital Personal Data Protection Act (DPDP) 2023 and the Ministry of Health's DI SHA guidelines. All personally identifiable information (PII) is encrypted at rest and in transit.
          </p>

          <h2 className="text-xl font-black text-slate-900 mt-8 mb-3">Aadhaar & Identity</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Aadhaar numbers are hashed with a unique salt before storage. Raw Aadhaar numbers are never logged, cached, or transmitted to frontend clients. The system supports e-KYC verification through compliant APIs only.
          </p>

          <h2 className="text-xl font-black text-slate-900 mt-8 mb-3">Data Residency</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            All health data is stored in AWS ap-south-1 (Mumbai) region. DynamoDB tables are encrypted with AWS KMS. Aurora PostgreSQL backups are encrypted and retained per government health data retention policies.
          </p>

          <h2 className="text-xl font-black text-slate-900 mt-8 mb-3">Audit Trail</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Every security-sensitive operation (admin login, data export, role change) is logged to an immutable DynamoDB audit table with actor, action, resource, timestamp, and trace ID. Audit logs are retained indefinitely for compliance.
          </p>

          <h2 className="text-xl font-black text-slate-900 mt-8 mb-3">Consent Management</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            The platform implements DI SHA consent modal for all villagers. Health data is only processed after explicit user consent. Users can withdraw consent at any time, triggering data anonymization.
          </p>

          <h2 className="text-xl font-black text-slate-900 mt-8 mb-3">Security Measures</h2>
          <ul className="list-disc pl-6 text-slate-600 text-sm space-y-1.5">
            <li>Helmet.js HTTP security headers (CSP, HSTS, X-Frame-Options)</li>
            <li>Rate limiting (100 req/min per IP)</li>
            <li>JWT token authentication with refresh rotation</li>
            <li>Bcrypt password hashing (10 salt rounds)</li>
            <li>Input validation via Zod schemas on all endpoints</li>
            <li>SQL injection prevention via parameterized queries</li>
            <li>PII redaction middleware for all logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
