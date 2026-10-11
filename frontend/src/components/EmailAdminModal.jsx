import React, { useState, useEffect } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, RefreshCw, FileQuestion, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function EmailAdminModal({
  isOpen,
  onClose,
  initialQuestion = '',
  chatContext = '',
  ticketId = null,
  onSuccess
}) {
  const { user } = useAuth();

  const [question, setQuestion] = useState('');
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [includeContext, setIncludeContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuestion(initialQuestion || '');
      setAdditionalMessage('');
      setError(null);
      setSuccessResult(null);
      setIncludeContext(Boolean(chatContext));
    }
  }, [isOpen, initialQuestion, chatContext]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError("Please specify the question for the administrator.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        student_name: user?.full_name || "Student",
        student_email: user?.email || "",
        question: question.trim(),
        message: additionalMessage.trim() || null,
        chat_context: includeContext && chatContext ? chatContext.trim() : null,
        ticket_id: ticketId || null
      };

      const result = await api.emailAdmin(payload);
      setSuccessResult(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setError(err.message || "Failed to deliver email to the college administrator. Please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Email College Admin</h3>
              <p className="text-[11px] text-slate-500">Official Campus Helpdesk Contact Form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-bold text-slate-900">Email Delivered to Admin!</h4>
                <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your question has been sent to the administrator's official mailbox and recorded in the Campus Helpdesk database (Ref: <strong>MSG-{successResult.id}</strong>).
                </p>
                <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono">
                  Recipient: Deanery & Helpdesk Administration
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">Unable to Send Email</div>
                    <div className="text-[11px] mt-0.5">{error}</div>
                  </div>
                </div>
              )}

              {/* Student Details (Auto-filled) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Student Name</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">{user?.full_name || "Guest Student"}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Registered Email</span>
                  <span className="font-semibold text-slate-800 text-xs truncate block">{user?.email || "Not registered"}</span>
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Your Question <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="The original inquiry you need official confirmation for..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                  required
                />
              </div>

              {/* Additional message */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Message / Context <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={additionalMessage}
                  onChange={(e) => setAdditionalMessage(e.target.value)}
                  placeholder="Provide any extra details, deadlines, or specific department requirements..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>

              {/* Chat context toggle if present */}
              {chatContext && (
                <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="includeContextCheck"
                    checked={includeContext}
                    onChange={(e) => setIncludeContext(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="includeContextCheck" className="text-[11px] text-slate-700 cursor-pointer">
                    <span className="font-semibold block">Attach AI conversation context</span>
                    <span className="text-slate-500 block">Helps the administrator understand what answers were retrieved.</span>
                  </label>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Sending to Admin...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Email to Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
