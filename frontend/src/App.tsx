import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import ForgotPassword from './features/auth/ForgotPassword';
import ResetPassword from './features/auth/ResetPassword';

// Dashboard landing layout placeholder for testing protected session states
const DashboardPlaceholder = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="glass-panel p-8 rounded-2xl w-full max-w-md text-center shadow-glass">
        <h1 className="text-3xl font-bold text-gradient mb-2">Jarvis AI</h1>
        <h2 className="text-xl font-medium text-slate-300 mb-6">English Coach Dashboard</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Successfully authenticated. Complete voice coach interfaces will appear here!
        </p>
        <button onClick={clearAuth} className="glass-button w-full">
          Sign Out
        </button>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
