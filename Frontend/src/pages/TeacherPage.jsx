import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw, Search, X, ChevronDown, ChevronUp, CheckCircle, XCircle, Lightbulb
} from 'lucide-react';
import { api } from '../api/client';

function TeacherPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'average_score', direction: 'ascending' });
  const [showAllStudents, setShowAllStudents] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, allStudentsData] = await Promise.all([
        api.getClassSummary(),
        api.getAllStudents()
      ]);
      
      const studentsList = (allStudentsData?.data || allStudentsData || []);
      
      const studentsWithDetails = await Promise.all(
        studentsList.map(async (s) => {
          try {
            const detail = await api.getStudentPerformance(s.student_id);
            return { ...s, details: detail.data };
          } catch (e) {
            return s;
          }
        })
      );
      
      setStudents(studentsWithDetails);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
    try {
      const [detail, history] = await Promise.all([
        api.getStudentPerformance(student.student_id),
        api.getQuizHistory(student.student_id)
      ]);
      setStudentDetail({
        ...detail.data,
        quiz_history: history.data || []
      });
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedStudent(null);
    setStudentDetail(null);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (sortConfig.key === 'student_name') {
      return sortConfig.direction === 'ascending' 
        ? a.student_name.localeCompare(b.student_name)
        : b.student_name.localeCompare(a.student_name);
    }
    if (sortConfig.key === 'average_score') {
      return sortConfig.direction === 'ascending' 
        ? a.average_score - b.average_score
        : b.average_score - a.average_score;
    }
    return 0;
  });

  const filteredStudents = sortedStudents.filter(s => 
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (showAllStudents || s.average_score < 60)
  );

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatus = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Average';
    return 'At Risk';
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />;
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-3 w-3 ml-1 text-blue-600" />
      : <ChevronDown className="h-3 w-3 ml-1 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="mx-auto px-3 sm:px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500">{filteredStudents.length} students</p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
              />
            </div>
            <button onClick={loadData} className="p-1.5 bg-white border border-gray-200 rounded-lg">
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
            <Link to="/analytics" className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg">
              Analytics
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setShowAllStudents(false)}
                className={`px-2 py-1 text-xs rounded ${!showAllStudents ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                At Risk
              </button>
              <button
                onClick={() => setShowAllStudents(true)}
                className={`px-2 py-1 text-xs rounded ${showAllStudents ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-3 py-2 font-medium cursor-pointer" onClick={() => requestSort('student_name')}>
                    <span className="flex items-center">Student <SortIcon column="student_name" /></span>
                  </th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium cursor-pointer" onClick={() => requestSort('average_score')}>
                    <span className="flex items-center">Score <SortIcon column="average_score" /></span>
                  </th>
                  <th className="px-3 py-2 font-medium">Topics</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 cursor-pointer" onClick={() => openStudentModal(student)}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-medium">
                          {student.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-900 font-medium text-xs">{student.student_name}</div>
                          <div className="text-gray-400 text-xs">ID: {student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getScoreColor(student.average_score)}`}>
                        {getStatus(student.average_score)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`font-medium ${student.average_score >= 80 ? 'text-green-600' : student.average_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {parseFloat(student.average_score).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {student.details?.topic_performances?.slice(0, 2).map((t, i) => (
                          <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${t.average_score < 60 ? 'bg-red-50 text-red-600' : 'bg-gray-100'}`}>
                            {t.topic?.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <button 
                        className="text-xs text-blue-600 hover:underline"
                        onClick={(e) => { e.stopPropagation(); openStudentModal(student); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedStudent && studentDetail && (
        <StudentDetailModal 
          student={selectedStudent} 
          detail={studentDetail}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function StudentDetailModal({ student, detail, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [openAccordion, setOpenAccordion] = useState(null);

  const topics = detail?.quiz_history?.reduce((acc, q) => {
    const topic = q.topic || 'General';
    if (!acc.find(t => t.name === topic)) {
      const topicPerf = detail?.topic_performances?.find(tp => tp.topic === topic);
      acc.push({ 
        name: topic, 
        score: topicPerf?.average_score || 0,
        attempts: topicPerf?.total_attempts || 0
      });
    }
    return acc;
  }, []) || [];

  const topicQuizzes = selectedTopic 
    ? detail?.quiz_history?.filter(q => (q.topic || 'General') === selectedTopic) || []
    : detail?.quiz_history || [];

  const toggleAccordion = (idx) => {
    setOpenAccordion(openAccordion === idx ? null : idx);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'topics', label: 'Topics' },
    { id: 'history', label: 'Quiz History' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white font-medium">
              {student.student_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{student.student_name}</h2>
              <p className="text-xs text-gray-500">{detail?.total_questions || 0} questions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex gap-1 px-2 overflow-x-auto shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedTopic(null); }}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <OverviewTab detail={detail} />
          )}
          {activeTab === 'topics' && (
            <TopicsTab 
              topics={topics} 
              selectedTopic={selectedTopic}
              onSelectTopic={setSelectedTopic}
            />
          )}
          {activeTab === 'history' && (
            <QuizHistoryTab 
              quizzes={topicQuizzes} 
              selectedTopic={selectedTopic}
              topics={topics}
              onSelectTopic={setSelectedTopic}
              openAccordion={openAccordion}
              onToggleAccordion={toggleAccordion}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ detail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xl font-bold text-blue-600">{parseFloat(detail.overall_average).toFixed(1)}%</div>
          <div className="text-xs text-blue-700">Accuracy</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-900">{detail.total_questions || 0}</div>
          <div className="text-xs text-gray-600">Questions</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xl font-bold text-gray-900">{parseFloat(detail.average_time_seconds || 0).toFixed(1)}s</div>
          <div className="text-xs text-gray-600">Avg Time</div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-gray-900 mb-2">Topic Performance</h3>
        {detail.topic_performances?.length > 0 ? (
          <div className="space-y-2">
            {detail.topic_performances.map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-900 truncate flex-1">{topic.topic}</span>
                <span className={`text-sm font-medium ml-2 ${topic.average_score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(topic.average_score).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No data yet</p>
        )}
      </div>
    </div>
  );
}

function TopicsTab({ topics, selectedTopic, onSelectTopic }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-gray-900">Topics ({topics.length})</h3>
      {topics.length > 0 ? (
        <div className="grid gap-2">
          {topics.map((topic, idx) => (
            <div 
              key={idx} 
              className={`p-3 rounded-lg border cursor-pointer ${
                selectedTopic === topic.name 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelectTopic(topic.name)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                <span className={`text-sm font-medium ${
                  topic.score >= 80 ? 'text-green-600' : topic.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {parseFloat(topic.score).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No topics yet</p>
      )}
    </div>
  );
}

function QuizHistoryTab({ quizzes, selectedTopic, topics, onSelectTopic, openAccordion, onToggleAccordion }) {
  return (
    <div className="space-y-3">
      {topics.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => onSelectTopic(null)}
            className={`px-2 py-1 text-xs rounded ${
              !selectedTopic 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({quizzes.length})
          </button>
          {topics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => onSelectTopic(topic.name)}
              className={`px-2 py-1 text-xs rounded ${
                selectedTopic === topic.name 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {topic.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {quizzes.length > 0 ? (
          quizzes.slice(0, 20).map((quiz, idx) => (
            <div 
              key={idx} 
              className={`rounded-lg border overflow-hidden ${
                quiz.is_correct ? 'border-green-200' : 'border-red-200'
              }`}
            >
              <button
                onClick={() => onToggleAccordion(idx)}
                className={`w-full p-3 flex items-center justify-between text-left ${
                  quiz.is_correct ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{quiz.question}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{quiz.topic}</span>
                    <span className={`px-1 py-0.5 rounded text-[10px] uppercase font-medium ${
                      quiz.difficulty === 'easy' ? 'bg-green-200 text-green-800' :
                      quiz.difficulty === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-200 text-red-800'
                    }`}>{quiz.difficulty || 'medium'}</span>
                  </div>
                </div>
                {openAccordion === idx ? (
                  <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </button>

              {openAccordion === idx && (
                <div className="px-3 pb-3 space-y-2 bg-white">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="font-medium">{quiz.topic}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${
                      quiz.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{quiz.difficulty || 'medium'}</span>
                  </div>
                  
                  <div>
                    <div className="text-xs font-medium text-gray-600">Your Answer</div>
                    <div className={`text-sm p-2 rounded ${
                      quiz.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {quiz.student_answer}
                    </div>
                  </div>

                  {!quiz.is_correct && (
                    <div>
                      <div className="text-xs font-medium text-green-700">Correct Answer</div>
                      <div className="text-sm p-2 rounded bg-green-50 text-green-800">
                        {quiz.correct_answer}
                      </div>
                    </div>
                  )}

                  {quiz.ai_feedback && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />AI
                      </div>
                      <div className="text-xs p-2 rounded bg-blue-50 text-gray-700">
                        {quiz.ai_feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No quiz history</p>
        )}
      </div>
    </div>
  );
}

export default TeacherPage;