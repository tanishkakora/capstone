import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './layouts/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Skeletons for Dashboards and Tools (to be fleshed out in subsequent phases)
import CitizenDashboard from './pages/CitizenDashboard';
import ReportComplaint from './pages/ReportComplaint';
import ComplaintDetails from './pages/ComplaintDetails';
import MunicipalDashboard from './pages/MunicipalDashboard';
import RoutePlanner from './pages/RoutePlanner';
import Analytics from './pages/Analytics';
import RecyclingAssistant from './pages/RecyclingAssistant';

// Route Guard for Citizens
const CitizenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading system configuration...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'citizen') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Route Guard for Municipal Officers
const OfficerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading system configuration...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'officer') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Common Protected Route (for any logged in user)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading system...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Citizen Dashboard & Tool Access */}
              <Route
                path="/citizen-dashboard"
                element={
                  <CitizenRoute>
                    <CitizenDashboard />
                  </CitizenRoute>
                }
              />
              <Route
                path="/report-complaint"
                element={
                  <CitizenRoute>
                    <ReportComplaint />
                  </CitizenRoute>
                }
              />
              <Route
                path="/complaints/:id"
                element={
                  <ProtectedRoute>
                    <ComplaintDetails />
                  </ProtectedRoute>
                }
              />

              {/* Municipal Dashboard & Officer Tools */}
              <Route
                path="/officer-dashboard"
                element={
                  <OfficerRoute>
                    <MunicipalDashboard />
                  </OfficerRoute>
                }
              />
              <Route
                path="/route-planner"
                element={
                  <OfficerRoute>
                    <RoutePlanner />
                  </OfficerRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <OfficerRoute>
                    <Analytics />
                  </OfficerRoute>
                }
              />

              {/* General Protected Tools */}
              <Route
                path="/recycling-assistant"
                element={
                  <ProtectedRoute>
                    <RecyclingAssistant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
