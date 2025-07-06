import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { TodoProvider } from './context/TodoContext';
import { ThemeProvider } from './context/ThemeContext';
import AnalyticsProvider from './context/AnalyticsContext';
import PrivateRoute from './components/common/PrivateRoute';
import ScrollToTop from './components/common/ScrollToTop';
import { useNotificationSetup } from './hooks/useNotificationSetup';

// Public pages
import Home from './pages/Home';
import About from './pages/About';
import Features from './pages/Features';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Feedback from './pages/Feedback';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import VerifyEmail from './pages/VerifyEmail';
import RestoreAccount from './pages/RestoreAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DebugVerification from './pages/DebugVerification';
import VerificationRecovery from './pages/VerificationRecovery';

// Dashboard pages
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/dashboard/DashboardHome';
import Todos from './pages/dashboard/Todos';
import DailyGoals from './pages/dashboard/DailyGoals';
import Social from './pages/dashboard/Social';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';

// NotificationSetup component to initialize notifications
const NotificationSetup = () => {
  useNotificationSetup();
  return null; // This component doesn't render anything
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AnalyticsProvider>
          <TodoProvider>
            <Router>
              <ScrollToTop />
              <div className="App">
                <NotificationSetup />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/features" element={<Features />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/restore-account" element={<RestoreAccount />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/debug-verification" element={<DebugVerification />} />
                  <Route path="/verification-recovery" element={<VerificationRecovery />} />

                  {/* Protected dashboard routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<DashboardHome />} />
                    <Route path="todos" element={<Todos />} />
                    <Route path="daily-goals" element={<DailyGoals />} />
                    <Route path="social" element={<Social />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* 404 route */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900">404</h1>
                          <p className="text-gray-600 mt-2">Page not found</p>
                        </div>
                      </div>
                    }
                  />
                </Routes>

                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      theme: {
                        primary: 'green',
                        secondary: 'black',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </TodoProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
