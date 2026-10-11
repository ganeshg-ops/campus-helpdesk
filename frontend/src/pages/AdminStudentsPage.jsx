import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Shield, CheckCircle, XCircle, Ticket, Building2, Phone, Mail, 
  RefreshCw, UserPlus, KeyRound, Trash2, X, AlertCircle, ShieldAlert, Check
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, suspended
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    student_id: '',
    department: 'Computer Science & Engineering',
    phone: '',
    password: '',
    is_active: true
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Password Reset Modal State
  const [resetModalStudent, setResetModalStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error("Failed to load students:", err);
      showToast("Failed to load students: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = !student.is_active;
    const actionWord = newStatus ? "activate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${actionWord} student account ${student.full_name} (${student.email})?`)) {
      return;
    }

    try {
      setUpdatingId(student.id);
      await api.updateStudentStatus(student.id, { is_active: newStatus });
      setStudents(students.map(s => s.id === student.id ? { ...s, is_active: newStatus } : s));
      showToast(`Student ${student.full_name} ${newStatus ? 'activated (can log in)' : 'suspended (login blocked)'}!`);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Are you sure you want to completely delete ${student.full_name} (${student.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      setUpdatingId(student.id);
      await api.deleteStudent(student.id);
      setStudents(students.filter(s => s.id !== student.id));
      showToast(`Student ${student.full_name} deleted successfully!`);
    } catch (err) {
      alert("Failed to delete student: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddError("Full Name, Email, and Password are required.");
      return;
    }

    try {
      setAddSubmitting(true);
      setAddError('');
      const created = await api.createStudent({
        full_name: addForm.full_name.trim(),
        email: addForm.email.trim().toLowerCase(),
        student_id: addForm.student_id.trim() || null,
        department: addForm.department.trim(),
        phone: addForm.phone.trim() || null,
        password: addForm.password.trim(),
        is_active: addForm.is_active
      });

      setStudents([created, ...students]);
      setIsAddModalOpen(false);
      setAddForm({
        full_name: '',
        email: '',
        student_id: '',
        department: 'Computer Science & Engineering',
        phone: '',
        password: '',
        is_active: true
      });
      showToast(`Student ${created.full_name} created successfully! They can now log in.`);
    } catch (err) {
      setAddError(err.message || "Failed to create student.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setResetError("New password must be at least 4 characters.");
      return;
    }

    try {
      setResetSubmitting(true);
      setResetError('');
      await api.resetStudentPassword(resetModalStudent.id, newPassword.trim());
      showToast(`Password updated successfully for ${resetModalStudent.full_name}!`);
      setResetModalStudent(null);
      setNewPassword('');
    } catch (err) {
      if (err.message && (err.message.includes("Not Found") || err.status === 404)) {
        setResetError("Backend update pending on Render: Please click 'Manual Deploy -> Deploy latest commit' on your Render dashboard tab to enable password resets.");
      } else {
        setResetError(err.message || "Failed to reset password.");
      }
    } finally {
      setResetSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student_id && s.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return s.is_active;
    if (statusFilter === 'suspended') return !s.is_active;
    return true;
  });

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.is_active).length;
  const suspendedStudents = students.filter(s => !s.is_active).length;
  const totalTickets = students.reduce((acc, s) => acc + (s.ticket_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-lg transition animate-in fade-in ${
          notification.type === 'error'
            ? 'bg-rose-950/80 border-rose-800 text-rose-200'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Student Account Directory & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Admin controls which students are permitted to log into the Student Portal. Provision new accounts, toggle login status, reset passwords, or remove accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setAddError(''); setIsAddModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            Add Authorized Student
          </button>

          <button
            onClick={loadStudents}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Total Registered</div>
          <div className="text-xl font-extrabold text-white mt-1">{totalStudents}</div>
          <div className="text-[10px] text-purple-400 mt-1">Managed student profiles</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-emerald-400 font-medium">Active (Can Log In)</div>
          <div className="text-xl font-extrabold text-emerald-300 mt-1">{activeStudents}</div>
          <div className="text-[10px] text-emerald-500 mt-1">Authorized login access</div>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-rose-400 font-medium">Suspended (Blocked)</div>
          <div className="text-xl font-extrabold text-rose-300 mt-1">{suspendedStudents}</div>
          <div className="text-[10px] text-rose-500 mt-1">Login rejected at portal</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="text-[11px] text-slate-400 font-medium">Total Tickets Raised</div>
          <div className="text-xl font-extrabold text-purple-300 mt-1">{totalTickets}</div>
          <div className="text-[10px] text-slate-500 mt-1">Across all student records</div>
        </div>
      </div>

      {/* Access Control Notice */}
      <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-start gap-2.5 text-xs text-purple-200">
        <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Strict Administrator Login Control Active: </span>
          Only student accounts created or stored here can log in. Suspending an account immediately blocks student login with an authorization warning.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll ID (e.g. CS-2024-055), email (e.g. manoj@campus.edu), or department..."
            className="w-full text-xs bg-transparent text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Accounts ({totalStudents})</option>
            <option value="active">Active Only ({activeStudents})</option>
            <option value="suspended">Suspended Only ({suspendedStudents})</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-2">
            <div>No student records found matching your filters.</div>
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
              className="text-purple-400 hover:underline font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student Profile</th>
                  <th className="px-6 py-3.5">Roll / Student ID</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5 text-center">Tickets</th>
                  <th className="px-6 py-3.5">Login Access</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-xs">{s.full_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-purple-300">
                      {s.student_id || 'Not Assigned'}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {s.department || 'General'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[11px]">
                      {s.phone || 'No phone'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/60 font-semibold text-[10px]">
                        <Ticket className="w-3 h-3" />
                        {s.ticket_count}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        s.is_active
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                          : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                      }`}>
                        {s.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active (Allowed)
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Suspended (Blocked)
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => handleToggleStatus(s)}
                          disabled={updatingId === s.id}
                          title={s.is_active ? "Suspend student login" : "Activate student login"}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition ${
                            s.is_active
                              ? 'border-rose-800/60 text-rose-400 hover:bg-rose-950/50'
                              : 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/50'
                          }`}
                        >
                          {updatingId === s.id ? "..." : s.is_active ? "Suspend" : "Activate"}
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => { setResetError(''); setNewPassword(''); setResetModalStudent(s); }}
                          title="Reset student password"
                          className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Student */}
                        <button
                          onClick={() => handleDeleteStudent(s)}
                          disabled={updatingId === s.id}
                          title="Delete student account"
                          className="p-1.5 rounded-lg border border-rose-900/50 text-rose-400 hover:bg-rose-950/50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Authorized Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Add Authorized Student Account</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manoj Kumar"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Student University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. manoj@campus.edu"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student Roll / ID</label>
                  <input
                    type="text"
                    placeholder="e.g. CS-2024-055"
                    value={addForm.student_id}
                    onChange={(e) => setAddForm({ ...addForm, student_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department</label>
                <select
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. manoj123"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  This password will be securely hashed in the database.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={addForm.is_active}
                    onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-0"
                  />
                  <span>Permit immediate portal login (Active)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
                >
                  {addSubmitting ? "Saving..." : "Create Student Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Student Password */}
      {resetModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Reset Password</h3>
              </div>
              <button
                onClick={() => setResetModalStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Set a new login password for <span className="font-bold text-white">{resetModalStudent.full_name}</span> ({resetModalStudent.email}).
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (e.g. manoj123)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
                >
                  {resetSubmitting ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
