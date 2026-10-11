import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, ArrowRight, Zap, Ticket, BookOpen, Users, ShieldCheck,
  Sparkles, CheckCircle2, Clock, MapPin, Mail, Shield, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated, isStudent, isAdmin } = useAuth();

  const features = [
    {
      title: "Instant Grounded Answers",
      description: "Ask questions on certificates, 75% attendance criteria, exam timetables, hostel curfews, and fee deadlines with direct citations.",
      icon: Zap,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Smart Ticket Management",
      description: "When queries require staff approval, automatically generate tracked support tickets assigned to Student Affairs officers.",
      icon: Ticket,
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      title: "Approved Knowledge RAG",
      description: "All official answers are retrieved from indexed college handbooks, circulars, and verified academic calendar events.",
      icon: BookOpen,
      gradient: "from-violet-500 to-pink-500"
    },
    {
      title: "Multi-Agent Safeguards",
      description: "Four distinct AI agents collaborate: Router, Knowledge Retriever, Student Support, and Reviewer Guardrail Auditor.",
      icon: ShieldCheck,
      gradient: "from-emerald-500 to-teal-500"
    }
  ];

  const agentWorkflow = [
    {
      number: "01",
      role: "Router / Triage Agent",
      duty: "Classifies student intent, identifies query category, and directs request to specialized tool or knowledge branch."
    },
    {
      number: "02",
      role: "Knowledge Agent",
      duty: "Performs RAG retrieval against approved college handbooks and academic calendar database, extracting source passages."
    },
    {
      number: "03",
      role: "Reviewer Agent",
      duty: "Audits grounding, prevents hallucinations, strictly checks student privacy, and enforces staff escalation when evidence is absent."
    },
    {
      number: "04",
      role: "Student Support Agent",
      duty: "Synthesizes clear, compassionate responses formatted with official document citations and ticket creation shortcuts."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900">
                Campus Helpdesk
              </div>
              <div className="text-[11px] text-slate-500 -mt-0.5 font-medium">Student Services & Administration</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/student/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
            >
              Student Portal
            </Link>
            <Link
              to="/admin/login"
              className="text-xs font-semibold px-4 py-2 rounded-xl text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-16 lg:pt-20 lg:pb-24 gradient-hero border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>AI-Powered Campus Helpdesk & Student Services</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Smart Campus Support, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Always Grounded.</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Get instant answers to college questions, anytime. From attendance condonation to semester fees and certificates, backed by approved regulations and human escalation.
          </p>

          {/* Dedicated Portal Selection Cards */}
          <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            {/* Student Portal Card */}
            <div className="bg-white rounded-3xl p-7 border-2 border-blue-100 shadow-xl shadow-blue-500/5 hover:border-blue-400 transition group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  For College Students
                </div>
                <h3 className="text-xl font-bold text-slate-900">Student Portal</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Ask the campus AI assistant questions on certificates, attendance condonation, exam schedules, and fees. Create and track your personal support tickets.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    24/7 AI Chat Assistant with verified citations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Submit and track personal support tickets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    Search college FAQs & academic calendar
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/student/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition"
                >
                  Enter Student Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="bg-white rounded-3xl p-7 border-2 border-purple-100 shadow-xl shadow-purple-500/5 hover:border-purple-400 transition group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider mb-2">
                  For Staff & Administrators
                </div>
                <h3 className="text-xl font-bold text-slate-900">Admin Portal</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Campus inquiry command center for Deanery officers and staff. Manage ticket resolution, upload circulars for RAG, and maintain college knowledge.
                </p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Campus inquiry metrics & SLA resolution pipeline
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Assign officers & resolve student tickets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    Upload PDF / TXT handbooks into RAG store
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/admin/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition"
                >
                  Enter Admin Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Designed For Reliable Campus Services
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Policy-backed student assistance built to eliminate office queues and circular confusion.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-6 border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-blue-200 transition duration-200 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.gradient} flex items-center justify-center text-white mb-5 shadow-md group-hover:scale-105 transition`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Multi-Agent Collaboration Pipeline */}
      <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              Under The Hood
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Multi-Agent Collaboration Architecture
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Inquiries are processed through an observe-act-observe ReAct pipeline across four specialized AI agents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentWorkflow.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="text-4xl font-black text-slate-100 absolute top-3 right-4 select-none">
                  {item.number}
                </div>
                <div className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded mb-3">
                  AGENT {item.number}
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">{item.role}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.duty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 font-extrabold text-base text-slate-900">
                <Bot className="w-5 h-5 text-blue-600" />
                CAMPUS HELPDESK & STUDENT SERVICES
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                Empowering students and faculty with truthful, grounded, policy-backed AI support. Zero hallucinations, verified citations, and transparent ticket escalation.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Campus Office</div>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Admin Block Room 102, Main Campus
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Mon - Fri: 9:00 AM - 5:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  helpdesk@campus.edu
                </li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Portals</div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li><Link to="/student/login" className="hover:text-blue-600 font-semibold">Student Portal Login</Link></li>
                <li><Link to="/student/register" className="hover:text-blue-600">Student Registration</Link></li>
                <li><Link to="/admin/login" className="hover:text-purple-600 font-semibold">Admin Portal Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400">
            <div>© 2026 Campus Helpdesk System. Built for College Project Demonstration.</div>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <span>FastAPI Backend</span>
              <span>•</span>
              <span>React Vite Frontend</span>
              <span>•</span>
              <span>CrewAI ReAct Architecture</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
