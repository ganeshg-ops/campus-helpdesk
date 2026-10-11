import React from 'react';
import { Sparkles, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DemoBanner() {
  const { isDemoMode } = useAuth();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white text-xs px-4 py-2 font-medium shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            DEMO MODE ACTIVE
          </span>
          <span>
            Operating with verified campus knowledge records, local vector RAG, and multi-agent simulation.
          </span>
        </div>
        <div className="flex items-center gap-4 text-blue-100">
          <span className="hidden sm:inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Grounding Guardrails Enabled
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] bg-black/10 px-2 py-0.5 rounded">
            <Info className="w-3 h-3" />
            DB Persistence: Active SQLite
          </span>
        </div>
      </div>
    </div>
  );
}
