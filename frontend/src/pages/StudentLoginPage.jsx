import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, LogIn, AlertCircle, ArrowRight, Shield, User, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const { studentLogin, switchDemoRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your student email and password.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      await studentLogin(email.trim(), password);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || "Login failed. Please check your student credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (roleId) => {
    try {
      setLoading(true);
      setError('');
      if (roleId === 'manoj') {
        setEmail('manoj@campus.edu');
        setPassword('manoj123');
        await studentLogin('manoj@campus.edu', 'manoj123');
        navigate('/student/dashboard');
        return;
      }
      if (roleId === 'student1' || roleId === 'priya') {
        setEmail('priya.sharma@campus.edu');
        setPassword('campus123');
        await studentLogin('priya.sharma@campus.edu', 'campus123');
        navigate('/student/dashboard');
        return;
      }
      if (roleId === 'student2' || roleId === 'rahul') {
        setEmail('rahul.verma@campus.edu');
        setPassword('campus123');
        await studentLogin('rahul.verma@campus.edu', 'campus123');
        navigate('/student/dashboard');
        return;
      }
      await switchDemoRole(roleId);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
            <Bot className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Student Portal Login
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Campus Helpdesk & Student Services • Secure Academic Gateway
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student University Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya.sharma@campus.edu"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Signing In..." : "Sign In to Student Portal"}
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Instant Evaluator Demo Sign-In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student1')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 text-[11px] font-semibold text-left transition"
              >
                <div className="font-bold truncate">Priya Sharma</div>
                <div className="text-[9px] text-blue-600 truncate font-mono">priya.sharma@campus.edu</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">Password: campus123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student2')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-[11px] font-semibold text-left transition"
              >
                <div className="font-bold truncate">Rahul Verma</div>
                <div className="text-[9px] text-emerald-600 truncate font-mono">rahul.verma@campus.edu</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">Password: campus123</div>
              </button>
            </div>
          </div>

          {/* Access Control Notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Admin-Controlled Student Access</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Student accounts are provisioned and controlled exclusively by College Administration. Only IDs stored and active in the system database can log in.
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              Staff or Administrator?{" "}
              <Link to="/admin/login" className="text-purple-600 font-bold hover:underline">
                Go to Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
