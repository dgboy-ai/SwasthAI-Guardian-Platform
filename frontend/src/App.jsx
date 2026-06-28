import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import DiSHAConsentModal from './components/DiSHAConsentModal';
import { useConsentGiven } from './utils/consent';

// Pages — critical path (eager loaded for instant auth routing)
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import IntroFlow from './pages/IntroFlow';
import RegisterPage from './pages/RegisterPage';
import DemoPage from './pages/DemoPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';

// Pages — heavy, lazy-loaded for Vercel edge performance & 2G optimization
const VillagerDashboard  = lazy(() => import('./Villager/VillagerDashboard'));
const NGODashboard       = lazy(() => import('./NGO/NGODashboard'));
const ASHADashboard      = lazy(() => import('./NGO/ASHADashboard'));
const AdminDashboard     = lazy(() => import('./Admin/AdminDashboard'));
const SymptomCheckerPage     = lazy(() => import('./pages/SymptomCheckerPage'));
const SkinDiseaseCheckerPage = lazy(() => import('./pages/SkinDiseaseCheckerPage'));
const AmbulancePage          = lazy(() => import('./pages/AmbulancePage'));
const UserProfile            = lazy(() => import('./pages/UserProfile'));
const MenstrualHealth        = lazy(() => import('./pages/MenstrualHealth'));
const MaternalHealthPage     = lazy(() => import('./pages/MaternalHealthPage'));
const ChildNutritionPage     = lazy(() => import('./pages/ChildNutritionPage'));
const GovernmentSchemesPage  = lazy(() => import('./pages/GovernmentSchemesPage'));
const SchemeDetailPage        = lazy(() => import('./pages/SchemeDetailPage'));
const MonitoringDashboard    = lazy(() => import('./pages/MonitoringDashboard'));
const NGOAlertsPage          = lazy(() => import('./pages/NGOAlertsPage'));
const NGOPatientRegistryPage = lazy(() => import('./pages/NGOPatientRegistryPage'));
const NGORecordCreationPage  = lazy(() => import('./pages/NGORecordCreationPage'));
const SystemVerificationPage = lazy(() => import('./pages/SystemVerificationPage'));

// Components
import Footer from './components/Footer';
import OfflineToast from './components/OfflineToast';
import ErrorBoundary from './components/ErrorBoundary';
import DesktopOnlyWrapper from './components/DesktopOnlyWrapper';
import AccessDenied from './components/AccessDenied';

// Skeleton loader shown while lazy chunks download
function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #e2e8f0',
          borderTopColor: '#10b981', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>LOADING…</p>
      </div>
    </div>
  );
}

// Protected Route wrapper to ensure only authorized users access roles
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user.role) && user.role !== 'admin') {
      return <AccessDenied role={user.role} requiredRole={roles[0]} />;
    }
  }
  return children;
};

// Redirect logged-in users to their dashboard on 404, unauthenticated to IntroFlow
function NotFoundRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const rolePaths = { villager: '/villager', ngo: '/ngo', admin: '/admin' };
    return <Navigate to={rolePaths[user.role] || '/'} replace />;
  }
  return <Navigate to="/" replace />;
}

// Shows DISHA consent modal once per device after first login (restricted to villagers, tracked per user)
function ConsentGate({ children }) {
  const { user } = useAuth();
  
  const getConsentKey = (u) => {
    if (!u) return null;
    return `swasthai_disha_consent_${u.id || u.username || u.phone || 'guest'}`;
  };

  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'villager') {
        setConsented(localStorage.getItem(getConsentKey(user)) === 'true');
      } else {
        // Non-villagers do not need DISHA consent modal
        setConsented(true);
      }
    } else {
      setConsented(false);
    }
  }, [user]);

  const handleConsent = () => {
    if (user) {
      localStorage.setItem(getConsentKey(user), 'true');
      setConsented(true);
    }
  };

  const needsConsent = user && user.role === 'villager' && !consented;

  return (
    <>
      {children}
      <AnimatePresence>
        {needsConsent && (
          <DiSHAConsentModal onConsent={handleConsent} />
        )}
      </AnimatePresence>
    </>
  );
}

// Layout wrapper to include footer on all pages
const LayoutWrapper = ({ children }) => (
  <>
    {children}
    <Footer />
  </>
);

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ConsentGate>
        <Router>
          <div className="font-inter">
            <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
            <Routes>
              <Route path="/" element={<IntroFlow />} />
              <Route path="/intro" element={<IntroFlow />} />
              <Route path="/demo" element={<DemoPage />} />
              
              {/* B2B SAAS PAGES */}
              <Route path="/pricing" element={<LayoutWrapper><PricingPage /></LayoutWrapper>} />
              <Route path="/about" element={<LayoutWrapper><AboutPage /></LayoutWrapper>} />
              <Route path="/contact" element={<LayoutWrapper><ContactPage /></LayoutWrapper>} />
              <Route path="/privacy" element={<LayoutWrapper><PrivacyPage /></LayoutWrapper>} />

              {/* AUTHENTICATION AXIS */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* CORE DOMAINS - Role Specific Dashboards */}
              <Route path="/home" element={
                <LayoutWrapper><ErrorBoundary><LandingPage /></ErrorBoundary></LayoutWrapper>
              } />

              <Route path="/villager" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><ErrorBoundary><VillagerDashboard /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              {/* FEATURE PAGES (STANDALONE) */}
              <Route path="/symptoms" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><ErrorBoundary><SymptomCheckerPage /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/skin-disease" element={
                <ProtectedRoute allowedRole={["villager", "ngo"]}>
                   <LayoutWrapper><ErrorBoundary><SkinDiseaseCheckerPage /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/ambulance" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><ErrorBoundary><AmbulancePage /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                   <LayoutWrapper><ErrorBoundary><UserProfile /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/menstrual-health" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><ErrorBoundary><MenstrualHealth /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/schemes" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><ErrorBoundary><GovernmentSchemesPage /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/schemes/:id" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><ErrorBoundary><SchemeDetailPage /></ErrorBoundary></LayoutWrapper>
                </ProtectedRoute>
              } />

              {/* NGO/ADMIN DOMAINS */}
              {/* ASHA Field Worker Dashboard – pixel-accurate mobile UI */}
              <Route path="/asha" element={
                <ProtectedRoute allowedRole={["ngo", "admin"]}>
                   <ErrorBoundary><ASHADashboard /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ngo" element={
                <ProtectedRoute allowedRole="ngo">
                   <ErrorBoundary><NGODashboard /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ngo/maternal" element={
                <ProtectedRoute allowedRole="ngo">
                   <ErrorBoundary><MaternalHealthPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ngo/alerts" element={
                <ProtectedRoute allowedRole="ngo">
                   <ErrorBoundary><NGOAlertsPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ngo/patients" element={
                <ProtectedRoute allowedRole="ngo">
                   <ErrorBoundary><NGOPatientRegistryPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ngo/records" element={
                <ProtectedRoute allowedRole="ngo">
                   <ErrorBoundary><NGORecordCreationPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/ngo/child-nutrition" element={
                <ProtectedRoute allowedRole="ngo">
                   <ErrorBoundary><ChildNutritionPage /></ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin">
                  <DesktopOnlyWrapper dashboardName="Admin Command Center">
                    <ErrorBoundary><AdminDashboard /></ErrorBoundary>
                  </DesktopOnlyWrapper>
                </ProtectedRoute>
              } />
              <Route path="/monitor" element={
                <ProtectedRoute allowedRole={["admin", "ngo", "villager"]}>
                  <DesktopOnlyWrapper dashboardName="District Simulation & Observability Monitor">
                    <LayoutWrapper><ErrorBoundary><MonitoringDashboard /></ErrorBoundary></LayoutWrapper>
                  </DesktopOnlyWrapper>
                </ProtectedRoute>
              } />
              <Route path="/verify" element={
                <ProtectedRoute allowedRole={["admin"]}>
                  <ErrorBoundary>
                    <SystemVerificationPage />
                  </ErrorBoundary>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFoundRedirect />} />
            </Routes>
            </ErrorBoundary>
            </Suspense>
            {/* YouTube-style offline toast — appears on every page when data cuts */}
            <OfflineToast />
          </div>
        </Router>
        </ConsentGate>
      </AuthProvider>
    </LanguageProvider>
  );
}
