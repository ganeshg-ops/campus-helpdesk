import React, { useState, useEffect } from 'react';
import {
  Mail, Search, Filter, CheckCircle, Clock, AlertCircle, RefreshCw,
  Send, User, FileText, ChevronRight, X, MessageSquare, AlertTriangle,
  Trash2, CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function StudentMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected message for details and reply
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(null);
  const [replyError, setReplyError] = useState(null);

  useEffect(() => {
    loadMessages();
  }, [statusFilter]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await api.getStudentMessages(statusFilter);
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to load student messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = (msg) => {
    setSelectedMessage(msg);
    setReplyText(msg.admin_reply || '');
    setReplySuccess(null);
    setReplyError(null);
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Are you sure you want to delete this student message?")) {
      try {
        await api.deleteStudentMessage(msgId);
        if (selectedMessage?.id === msgId) {
          setSelectedMessage(null);
        }
        loadMessages();
      } catch (err) {
        alert("Failed to delete message: " + err.message);
      }
    }
  };

  const handleUpdateStatus = async (msgId, newStatus) => {
    try {
      const updated = await api.updateMessageStatus(msgId, newStatus);
      setMessages(messages.map(m => m.id === msgId ? updated : m));
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage(updated);
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    try {
      setReplying(true);
      setReplyError(null);
      const updated = await api.replyToStudentMessage(selectedMessage.id, replyText.trim());
      setReplySuccess("Reply email dispatched to student and message marked as Resolved!");
      setSelectedMessage(updated);
      setMessages(messages.map(m => m.id === updated.id ? updated : m));
    } catch (err) {
      setReplyError(err.message || "Failed to dispatch reply email.");
    } finally {
      setReplying(false);
    }
  };

  const handleRetryEmail = async (msgId) => {
    try {
      const updated = await api.retryMessageEmail(msgId);
      setMessages(messages.map(m => m.id === msgId ? updated : m));
      if (selectedMessage && selectedMessage.id === msgId) {
        setSelectedMessage(updated);
      }
      alert("Email re-sent successfully to administrator!");
    } catch (err) {
      alert("Retry failed: " + err.message);
    }
  };

  const filteredMessages = messages.filter(m =>
    m.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Messages & Email Inquiries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming inquiries from students when document-based answers were unavailable, and send official replies.
          </p>
        </div>

        <button
          onClick={loadMessages}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Inbox
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'New', 'In Progress', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, email, or question..."
            className="bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none w-64"
          />
        </div>
      </div>

      {/* Main Grid: Inbox Table + Detail / Reply Drawer */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Messages List (7 or 12 cols) */}
        <div className={selectedMessage ? "lg:col-span-7 space-y-3" : "lg:col-span-12 space-y-3"}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Inquiries List ({filteredMessages.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
                Loading student messages...
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No student inquiries found matching filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {filteredMessages.map((m) => {
                  const isSelected = selectedMessage?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMessage(m)}
                      className={`p-4 cursor-pointer transition ${
                        isSelected ? 'bg-purple-50/60 border-l-4 border-purple-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 max-w-lg">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{m.student_name}</span>
                            <span className="text-slate-400 font-mono text-[11px]">&lt;{m.student_email}&gt;</span>
                          </div>
                          <div className="text-slate-800 font-medium text-xs line-clamp-2">
                            "{m.question}"
                          </div>
                          {m.message && (
                            <div className="text-slate-500 text-[11px] line-clamp-1 italic">
                              Note: {m.message}
                            </div>
                          )}
                          {m.admin_reply && (
                            <div className="text-emerald-700 font-medium text-[11px] line-clamp-1 flex items-center gap-1 mt-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              Replied: {m.admin_reply}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-3">
                            <span>Submitted: {new Date(m.created_at).toLocaleString()}</span>
                            <span>•</span>
                            <span className={m.email_delivery_status === 'Failed' ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                              Delivery: {m.email_delivery_status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            m.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            m.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {m.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(m.id);
                            }}
                            className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Message Details & Reply Panel */}
        {selectedMessage && (
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 text-xs text-slate-700 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-purple-600 text-[11px] font-bold block">MSG-{selectedMessage.id}</span>
                  <h3 className="text-base font-bold text-slate-900">Inquiry Details</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Student info */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Student:</span>
                  <span className="font-bold text-slate-900">{selectedMessage.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Email:</span>
                  <span className="font-mono text-purple-700 font-medium">{selectedMessage.student_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-[11px]">Received:</span>
                  <span className="text-slate-700">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 text-[11px]">Email Status:</span>
                  <span className={`font-bold ${selectedMessage.email_delivery_status === 'Failed' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedMessage.email_delivery_status}
                  </span>
                </div>
                {selectedMessage.email_delivery_status === 'Failed' && (
                  <div className="pt-2 text-right">
                    <button
                      onClick={() => handleRetryEmail(selectedMessage.id)}
                      className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition"
                    >
                      Retry Email to Admin
                    </button>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Update Inquiry Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['New', 'In Progress', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(selectedMessage.id, st)}
                      className={`py-1.5 rounded-xl font-bold text-center border transition ${
                        selectedMessage.status === st
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question & Note */}
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Student's Question
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 leading-relaxed font-medium">
                    "{selectedMessage.question}"
                  </div>
                </div>

                {selectedMessage.message && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Additional Message
                    </span>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 italic">
                      "{selectedMessage.message}"
                    </div>
                  </div>
                )}

                {selectedMessage.chat_context && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      AI Conversation Context
                    </span>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 line-clamp-3">
                      {selectedMessage.chat_context}
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Official Administrative Reply
                  </span>
                  {selectedMessage.admin_reply && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                      Already Replied
                    </span>
                  )}
                </div>

                {replySuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{replySuccess}</span>
                  </div>
                )}

                {replyError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{replyError}</span>
                  </div>
                )}

                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official administrative response here. The student will receive this response in their portal..."
                  className="w-full text-xs p-3 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-purple-500 font-medium"
                  required
                />

                <button
                  type="submit"
                  disabled={replying || !replyText.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition disabled:opacity-50"
                >
                  {replying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sending Reply...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Official Reply to Student
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
