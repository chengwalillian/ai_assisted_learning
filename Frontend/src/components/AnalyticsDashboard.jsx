import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Target, Users, BookOpen, Clock,
  AlertCircle, RefreshCw, Award
} from 'lucide-react';
import { api } from '../api/client';

const COLORS = {
  easy: '#10B981',
  medium: '#F59E0B', 
  hard: '#EF4444'
};

function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [classSummary, setClassSummary] = useState(null);
  const [topicBreakdown, setTopicBreakdown] = useState([]);
  const [strugglingStudents, setStrugglingStudents] = useState([]);
  const [hardestTopics, setHardestTopics] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summary, topics, struggling, hardest] = await Promise.all([
        api.getClassSummary(),
        api.getTopicBreakdown(),
        api.getStrugglingStudents(0.6),
        api.getHardestTopics(1)
      ]);

      setClassSummary(summary.data);
      setTopicBreakdown(topics.data || []);
      setStrugglingStudents(struggling.data || []);
      setHardestTopics(hardest.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatItem = ({ icon: Icon, label, value, color }) => (
    <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
      <div className={`p-2 rounded-lg bg-${color}-50`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const difficultyData = [
    { name: 'Easy', value: topicBreakdown.filter(t => t.success_rate >= 70).length, color: COLORS.easy },
    { name: 'Medium', value: topicBreakdown.filter(t => t.success_rate >= 40 && t.success_rate < 70).length, color: COLORS.medium },
    { name: 'Hard', value: topicBreakdown.filter(t => t.success_rate < 40).length, color: COLORS.hard }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Performance insights</p>
        </div>
        <button
          onClick={loadData}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 self-start"
        >
          <RefreshCw className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem 
          icon={Target} 
          label="Avg Accuracy" 
          value={`${parseFloat(classSummary?.class_average || 0).toFixed(1)}%`}
          color="blue"
        />
        <StatItem 
          icon={Users} 
          label="Students" 
          value={classSummary?.total_students || 0}
          color="green"
        />
        <StatItem 
          icon={BookOpen} 
          label="Questions" 
          value={classSummary?.total_questions || 0}
          color="purple"
        />
        <StatItem 
          icon={Clock} 
          label="Avg Time" 
          value={`${parseFloat(classSummary?.average_time_seconds || 0).toFixed(1)}s`}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Topic Performance</h2>
          </div>
          {topicBreakdown.length > 0 ? (
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">Topic</th>
                    <th className="px-4 py-2 font-medium">Rate</th>
                    <th className="px-4 py-2 font-medium">Attempts</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topicBreakdown.map((topic, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{topic.topic}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getScoreBg(topic.success_rate)} ${getScoreColor(topic.success_rate)}`}>
                          {parseFloat(topic.success_rate).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{topic.total_attempts}</td>
                      <td className="px-4 py-2 text-gray-600">{parseFloat(topic.average_time_seconds).toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">No topic data yet</div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Difficulty Pie */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Topic Difficulty</h3>
            {difficultyData.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {difficultyData.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-gray-600">{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hardest Topics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Challenging Topics</h3>
            {hardestTopics.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hardestTopics.slice(0, 5)} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="topic" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="average_score" fill={COLORS.hard} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
            )}
          </div>

          {/* Struggling Students */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900">Need Support</h3>
            </div>
            {strugglingStudents.length > 0 ? (
              <div className="max-h-48 overflow-y-auto">
                {strugglingStudents.map((student, idx) => (
                  <div key={idx} className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <div>
                      <div className="font-medium text-gray-900">{student.student_name}</div>
                      <div className="text-xs text-gray-500">{student.total_attempts} attempts</div>
                    </div>
                    <span className="font-medium text-red-600">{parseFloat(student.average_score).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">All doing well!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;