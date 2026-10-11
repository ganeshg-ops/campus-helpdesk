import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Ticket, Search, Filter, PlusCircle, Clock, CheckCircle2,
  AlertCircle, ChevronRight, User, Calendar, MessageSquare,
  Shield, ArrowUpDown, X, Trash2, Mail, Send, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TicketModal from '../components/TicketModal';
import EmailAdminModal from '../components/EmailAdminModal';

export default function TicketsPage() {
  const { user, isStaff } = useAuth();
  const location = useLocation();
  const isAdminPortal = location.pathname.startsWith('/admin');
  const isStudentPortal = location.pathname.startsWith('/student');
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'contact_inquiries'
  const [tickets, setTickets] = useState([]);
  const [myMessages, setMyMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals & Drawers
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEmailAdminOpen, setIsEmailAdminOpen] = useState(false);

  // Staff Reply States
  const [replyNotes, setReplyNotes] = useState('');
  const [replyStatus, setReplyStatus] = useState('In Progress');
  const [savingReply, setSavingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
    if (isStudentPortal) {
      fetchMyMessages();
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && tickets.length > 0) {
      const match = tickets.find(t => t.id.toString() === idParam || t.ticket_number === idParam);
      if (match) handleOpenTicket(match);
    }
  }, [searchParams, tickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getTickets();
      setTickets(data || []);
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyMessages = async () => {
    try {
      setLoadingMessages(true);
      const data = await api.getMyMessages();
      setMyMessages(data || []);
    } catch (err) {
      console.error("Failed to load contact messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setReplyNotes(ticket.resolution_notes || '');
    setReplyStatus(ticket.status || 'In Progress');
  };

  const handleDeleteTicket = async (ticketId, ticketNumber) => {
    if (window.confirm(`Are you sure you want to delete ticket ${ticketNumber}? This will remove it from the database.`)) {
      try {
        await api.deleteTicket(ticketId);
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
        fetchTickets();
      } catch (err) {
        alert("Failed to delete ticket: " + err.message);
      }
    }
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyNotes.trim()) {
      alert("Please enter a reply or resolution note.");
      return;
    }

    try {
      setSavingReply(true);
      const updated = await api.updateTicket(selectedTicket.id, {
        status: replyStatus,
        resolution_notes: replyNotes.trim(),
        comment: `Staff replied: ${replyNotes.trim().slice(0, 60)}`
      });
      setSelectedTicket(updated);
      fetchTickets();
      alert("Official reply saved successfully! The student can now see this response in their portal.");
    } catch (err) {
      alert("Failed to save reply: " + err.message);
    } finally {
      setSavingReply(false);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Escalated':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Low':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isAdminPortal ? 'Support Ticket Management' : 'My Requests & Support Tickets'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdminPortal
              ? 'Authorized Staff Portal: Managing campus-wide student inquiries, official replies, and escalations.'
              : 'Track your submitted requests and view official replies from college administration.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isStudentPortal && (
            <button
              onClick={() => setIsEmailAdminOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs shadow-sm transition"
            >
              <Mail className="w-4 h-4" />
              Contact Admin Directly
            </button>
          )}

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Support Ticket
          </button>
        </div>
      </div>

      {/* Student Portal Tabs: Support Tickets vs Contact Admin Inquiries */}
      {isStudentPortal && (
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'tickets'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Support Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('contact_inquiries')}
            className={`pb-3 flex items-center gap-2 border-b-2 transition ${
              activeTab === 'contact_inquiries'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            Contact Admin Inquiries & Replies ({myMessages.length})
          </button>
        </div>
      )}

      {/* Tab 1: Support Tickets View */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Ticket ID (CHD-2026-...), subject, category..."
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Escalated">Escalated</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Certificates">Certificates</option>
                <option value="Attendance">Attendance</option>
                <option value="Examinations">Examinations</option>
                <option value="Fees">Fees</option>
                <option value="Hostel">Hostel</option>
                <option value="Office Timings">Office Timings</option>
                <option value="General">General</option>
              </select>

              <button
                onClick={fetchTickets}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Refresh Tickets"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Ticket List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                Loading tickets from database...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <Ticket className="w-10 h-10 mx-auto text-slate-300" />
                <div className="font-semibold text-slate-600">No support tickets found</div>
                <p className="text-[11px] text-slate-400">
                  {searchQuery || statusFilter !== 'All' ? 'Try adjusting your search filters.' : 'You have not submitted any tickets yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Ticket ID</th>
                      <th className="px-6 py-3.5">Subject & Description</th>
                      <th className="px-6 py-3.5">Category</th>
                      <th className="px-6 py-3.5">Priority</th>
                      <th className="px-6 py-3.5">Assigned Officer</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => handleOpenTicket(t)}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          {t.ticket_number}
                        </td>
                        <td className="px-6 py-4 max-w-sm">
                          <div className="font-semibold text-slate-900 truncate">{t.subject}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.description}</div>
                          {t.resolution_notes && (
                            <div className="text-[10px] text-emerald-600 font-medium truncate mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 shrink-0" />
                              Reply: {t.resolution_notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPriorityBadge(t.priority)}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {t.assignee_name || "Pending Assignment"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusBadge(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTicket(t);
                              }}
                              className="px-2.5 py-1 rounded-lg text-blue-600 hover:bg-blue-50 font-semibold text-[11px]"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTicket(t.id, t.ticket_number);
                              }}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                              title="Delete Ticket"
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
        </div>
      )}

      {/* Tab 2: Contact Admin Inquiries & Admin Replies (Student View) */}
      {isStudentPortal && activeTab === 'contact_inquiries' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Inquiries Submitted to College Admin ({myMessages.length})
              </h3>
              <p className="text-xs text-slate-500">
                Questions you sent when information was not available in documents, along with official admin responses.
              </p>
            </div>
            <button
              onClick={fetchMyMessages}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Refresh Inquiries"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingMessages ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse bg-white rounded-2xl border border-slate-200">
              Loading your inquiries...
            </div>
          ) : myMessages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Mail className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-700 font-bold text-xs">No Contact Admin Inquiries Yet</div>
              <p className="text-slate-400 text-[11px] max-w-sm mx-auto">
                Whenever you use the "Contact Admin" or "Email Admin" option, your question and the admin's reply will be stored here.
              </p>
              <button
                onClick={() => setIsEmailAdminOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                Contact Admin Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myMessages.map((m) => (
                <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-purple-600 font-bold text-xs">MSG-{m.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(m.status)}`}>
                        {m.status}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Submitted: {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Your Question:</h4>
                    <p className="text-slate-700 text-xs mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                      "{m.question}"
                    </p>
                    {m.message && (
                      <p className="text-slate-500 text-[11px] mt-1.5 italic">
                        Note: {m.message}
                      </p>
                    )}
                  </div>

                  {/* Admin Reply Box */}
                  {m.admin_reply ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Official Reply from College Administration
                      </div>
                      <p className="text-emerald-950 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                        {m.admin_reply}
                      </p>
                      {m.replied_at && (
                        <div className="text-[10px] text-emerald-700 pt-1">
                          Replied on: {new Date(m.replied_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-blue-500" />
                      <span>Pending Administrator response. College staff is reviewing your question.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ticket Details & Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                  {selectedTicket.ticket_number}
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h3>
                <p className="text-slate-600 mt-2 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Category</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedTicket.category}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Priority</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedTicket.priority}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Staff</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedTicket.assignee_name || "Unassigned"}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Submitted By</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedTicket.creator_name || "Student"}</div>
                </div>
              </div>

              {/* Staff / Admin Reply Form (Rendered ONLY in Admin Portal) */}
              {isAdminPortal ? (
                <form onSubmit={handleSaveReply} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                      Staff Reply & Status Resolution
                    </span>
                    <span className="text-[11px] text-slate-500">Student will see this official response in their portal</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Official Reply / Resolution Notes for Student
                    </label>
                    <textarea
                      rows={3}
                      value={replyNotes}
                      onChange={(e) => setReplyNotes(e.target.value)}
                      placeholder="Type your official reply or instructions for the student..."
                      className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Update Status:</label>
                      <select
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Escalated">Escalated</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={savingReply}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                    >
                      {savingReply ? 'Saving Reply...' : 'Send Reply & Update Ticket'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Student View: Official resolution notes / admin reply */
                selectedTicket.resolution_notes ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Official Reply from College Administration
                    </div>
                    <p className="text-emerald-950 text-xs leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedTicket.resolution_notes}
                    </p>
                    <div className="text-[10px] text-emerald-700 pt-1">
                      Processed by: <span className="font-semibold">{selectedTicket.assignee_name || "College Administration"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0 text-blue-500" />
                    <span>Your inquiry is pending review. When the administration replies, their response will appear right here.</span>
                  </div>
                )
              )}

              {/* Status Audit Trail */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Audit Trail & History
                </h4>
                {selectedTicket.history && selectedTicket.history.length > 0 ? (
                  <div className="space-y-2 border-l-2 border-blue-200 pl-3 ml-1.5">
                    {selectedTicket.history.map((h, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-300" />
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800">
                            Status changed to <span className="text-blue-600 font-bold">{h.new_status}</span> by {h.changed_by_name}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {new Date(h.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        {h.comment && (
                          <div className="text-[11px] text-slate-500 mt-0.5 italic">"{h.comment}"</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs italic">No status modifications recorded.</div>
                )}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteTicket(selectedTicket.id, selectedTicket.ticket_number)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Ticket
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <TicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchTickets()}
      />

      {/* Email Admin Modal */}
      <EmailAdminModal
        isOpen={isEmailAdminOpen}
        onClose={() => setIsEmailAdminOpen(false)}
        onSuccess={() => {
          fetchMyMessages();
          setActiveTab('contact_inquiries');
        }}
      />
    </div>
  );
}
