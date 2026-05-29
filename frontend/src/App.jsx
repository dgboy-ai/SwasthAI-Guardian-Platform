import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import DiSHAConsentModal, { useConsentGiven } from './components/DiSHAConsentModal';

// Pages — critical path (eager loaded for instant auth routing)
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import IntroFlow from './pages/IntroFlow';
import RegisterPage from './pages/RegisterPage';

// Pages — heavy, lazy-loaded for Vercel edge performance & 2G optimization
const VillagerDashboard  = lazy(() => import('./Villager/VillagerDashboard'));
const NGODashboard       = lazy(() => import('./NGO/NGODashboard'));
const AdminDashboard     = lazy(() => import('./Admin/AdminDashboard'));
const SymptomCheckerPage     = lazy(() => import('./pages/SymptomCheckerPage'));
const SkinDiseaseCheckerPage = lazy(() => import('./pages/SkinDiseaseCheckerPage'));
const AmbulancePage          = lazy(() => import('./pages/AmbulancePage'));
const UserProfile            = lazy(() => import('./pages/UserProfile'));
const MenstrualHealth        = lazy(() => import('./pages/MenstrualHealth'));
const MaternalHealthPage     = lazy(() => import('./pages/MaternalHealthPage'));
const ChildNutritionPage     = lazy(() => import('./pages/ChildNutritionPage'));
const GovernmentSchemesPage  = lazy(() => import('./pages/GovernmentSchemesPage'));
const GuidedHealthcareMode   = lazy(() => import('./pages/GuidedHealthcareMode'));
const MonitoringDashboard    = lazy(() => import('./pages/MonitoringDashboard'));

// Components
import Footer from './components/Footer';
import OfflineToast from './components/OfflineToast';

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
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return children;
};

// Shows DISHA consent modal once per device after first login
function ConsentGate({ children }) {
  const { user } = useAuth();
  const [consented, setConsented] = useState(useConsentGiven);
  const needsConsent = user && !consented;
  return (
    <>
      {children}
      <AnimatePresence>
        {needsConsent && (
          <DiSHAConsentModal onConsent={() => setConsented(true)} />
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
            <Routes>
              {/* MANDATORY INTRO FLOW SEQUENCE */}
              <Route path="/" element={<IntroFlow />} />
              <Route path="/intro" element={<IntroFlow />} />
              
              {/* AUTHENTICATION AXIS */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* CORE DOMAINS - Role Specific Dashboards */}
              <Route path="/home" element={
                <ProtectedRoute>
                  <LayoutWrapper><LandingPage /></LayoutWrapper>
                 </ProtectedRoute>
              } />

              <Route path="/villager" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><VillagerDashboard /></LayoutWrapper>
                </ProtectedRoute>
              } />

              {/* FEATURE PAGES (STANDALONE) */}
              <Route path="/symptoms" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><SymptomCheckerPage /></LayoutWrapper>
                </ProtectedRoute>
              } />
              
              <Route path="/skin-disease" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><SkinDiseaseCheckerPage /></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/ambulance" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><AmbulancePage /></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                   <LayoutWrapper><UserProfile /></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/menstrual-health" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><MenstrualHealth /></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/schemes" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><GovernmentSchemesPage /></LayoutWrapper>
                </ProtectedRoute>
              } />

              <Route path="/guided-mode" element={
                <ProtectedRoute allowedRole="villager">
                   <LayoutWrapper><GuidedHealthcareMode /></LayoutWrapper>
                </ProtectedRoute>
              } />

              {/* NGO/ADMIN DOMAINS */}
              <Route path="/ngo" element={
                <ProtectedRoute allowedRole="ngo">
                   <NGODashboard />
                </ProtectedRoute>
              } />
              <Route path="/ngo/maternal" element={
                <ProtectedRoute allowedRole="ngo">
                   <MaternalHealthPage />
                </ProtectedRoute>
              } />
              <Route path="/ngo/child-nutrition" element={
                <ProtectedRoute allowedRole="ngo">
                   <ChildNutritionPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin">
                   <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/monitoring" element={
                <ProtectedRoute allowedRole="admin">
                   <LayoutWrapper><MonitoringDashboard /></LayoutWrapper>
                </ProtectedRoute>
              } />
            </Routes>
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
