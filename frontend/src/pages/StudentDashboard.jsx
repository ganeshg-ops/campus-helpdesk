import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot, Send, MessageSquare, Mail, LogOut, Sparkles, ChevronRight,
  HelpCircle, ArrowRight, Clock, CheckCircle2, Ticket, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import EmailAdminModal from '../components/EmailAdminModal';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [chatInput, setChatInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [myMessages, setMyMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEmailAdminOpen, setIsEmailAdminOpen] = useState(false);
  const [emailAdminInitialQuestion, setEmailAdminInitialQuestion] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  const suggestedQuestions = [
    "How can I apply for a bonafide certificate?",
    "What documents are required for a bonafide certificate?",
    "What are the attendance rules?",
    "Where can I find examination information?",
    "What is the procedure for applying for a leave letter?"
  ];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [convData, msgData] = await Promise.all([
          api.getConversations().catch(() => []),
          api.getMyMessages().catch(() => [])
        ]);
        setConversations(convData || []);
        setMyMessages(msgData || []);
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleAskCampusAI = (e) => {
    if (e) e.preventDefault();
    if (isNavigating) return;
    const q = chatInput.trim();
    if (q) {
      setIsNavigating(true);
      navigate('/student/chat', { state: { prefilledQuery: q } });
    }
  };

  const handleSuggestedClick = (q) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate('/student/chat', { state: { prefilledQuery: q } });
  };

  const handleOpenContactAdmin = (q = '') => {
    setEmailAdminInitialQuestion(q);
    setIsEmailAdminOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Campus Helpdesk • Student Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.full_name || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {user?.department ? `${user.department} • Student ID: ${user.student_id || 'Active'}` : 'Ask questions grounded in official college documents.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenContactAdmin()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Contact Admin</span>
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold transition"
            title="Log out of student portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Hero "Ask Campus AI" Box */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur text-white flex items-center justify-center mx-auto shadow-inner">
            <Bot className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ask Campus AI
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Get instant, truthful answers on bonafide certificates, attendance regulations, leave letters, and examination guidelines based on official college documents.
          </p>

          {/* Large Chat Box Input */}
          <form onSubmit={handleAskCampusAI} className="pt-2">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-2xl max-w-2xl mx-auto border border-white/30">
              <input
                type="text"
                disabled={isNavigating}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask any question (e.g. How do I apply for a bonafide certificate?)..."
                className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none px-4 py-2.5 disabled:opacity-75"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isNavigating}
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition shrink-0"
              >
                <span>{isNavigating ? 'Opening...' : 'Ask AI'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Decorative ambient background */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Suggested Questions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            Suggested Questions
          </h3>
          <span className="text-xs text-slate-400">Click any card to ask instantly</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestedClick(q)}
              className="bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 p-4 rounded-2xl text-left shadow-sm hover:shadow transition group flex flex-col justify-between"
            >
              <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 transition">
                {q}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition">
                <span>Ask this now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}

          {/* Contact Admin Quick Card */}
          <button
            onClick={() => handleOpenContactAdmin()}
            className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl text-left shadow-sm hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-white/10 px-2 py-0.5 rounded mb-2">
                Need Human Assistance?
              </div>
              <div className="text-xs font-bold text-white">
                Contact College Administrator
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Send an email with your question directly to the admin.
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-blue-300 font-bold">
              <span>Open contact form</span>
              <Mail className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Section: My Previous Questions & Submitted Emails */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Previous Questions */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                My Previous Questions
              </h3>
              <p className="text-xs text-slate-500">Your recent AI chat sessions</p>
            </div>
            <Link
              to="/student/chat"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              Start New Chat
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No previous inquiries found. Ask your first question above!
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  to={`/student/chat?id=${c.id}`}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition group"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition">
                      {c.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Updated {new Date(c.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contact Admin Requests / Messages */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                Contact Admin Inquiries
              </h3>
              <p className="text-xs text-slate-500">Emails sent to college administration</p>
            </div>
            <button
              onClick={() => handleOpenContactAdmin()}
              className="text-xs font-bold text-purple-600 hover:text-purple-800 transition"
            >
              Send New Email
            </button>
          </div>

          {loading ? (
            <div className="space-y-2.5 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="h-12 bg-slate-100 rounded-xl" />
            </div>
          ) : myMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              <Mail className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No messages sent to the admin yet.
            </div>
          ) : (
            <div className="space-y-2">
              {myMessages.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">MSG-{m.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      m.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' :
                      m.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 mt-1 truncate">
                    {m.question}
                  </div>
                  {m.admin_reply && (
                    <div className="mt-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800">
                      <strong>Admin Reply:</strong> {m.admin_reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmailAdminModal
        isOpen={isEmailAdminOpen}
        onClose={() => setIsEmailAdminOpen(false)}
        initialQuestion={emailAdminInitialQuestion}
        onSuccess={() => {
          api.getMyMessages().then(setMyMessages).catch(() => {});
        }}
      />
    </div>
  );
}
