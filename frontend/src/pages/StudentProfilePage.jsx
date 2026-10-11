import React, { useState, useEffect } from 'react';
import { User, Mail, Hash, Building2, Phone, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function StudentProfilePage() {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setDepartment(user.department || 'Computer Science & Engineering');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg('');
      setSuccessMsg('');
      await updateProfile({
        full_name: fullName.trim(),
        department: department.trim(),
        phone: phone.trim() || null
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Profile Details</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your enrolled university credentials and update your contact preferences.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: ID Card summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            {user?.full_name ? user.full_name[0] : 'S'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{user?.full_name || 'Student'}</h3>
            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full inline-block mt-1">
              Active Student
            </span>
          </div>
          <div className="w-full pt-4 border-t border-slate-100 text-left text-xs space-y-2 text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Student Roll:</span>
              <span className="font-mono font-bold text-slate-800">{user?.student_id || 'CS-2024-042'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="font-semibold capitalize text-slate-800">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Campus Status:</span>
              <span className="text-emerald-600 font-bold">Good Standing</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Details */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Edit Permitted Academic & Contact Information</h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <div className="flex items-center border border-slate-300 rounded-xl px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20">
                <User className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full focus:outline-none text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">University Email (Read-Only)</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-500">
                <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-transparent focus:outline-none cursor-not-allowed text-slate-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Institutional email managed by registrar.</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <div className="flex items-center border border-slate-300 rounded-xl px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Building2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full focus:outline-none bg-white text-slate-800"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Management Studies">Management Studies</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number</label>
              <div className="flex items-center border border-slate-300 rounded-xl px-3 py-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Phone className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full focus:outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
