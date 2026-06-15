// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DistrictDashboard from './pages/DistrictDashboard';
import ASHAApp from './pages/ASHAApp';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/district" replace />} />
        <Route path="/district" element={<DistrictDashboard />} />
        <Route path="/asha" element={<ASHAApp />} />
      </Routes>
    </Router>
  );
};

export default App;
