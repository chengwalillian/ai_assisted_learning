import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import TeacherPage from './pages/TeacherPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { api } from './api/client';

function App() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await api.health();
        setBackendStatus('online');
      } catch (error) {
        setBackendStatus('offline');
      }
    };
    checkBackend();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <Navigation />

        {backendStatus === 'offline' && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl text-sm text-red-700 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              Backend offline
            </div>
          </div>
        )}

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl">
          <Routes>
            <Route path="/" element={<HomePage backendStatus={backendStatus} />} />
            <Route path="/student" element={<StudentPage />} />
            <Route path="/teacher" element={<TeacherPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;