import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, Shield, ChevronDown, Check, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserSwitcher() {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const personas = [
    {
      id: 'student1',
      name: 'Priya Sharma',
      role: 'Student (CS)',
      email: 'priya.sharma@campus.edu',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'student2',
      name: 'Rahul Verma',
      role: 'Student (ME)',
      email: 'rahul.verma@campus.edu',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    },
    {
      id: 'staff',
      name: 'Prof. David Miller',
      role: 'Staff Member',
      email: 'david.miller@campus.edu',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      id: 'admin',
      name: 'Dean Office Admin',
      role: 'Administrator',
      email: 'admin@campus.edu',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200'
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-xs font-medium text-slate-700 shadow-sm shrink-0 whitespace-nowrap"
        title="Switch user persona to test student isolation or admin features"
      >
        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
          {user?.full_name ? user.full_name[0] : 'U'}
        </div>
        <div className="text-left hidden sm:block whitespace-nowrap leading-tight">
          <div className="font-semibold text-slate-900 leading-tight text-xs">{user?.full_name || 'Loading...'}</div>
          <div className="text-[10px] text-slate-500 leading-tight">{user?.student_id || user?.role || 'Guest'}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Demo Persona Switcher
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Switch users to test privacy protection and role permissions.
              </p>
            </div>

            <div className="space-y-1">
              {personas.map((p) => {
                const isActive = user?.email === p.email;
                return (
                  <button
                    key={p.id}
                    onClick={async () => {
                      setOpen(false);
                      await switchDemoRole(p.id);
                      if ((p.id === 'staff' || p.id === 'admin') && location.pathname.startsWith('/student')) {
                        navigate('/admin/dashboard');
                      } else if ((p.id === 'student1' || p.id === 'student2') && location.pathname.startsWith('/admin')) {
                        navigate('/student/dashboard');
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                      isActive ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {p.name}
                        {isActive && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500">{p.email}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${p.badgeColor}`}>
                      {p.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
