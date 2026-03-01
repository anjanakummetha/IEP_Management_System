"use client";

import { useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { parentSummaryMock } from "@/app/data/mockData";
import { FileDown } from "lucide-react";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "zh", label: "Mandarin" },
];

export function StudentParentSummaryTab() {
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [language, setLanguage] = useState("en");

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <label htmlFor="language" className="block text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-mahogany focus:border-mahogany"
            >
              {LANGUAGES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setSummaryVisible(true)}
            className="inline-flex items-center justify-center rounded-lg bg-mahogany text-vanilla px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Generate Parent-Friendly Summary
          </button>
        </div>
      </Card>

      {summaryVisible && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-sm font-semibold text-slate-800">Summary</h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Download PDF
            </button>
          </div>
          <div className="max-w-none text-slate-700 font-serif text-sm space-y-4">
            {parentSummaryMock.split(/\n\n+/).map((paragraph, i) => {
              const match = paragraph.match(/^\*\*(.+?)\*\*\s*/);
              if (match) {
                const heading = match[1];
                const rest = paragraph.slice(match[0].length).trim();
                return (
                  <div key={i}>
                    <h3 className="text-slate-800 font-semibold mb-1">{heading}</h3>
                    {rest ? <p className="text-slate-700 leading-relaxed">{rest}</p> : null}
                  </div>
                );
              }
              return <p key={i} className="leading-relaxed">{paragraph}</p>;
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
