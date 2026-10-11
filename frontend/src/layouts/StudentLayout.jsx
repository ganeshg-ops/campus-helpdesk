import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Ticket, User, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserSwitcher from '../components/UserSwitcher';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: 'Student Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'AI Chat Assistant', path: '/student/chat', icon: Bot },
    { name: 'My Support Tickets', path: '/student/tickets', icon: Ticket },
    { name: 'My Profile', path: '/student/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Student Portal Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            {/* Logo & Portal Identity */}
            <Link to="/student/dashboard" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-base tracking-tight text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                  <span>Campus Helpdesk</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Student
                  </span>
                </div>
                <div className="hidden sm:block text-[11px] text-slate-500 -mt-0.5 font-medium whitespace-nowrap">
                  Student Services & AI Assistant
                </div>
              </div>
            </Link>

            {/* Desktop Navigation (Visible on Large Screens) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <UserSwitcher />

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition shrink-0 whitespace-nowrap"
                title="Log out of Student Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Mobile & Small Screen Sub-Navigation Tab Bar (Always Visible on Small/Resized Screens) */}
        <div className="lg:hidden border-t border-slate-200/80 bg-slate-50/80 px-2 py-1.5 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1.5 min-w-max px-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 shadow-2xs ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                      : 'text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Student Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            Campus Helpdesk • Student Portal | Admin Block Room 102 | helpdesk@campus.edu
          </div>
          <div className="flex items-center gap-3">
            <span>Official Student Regulations</span>
            <span>•</span>
            <Link to="/student/chat" className="text-blue-600 hover:underline">AI Assistant</Link>
            <span>•</span>
            <Link to="/student/tickets" className="text-blue-600 hover:underline">My Tickets</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
