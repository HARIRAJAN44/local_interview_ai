import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ProfilePage } from './pages/ProfilePage';
import { ResumePage } from './pages/ResumePage';
import { JobDescriptionPage } from './pages/JobDescriptionPage';
import { InterviewConfigPage } from './pages/InterviewConfigPage';
import { AptitudePage } from './pages/AptitudePage';
import { CodingPage } from './pages/CodingPage';
import { CommunicationPage } from './pages/CommunicationPage';
import { HRPage } from './pages/HRPage';
import { ReportPage } from './pages/ReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <div className="p-4 lg:p-8">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/resume" element={<ResumePage />} />
                    <Route path="/job-description" element={<JobDescriptionPage />} />
                    <Route path="/interview/config" element={<InterviewConfigPage />} />
                    <Route path="/interview/aptitude/:sessionId" element={<AptitudePage />} />
                    <Route path="/interview/coding/:sessionId" element={<CodingPage />} />
                    <Route path="/interview/communication/:sessionId" element={<CommunicationPage />} />
                    <Route path="/interview/hr/:sessionId" element={<HRPage />} />
                    <Route path="/report/:sessionId" element={<ReportPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </div>
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('user@local');
  const [password, setPassword] = React.useState('localpassword');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('Login attempt started', { email, password });
    try {
      await login(email, password);
      console.log('Login successful');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">AI Mock Interview Studio</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input id="email" name="email" type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="label">Password</label>
            <input id="password" name="password" type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}