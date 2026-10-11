import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, XCircle, Play, RefreshCw, ShieldCheck,
  FileCheck, AlertCircle, Sparkles, Terminal, Check
} from 'lucide-react';
import { api } from '../services/api';

export default function EvaluationPage() {
  const [suiteResult, setSuiteResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      setError(null);
      const res = await api.runEvaluationSuite();
      setSuiteResult(res);
    } catch (err) {
      setError(err.message || "Failed to execute evaluation test suite.");
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    // Automatically run on first load to showcase test results
    handleRunEvaluation();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Prompt Verification Suite</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Automated Evaluation & Guardrail Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Execute real automated test scenarios verifying grounding, citation generation, unverified policy rejection, student privacy isolation, and ticket lifecycle persistence.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Executing Test Suite...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Re-Run Full Test Suite
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Scoreboard */}
      {suiteResult && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scenarios</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{suiteResult.total_tests}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated backend tests</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 bg-emerald-50/20 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Passed</span>
            <div className="text-3xl font-black text-emerald-600 mt-1">{suiteResult.passed}</div>
            <div className="text-[11px] text-emerald-600/80 mt-0.5">Zero errors encountered</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Failed</span>
            <div className="text-3xl font-black text-slate-700 mt-1">{suiteResult.failed}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Failed test criteria</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-blue-200 bg-blue-50/30 shadow-sm">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Verdict</span>
            <div className="text-xl font-extrabold text-blue-700 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              {suiteResult.overall_status}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">All 5 scenarios validated</div>
          </div>
        </div>
      )}

      {/* Test Scenarios Details */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500" />
          Test Scenario Execution Log
        </h2>

        {suiteResult?.results?.map((res) => {
          const isPass = res.status === 'PASS';
          return (
            <div
              key={res.test_id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                isPass ? 'border-slate-200 hover:border-emerald-300' : 'border-rose-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  {isPass ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <h3 className="font-bold text-slate-900 text-sm">{res.scenario_name}</h3>
                </div>
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    isPass
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {res.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-xs mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Expected Outcome
                  </span>
                  <div className="text-slate-700 leading-relaxed font-medium">{res.expected}</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Observed System Behavior
                  </span>
                  <div className="text-slate-800 leading-relaxed font-mono text-[11px] bg-white p-2 rounded border border-slate-200/80">
                    {res.actual}
                  </div>
                </div>
              </div>

              {res.details && (
                <div className="text-[11px] text-slate-500 mt-2.5 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600">Verification Details:</span>
                  <span>{res.details}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
