import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../api/client';
import { TrendingUp, Target } from 'lucide-react';

function PerformanceChart({ studentId }) {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformance = async () => {
      try {
        const response = await api.getStudentPerformance(studentId);
        setPerformance(response.data);
      } catch (err) {
        console.error('Failed to load performance:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadPerformance();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!performance || !performance.topic_performances?.length) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Complete some quizzes to see your performance charts!</p>
        </div>
      </div>
    );
  }

  const chartData = performance.topic_performances.map(tp => ({
    topic: tp.topic.length > 15 ? tp.topic.substring(0, 12) + '...' : tp.topic,
    score: parseFloat(tp.average_score),
    attempts: tp.total_attempts
  }));

  const pieData = [
    { name: 'Correct', value: parseFloat(performance.overall_average) },
    { name: 'Incorrect', value: 100 - parseFloat(performance.overall_average) }
  ];

  const COLORS = ['#3B82F6', '#EF4444'];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
        Performance Analytics
      </h3>

      {/* Bar Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Topic Performance</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} fontSize={12} />
            <YAxis label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Overall Performance</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {parseFloat(performance.overall_average).toFixed(2)}%
          </div>
          <div className="text-xs text-gray-600">Overall Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {performance.total_questions || 0}
          </div>
          <div className="text-xs text-gray-600">Questions Answered</div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceChart;