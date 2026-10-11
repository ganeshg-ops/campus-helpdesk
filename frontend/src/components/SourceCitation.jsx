import React, { useState } from 'react';
import { BookOpen, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceCitation({ sources = [] }) {
  const [showExcerpt, setShowExcerpt] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs">
      <div className="flex items-center justify-between text-blue-900 font-bold mb-2">
        <span className="flex items-center gap-1.5 text-[11px]">
          <FileText className="w-3.5 h-3.5 text-blue-600" />
          Source Document Citations ({sources.length})
        </span>
        <button
          onClick={() => setShowExcerpt(!showExcerpt)}
          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 font-semibold"
        >
          {showExcerpt ? "Hide Excerpts" : "View Excerpts"}
          {showExcerpt ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="space-y-2">
        {sources.map((s, idx) => {
          const pageStr = s.page_number ? ` • Page ${s.page_number}` : '';
          return (
            <div key={idx} className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 text-[11px] truncate">
                  📄 {s.document}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 shrink-0">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verified
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                <span>Section: {s.title}</span>
                {s.page_number && <span className="font-bold text-blue-700">{pageStr}</span>}
              </div>
              {showExcerpt && s.excerpt && (
                <div className="mt-2 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 italic border-l-2 border-blue-500 leading-relaxed">
                  "{s.excerpt}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
