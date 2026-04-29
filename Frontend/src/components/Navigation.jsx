import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Users, BarChart, Home } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/student', icon: GraduationCap, label: 'Learn' },
    { path: '/teacher', icon: Users, label: 'Teacher' },
    { path: '/analytics', icon: BarChart, label: 'Stats' },
  ];

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="mx-auto px-6 lg:px-8 w-full max-w-6xl">
          <div className="flex justify-between h-14">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="ml-2 text-base font-semibold text-gray-900">AdaptiveLearn</span>
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="flex justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 ${
                  isActive ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navigation;