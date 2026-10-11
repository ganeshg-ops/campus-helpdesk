import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Users, Ticket, CheckCircle, Clock, AlertTriangle,
  ArrowUpRight, RefreshCw, ChevronRight, UserCheck, Search, Filter, Edit,
  FileText, Mail, HelpCircle, UploadCloud, CheckCircle2, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { isStaff, isAdmin, user } = useAuth();

  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketToEdit, setSelectedTicketToEdit] = useState(null);
  const [newStatus, setNewStatus] = useState('Open');
  const [newAssignee, setNewAssignee] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, ticketsData, staffData] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getTickets().catch(() => []),
        api.getStaffMembers().catch(() => [])
      ]);
      setStats(statsData);
      setTickets(ticketsData);
      setStaffMembers(staffData);
    } catch (err) {
      console.error("Admin dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (ticket) => {
    setSelectedTicketToEdit(ticket);
    setNewStatus(ticket.status);
    setNewAssignee(ticket.assigned_to_user_id || '');
    setResolutionNote(ticket.resolution_notes || '');
    setStatusComment('');
  };

  const handleSaveTicketUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicketToEdit) return;

    try {
      setSaving(true);
      await api.updateTicket(selectedTicketToEdit.id, {
        status: newStatus,
        assigned_to_user_id: newAssignee ? parseInt(newAssignee) : null,
        resolution_notes: resolutionNote.trim() || null,
        comment: statusComment.trim() || `Status updated to ${newStatus}`
      });
      setSelectedTicketToEdit(null);
      loadAdminData();
    } catch (err) {
      alert("Failed to update ticket: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isStaff && !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Authorization Required</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You are currently viewing as student <strong>{user?.full_name}</strong>. Switch to "Dean Office Admin" or "Prof. David Miller (Staff)" using the demo switcher in the top right to explore administrative features.
        </p>
      </div>
    );
  }

  const filteredTickets = tickets.filter(t =>
    t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Staff & Helpdesk Administration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Campus Helpdesk Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics, SLA status tracking, ticket assignment, and service metrics.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Primary Helpdesk KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Uploaded PDFs */}
        <Link
          to="/admin/knowledge-base"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Uploaded PDFs</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{stats?.total_uploaded_pdfs || 0}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-1 flex items-center gap-1">
            <span>Manage college knowledge</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Student Emails & Messages */}
        <Link
          to="/admin/messages"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Student Emails</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 mt-2">{stats?.student_emails_count || 0}</div>
          <div className="text-[11px] text-blue-500 font-medium mt-1 flex items-center gap-1">
            <span>Submitted via AI Helpdesk</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Unanswered Questions */}
        <Link
          to="/admin/messages"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unanswered Questions</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">{stats?.unanswered_questions_count || 0}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
            <span>Pending reply / resolution</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>

        {/* Support Tickets */}
        <Link
          to="/admin/tickets"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Support Tickets</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">
            {stats?.open_tickets || 0} <span className="text-sm font-semibold text-slate-400">/ {stats?.total_tickets || 0}</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>{stats?.resolved_tickets || 0} resolved</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </div>
        </Link>
      </div>

      {/* PDF Upload Status & Recent Student Questions Panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* PDF Knowledge Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">PDF Upload & Knowledge Status</h3>
                  <p className="text-[11px] text-slate-500">Official college documents indexed for AI retrieval</p>
                </div>
              </div>
              <Link
                to="/admin/knowledge-base"
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>Upload PDF</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats?.pdf_upload_status && stats.pdf_upload_status.length > 0 ? (
                stats.pdf_upload_status.slice(0, 4).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-slate-800 truncate">{doc.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{doc.filename} • {doc.page_count} pages • {doc.chunk_count} chunks</div>
                    </div>
                    <div>
                      {doc.ocr_needed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          OCR Needed
                        </span>
                      ) : doc.status === 'indexed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Indexed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                          {doc.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No documents uploaded yet. Upload college PDF rules to train the AI.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              Only processed & approved PDFs are queried by Student AI
            </span>
            <Link
              to="/admin/knowledge-base"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Manage College PDFs
            </Link>
          </div>
        </div>

        {/* Recent Student Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Student Questions</h3>
                  <p className="text-[11px] text-slate-500">Inquiries submitted via chat and email escalation</p>
                </div>
              </div>
              <Link
                to="/admin/messages"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Inbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {stats?.recent_student_questions && stats.recent_student_questions.length > 0 ? (
                stats.recent_student_questions.slice(0, 4).map((q, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 line-clamp-2">{q}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No recent student questions recorded.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              {stats?.unanswered_questions_count || 0} unanswered student inquiries waiting
            </span>
            <Link
              to="/admin/messages"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Reply to Students
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics / Distribution Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Tickets by Service Category
          </h3>
          <div className="space-y-3">
            {stats?.tickets_by_category && Object.entries(stats.tickets_by_category).length > 0 ? (
              Object.entries(stats.tickets_by_category).map(([cat, count]) => {
                const total = stats.total_tickets || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{cat}</span>
                      <span className="text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No category data yet.</div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Ticket Resolution Pipeline
          </h3>
          <div className="space-y-3">
            {stats?.tickets_by_status && Object.entries(stats.tickets_by_status).map(([st, count]) => {
              const total = stats.total_tickets || 1;
              const pct = Math.round((count / total) * 100);
              const color =
                st === 'Resolved' ? 'from-emerald-500 to-teal-500' :
                st === 'In Progress' ? 'from-blue-500 to-indigo-500' :
                st === 'Escalated' ? 'from-amber-500 to-orange-500' : 'from-slate-400 to-slate-500';
              return (
                <div key={st} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{st}</span>
                    <span className="text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ticket Assignment & Status Action Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Campus Inquiries Master Table</h3>
            <p className="text-xs text-slate-500">Assign staff officers and review student ticket statuses</p>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Ticket #</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Subject</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Assigned Officer</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{t.ticket_number}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-800">{t.creator_name}</td>
                  <td className="px-6 py-3.5 max-w-xs truncate font-medium text-slate-700">{t.subject}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 font-medium">
                    {t.assignee_name || "Unassigned"}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                      t.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                      t.status === 'Escalated' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition"
                    >
                      <Edit className="w-3 h-3" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Assign Modal */}
      {selectedTicketToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Manage Ticket: {selectedTicketToEdit.ticket_number}
            </h3>
            <p className="text-slate-500 mb-4">{selectedTicketToEdit.subject}</p>

            <form onSubmit={handleSaveTicketUpdate} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Staff Officer</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none bg-white"
                >
                  <option value="">-- Unassigned --</option>
                  {staffMembers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution / Officer Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Official resolution instructions or action taken..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Comment</label>
                <input
                  type="text"
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  placeholder="Reason for change (e.g. Approved condonation letter verified)..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicketToEdit(null)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Status & Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
