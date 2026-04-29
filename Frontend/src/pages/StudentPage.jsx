import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import QuizInterface from '../components/QuizInterface';
import { GraduationCap, LogOut } from 'lucide-react';

function StudentPage() {
  const [studentId, setStudentId] = useState(() => localStorage.getItem('studentId') || '');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('studentName') || '');
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState('choice');
  const [lookupName, setLookupName] = useState('');
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (studentId && studentName) {
      setShowQuiz(true);
    }
  }, []);

  const handleCreateStudent = async () => {
    if (!studentName.trim()) return;
    setLoading(true);
    try {
      const email = `${studentName.toLowerCase().replace(/\s/g, '')}@student.com`;
      const response = await api.createStudent(studentName, email);
      const newStudentId = response.data.id;
      setStudentId(newStudentId);
      localStorage.setItem('studentId', newStudentId);
      localStorage.setItem('studentName', studentName);
      setShowQuiz(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create student.');
      setLoading(false);
    }
  };

  const handleLookupStudent = async () => {
    if (!lookupName.trim()) return;
    setLookupLoading(true);
    setLookupResults([]);
    try {
      const response = await api.lookupStudent(lookupName);
      if (response.data?.length > 0) {
        setLookupResults(response.data);
      } else {
        alert('No students found.');
      }
    } catch (err) {
      alert('Student not found.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setStudentId(student.id);
    setStudentName(student.name);
    localStorage.setItem('studentId', student.id);
    localStorage.setItem('studentName', student.name);
    setShowQuiz(true);
  };

  const handleLogout = () => {
    setStudentId('');
    setStudentName('');
    setShowQuiz(false);
    setLoginMode('choice');
    localStorage.removeItem('studentId');
    localStorage.removeItem('studentName');
  };

  if (showQuiz && studentId) {
    return (
      <div className="py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-gray-900">{studentName}</div>
              <div className="text-sm text-gray-500">ID: {studentId}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline flex items-center">
            <LogOut className="h-4 w-4 mr-1" />Logout
          </button>
        </div>
        <QuizInterface studentId={parseInt(studentId)} onAnswerSubmit={() => {}} />
      </div>
    );
  }

  if (loginMode === 'choice') {
    return (
      <div className="py-12">
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-xl p-6 sm:p-8">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-center mb-6">Welcome Student!</h1>
            <div className="space-y-3">
              <button onClick={() => setLoginMode('new')} className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800">
                Create New Account
              </button>
              <button onClick={() => setLoginMode('existing')} className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50">
                Login Existing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-xl p-6 sm:p-8">
          <button 
            onClick={() => { setLoginMode('choice'); setStudentName(''); setLookupName(''); setLookupResults([]); }} 
            className="text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-center mb-6">
            {loginMode === 'new' ? 'Create Account' : 'Login'}
          </h1>
          
          {loginMode === 'new' ? (
            <>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 border border-gray-200 rounded-lg mb-4"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <button 
                onClick={handleCreateStudent} 
                disabled={loading || !studentName.trim()} 
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 border border-gray-200 rounded-lg mb-4"
                value={lookupName}
                onChange={(e) => setLookupName(e.target.value)}
              />
              <button 
                onClick={handleLookupStudent} 
                disabled={lookupLoading || !lookupName.trim()} 
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {lookupLoading ? 'Searching...' : 'Find My Account'}
              </button>
            </>
          )}
          
          {lookupResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {lookupResults.map((student, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleSelectStudent(student)} 
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.email}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentPage;