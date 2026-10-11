import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, CheckCircle, XCircle, Ticket, Building2, Phone, Mail, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await api.getStudents();
      setStudents(data);
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = !student.is_active;
    const actionWord = newStatus ? "activate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${actionWord} student account ${student.full_name}?`)) {
      return;
    }

    try {
      setUpdatingId(student.id);
      await api.updateStudentStatus(student.id, { is_active: newStatus });
      setStudents(students.map(s => s.id === student.id ? { ...s, is_active: newStatus } : s));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.student_id && s.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.department && s.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Student Account Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered student profiles, verify departments, inspect ticket counts, and maintain account statuses.
          </p>
        </div>

        <button
          onClick={loadStudents}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Directory
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, roll ID (e.g. CS-2024-042), email, or department..."
          className="w-full text-xs bg-transparent text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Students Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs animate-pulse">
            Loading student records...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No student records matching your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 border-b border-slate-700 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Student Details</th>
                  <th className="px-6 py-3.5">Student Roll / ID</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5 text-center">Tickets</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
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
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        s.is_active
                          ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                          : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                      }`}>
                        {s.is_active ? (
                          <>
                            <CheckCircle className="w-2.5 h-2.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-2.5 h-2.5" />
                            Suspended
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        disabled={updatingId === s.id}
                        className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition ${
                          s.is_active
                            ? 'border-rose-800/60 text-rose-400 hover:bg-rose-950/50'
                            : 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/50'
                        }`}
                      >
                        {updatingId === s.id ? "Updating..." : s.is_active ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
