import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = 'student' }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Verifying session permissions...</span>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (requiredRole === 'admin') {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/student/login" state={{ from: location }} replace />;
  }

  // Role authorization
  if (requiredRole === 'admin' && user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">403 Forbidden: Administrator Access Required</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your account (<strong>{user?.email}</strong>) is assigned the <strong>Student</strong> role. You do not have permissions to access the Admin Portal.
        </p>
        <div className="pt-2">
          <a
            href="/student/dashboard"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Return to Student Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (requiredRole === 'student' && (user?.role === 'admin' || user?.role === 'staff')) {
    // Staff/Admin trying to access student portal -> redirect to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
