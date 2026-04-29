import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, BarChart, ArrowRight } from 'lucide-react';

function HomePage({ backendStatus }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col justify-center">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Adaptive Learning
          </h1>
          
          <p className="text-lg text-gray-500 mb-10">
            Personalized quizzes with real-time AI feedback. Track your progress as you learn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/student" 
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white text-base font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/teacher" 
              className="inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              For Teachers
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom quick links */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-100">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-2">
          <Link to="/student" className="text-center p-4 rounded-lg hover:bg-gray-100 transition-colors">
            <GraduationCap className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <div className="text-sm font-medium text-gray-900">Learn</div>
          </Link>
          
          <Link to="/teacher" className="text-center p-4 rounded-lg hover:bg-gray-100 transition-colors">
            <Users className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <div className="text-sm font-medium text-gray-900">Teacher</div>
          </Link>
          
          <Link to="/analytics" className="text-center p-4 rounded-lg hover:bg-gray-100 transition-colors">
            <BarChart className="h-6 w-6 mx-auto text-gray-400 mb-1" />
            <div className="text-sm font-medium text-gray-900">Analytics</div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;