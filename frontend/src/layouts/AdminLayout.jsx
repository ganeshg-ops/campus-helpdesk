import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, BookOpen, Users, ShieldCheck, LogOut,
  Shield, Menu, X, CheckCircle2, ChevronRight, Sparkles, Terminal, Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DemoBanner from '../components/DemoBanner';
import UserSwitcher from '../components/UserSwitcher';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Student Messages', path: '/admin/messages', icon: Mail },
    { name: 'Knowledge & PDFs', path: '/admin/knowledge-base', icon: BookOpen },
    { name: 'Ticket Management', path: '/admin/tickets', icon: Ticket },
    { name: 'Student Directory', path: '/admin/students', icon: Users },
    { name: 'Evaluation & Audit', path: '/admin/evaluation', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <DemoBanner />

      {/* Admin Portal Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Portal Identity */}
            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20 group-hover:scale-105 transition shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="shrink-0">
                <div className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 flex items-center gap-2 whitespace-nowrap">
                  Campus Helpdesk
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                    Admin Portal
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 -mt-0.5 font-medium whitespace-nowrap">Administration & Command Center</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 font-bold border border-purple-200/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info & Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <UserSwitcher />

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition shrink-0 whitespace-nowrap"
                title="Log out of Admin Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 shrink-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-purple-50 text-purple-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 bg-slate-50 text-slate-900">
        <Outlet />
      </main>

      {/* Admin Portal Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            Campus Helpdesk • Administrative Operations Center | Deanery & Student Services
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              RAG & Guardrail Status: Active
            </span>
            <span>•</span>
            <Link to="/admin/evaluation" className="text-purple-600 hover:underline">System Audit</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
