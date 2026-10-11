import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Bot, Search, ShieldCheck, Sparkles, Layers } from 'lucide-react';

export default function ActivityTimeline({ steps = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  const getAgentColor = (agent) => {
    if (agent.includes("Router")) return "text-blue-600 bg-blue-50 border-blue-200";
    if (agent.includes("Knowledge")) return "text-purple-600 bg-purple-50 border-purple-200";
    if (agent.includes("Reviewer")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    return "text-indigo-600 bg-indigo-50 border-indigo-200";
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition py-1"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-500" />
          <span>Multi-Agent Workflow Activity ({steps.length} steps executed)</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] text-blue-600">
          {expanded ? "Hide Details" : "View Agent Pipeline"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-l-2 border-blue-200 pl-3 ml-1.5 py-1 text-xs">
          {steps.map((step, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white ring-1 ring-blue-300" />
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getAgentColor(step.agent)}`}>
                  {step.agent}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{step.timestamp}</span>
              </div>
              <div className="text-[11px] text-slate-700 mt-1 leading-snug">
                {step.summary}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
