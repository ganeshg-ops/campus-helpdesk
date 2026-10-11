import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Bot, Send, PlusCircle, Trash2, Mail, Sparkles, AlertCircle,
  RefreshCw, FileText, CheckCircle2, User, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ActivityTimeline from '../components/ActivityTimeline';
import SourceCitation from '../components/SourceCitation';
import EmailAdminModal from '../components/EmailAdminModal';

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Email Admin Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalQuestion, setEmailModalQuestion] = useState('');
  const [emailModalContext, setEmailModalContext] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const isSendingRef = useRef(false);
  const hasHandledPrefilledRef = useRef(false);
  const currentConvIdRef = useRef(null);

  const suggestedQuestions = [
    "How can I apply for a bonafide certificate?",
    "What documents are required for a bonafide certificate?",
    "What are the attendance rules?",
    "Where can I find examination information?",
    "What is the procedure for applying for a leave letter?"
  ];

  // Sync current conversation ID ref
  useEffect(() => {
    currentConvIdRef.current = currentConversationId;
  }, [currentConversationId]);

  // Load user conversations
  useEffect(() => {
    loadConversations();
  }, [user]);

  // Handle URL param or state navigation
  useEffect(() => {
    const urlId = searchParams.get('id');
    const parsedId = urlId ? parseInt(urlId, 10) : null;

    if (parsedId) {
      // Only reload if user selected a different conversation
      if (parsedId !== currentConvIdRef.current) {
        loadHistory(parsedId);
      }
    } else if (location.state?.prefilledQuery) {
      const q = location.state.prefilledQuery.trim();
      // Wipe state immediately from history to prevent repeated execution
      window.history.replaceState({}, document.title);

      if (q && !hasHandledPrefilledRef.current) {
        hasHandledPrefilledRef.current = true;
        setInputMessage(q);
        // Execute message send strictly once
        handleSendMessage(q);
      }
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const convs = await api.getConversations();
      setConversations(convs || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadHistory = async (convId) => {
    try {
      setLoading(true);
      setError(null);
      const history = await api.getConversationHistory(convId);
      currentConvIdRef.current = history.id;
      setCurrentConversationId(history.id);
      setMessages(history.messages || []);
      setSearchParams({ id: history.id });
    } catch (err) {
      setError("Failed to load conversation history.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    currentConvIdRef.current = null;
    hasHandledPrefilledRef.current = false;
    setCurrentConversationId(null);
    setMessages([]);
    setInputMessage('');
    setSearchParams({});
    if (inputRef.current) inputRef.current.focus();
  };

  const handleClearAllConversations = async () => {
    if (!window.confirm("Are you sure you want to clear all previous questions?")) return;
    try {
      await api.clearAllConversations();
      handleStartNewChat();
      setConversations([]);
    } catch (err) {
      console.error("Failed to clear conversations:", err);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    if (e) e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      if (currentConversationId === convId) {
        handleStartNewChat();
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const msg = (textToSend || inputMessage).trim();
    if (!msg || isSendingRef.current) return;

    isSendingRef.current = true;
    setError(null);
    setInputMessage('');
    setLoading(true);

    // Append optimistic user message
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      content: msg,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const activeConvId = currentConvIdRef.current;
      const response = await api.sendMessage(msg, activeConvId, null);

      currentConvIdRef.current = response.conversation_id;
      setCurrentConversationId(response.conversation_id);
      setSearchParams({ id: response.conversation_id });

      const assistantMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: response.response,
        steps: response.workflow_steps,
        sources: response.sources,
        category: response.category,
        action_taken: response.action_taken,
        ticket_created: response.ticket_created,
        ticket_id: response.ticket_id,
        escalation_offered: response.escalation_offered,
        answer_available: response.answer_available !== false,
        created_at: new Date().toISOString(),
        user_query: msg
      };

      setMessages(prev => [...prev, assistantMsg]);
      loadConversations();
    } catch (err) {
      setError(err.message || "Failed to reach AI assistant. Please try again.");
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenEmailAdmin = (userQuestion = '', contextStr = '') => {
    setEmailModalQuestion(userQuestion || inputMessage || "College Policy Inquiry");
    setEmailModalContext(contextStr || "Student inquired through Campus Helpdesk AI Chat.");
    setIsEmailModalOpen(true);
  };

  const handleAskAnotherQuestion = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-80px)] flex gap-6">
      {/* Left Sidebar: Conversations */}
      <div className="hidden lg:flex flex-col w-72 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm shrink-0">
        <button
          onClick={handleStartNewChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition mb-4"
        >
          <PlusCircle className="w-4 h-4" />
          New Inquiry
        </button>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Previous Questions ({conversations.length})
            </label>
            {conversations.length > 0 && (
              <button
                onClick={handleClearAllConversations}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold transition"
                title="Clear all chat history"
              >
                Clear all
              </button>
            )}
          </div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              No previous threads
            </div>
          ) : (
            <div className="space-y-1.5">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => loadHistory(c.id)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition ${
                    currentConversationId === c.id
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate pr-1">{c.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Delete thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Admin Shortcut in Sidebar */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={() => handleOpenEmailAdmin()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Contact Admin
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Ask Campus AI
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                  Document-Grounded
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Answers verified from admin-uploaded college PDFs with citations
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEmailAdmin()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Contact Admin
            </button>
            <button
              onClick={handleStartNewChat}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              title="New Chat"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/40">
          {messages.length === 0 ? (
            <div className="py-8 max-w-2xl mx-auto text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">How can I assist you today?</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                  Ask any college regulation, attendance rule, certificate procedure, or examination schedule. Official PDF citations and page numbers are provided.
                </p>
              </div>

              {/* Suggested Questions Grid */}
              <div className="space-y-2 text-left pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Suggested Questions
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {suggestedQuestions.map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sq)}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50/70 hover:border-blue-300 transition text-xs shadow-sm flex items-center justify-between group"
                    >
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition">
                        {sq}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.sender === 'user';
              const isMissingInfo = !isUser && (m.answer_available === false || m.escalation_offered || m.content.includes("couldn't find the exact information"));

              return (
                <div key={m.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-2xl rounded-3xl px-5 py-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {/* Render content */}
                    <div className="whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed">
                      {m.content}
                    </div>

                    {/* Requirement 3: When Answer Is Not Available in PDFs -> Show Email Admin & Ask Another Question */}
                    {isMissingInfo && (
                      <div className="mt-4 pt-3.5 border-t border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-500 mb-2.5">
                          How would you like to proceed?
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            onClick={() => handleOpenEmailAdmin(m.user_query || "Question not found in documents", m.content)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email Admin
                          </button>
                          <button
                            onClick={handleAskAnotherQuestion}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                            Ask Another Question
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Source citations with Page Numbers */}
                    {!isUser && m.sources && m.sources.length > 0 && !isMissingInfo && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100">
                        <SourceCitation sources={m.sources} />
                      </div>
                    )}

                    {/* Multi-Agent Activity Timeline */}
                    {!isUser && m.steps && m.steps.length > 0 && (
                      <div className="mt-3">
                        <ActivityTimeline steps={m.steps} />
                      </div>
                    )}

                    <div className={`text-[10px] mt-2 text-right ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 font-bold text-xs uppercase">
                      {user?.full_name ? user.full_name[0] : 'S'}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none px-5 py-4 text-xs shadow-sm max-w-md">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Searching Official College Documents...</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Extracting relevant PDF passages and verifying grounding guardrails
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="text-rose-800 underline font-bold ml-2 hover:text-rose-900"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bonafide certificates, attendance rules, exam dates, or leave procedures..."
              className="flex-1 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMessage.trim()}
              className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-40 shadow-md shadow-blue-500/20"
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Press Enter to send • Verified against official college documents</span>
            <span className="hidden sm:inline">Zero hallucination policy enabled</span>
          </div>
        </div>
      </div>

      {/* Email Admin Contact Modal */}
      <EmailAdminModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        initialQuestion={emailModalQuestion}
        chatContext={emailModalContext}
      />
    </div>
  );
}
