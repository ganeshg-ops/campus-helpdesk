import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, LogIn, AlertCircle, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin, switchDemoRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your administrator email and password.");
      return;
    }

    try {
      setLoading(true);
      setError('');
      await adminLogin(email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || "Admin login failed. Please verify your administrative credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (roleId) => {
    try {
      setLoading(true);
      setError('');
      await switchDemoRole(roleId);
      navigate('/admin/dashboard');
    } catch (err) {
      setError("Demo admin login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 group-hover:scale-105 transition">
            <Shield className="w-7 h-7" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Admin Portal Authentication
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Campus Helpdesk Administration • Deanery & Staff Operations Command
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Administrative Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@campus.edu"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition placeholder-slate-400"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "Authenticating Admin..." : "Sign In to Admin Portal"}
              </button>
            </div>
          </form>

          {/* Quick Demo Sign-in for Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Instant Evaluator Demo Sign-In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-950 text-[11px] font-semibold text-left transition"
              >
                <div className="font-bold truncate text-slate-900">Dean Office Admin</div>
                <div className="text-[9px] text-purple-700 truncate">Administrator Privileges</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staff')}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-950 text-[11px] font-semibold text-left transition"
              >
                <div className="font-bold truncate text-slate-900">Prof. David Miller</div>
                <div className="text-[9px] text-indigo-700 truncate">Student Affairs Staff</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
            Student seeking campus help?{" "}
            <Link to="/student/login" className="text-blue-600 font-bold hover:underline">
              Go to Student Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
