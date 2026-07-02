import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';

// Layout
import Navbar from './components/common/Navbar';
import Loader from './components/common/Loader';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AssessmentDetailPage from './pages/AssessmentDetailPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface dark:bg-slate-950 px-4 text-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 shadow-card max-w-md w-full border border-border-light dark:border-slate-800">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-3">Something went wrong</h1>
            <p className="text-text-secondary dark:text-slate-300 mb-6 text-sm">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="bg-primary text-white font-semibold rounded-lg px-6 py-3 hover:bg-primary-hover transition-all"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Route guards
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Loader fullScreen />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col font-sans bg-surface dark:bg-slate-950 text-text-primary dark:text-slate-100">
              <Navbar />
              <main className="flex-grow">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<HomePage />} />

                    <Route path="/login" element={
                      <PublicRoute><LoginPage /></PublicRoute>
                    } />
                    <Route path="/register" element={
                      <PublicRoute><RegisterPage /></PublicRoute>
                    } />

                    {/* Protected */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute><DashboardPage /></ProtectedRoute>
                    } />
                    <Route path="/assessment/:id" element={
                      <ProtectedRoute><AssessmentDetailPage /></ProtectedRoute>
                    } />
                    <Route path="/history" element={
                      <ProtectedRoute><HistoryPage /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute><ProfilePage /></ProtectedRoute>
                    } />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
