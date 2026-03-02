"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Plus, X, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalRow, ProgressNoteRow } from "@/app/students/[id]/page";

function ProgressBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

interface GoalsProgressSectionProps {
  role: string;
  goals: GoalRow[];
  studentId: string;
  progressNotes: ProgressNoteRow[];
}

export function GoalsProgressSection({ role, goals, studentId, progressNotes }: GoalsProgressSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [localNotes, setLocalNotes] = useState<ProgressNoteRow[]>(progressNotes);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/add-progress-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, note }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to save note."); return; }
      setLocalNotes((prev) => [
        { id: crypto.randomUUID(), note: note.trim(), created_at: new Date().toISOString() },
        ...prev,
      ]);
      setNote("");
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800">Goals & Progress</h2>
        {role === "teacher" && (
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="flex items-center gap-1.5 text-xs font-medium text-cold-brew hover:text-mocha"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Progress Note
          </button>
        )}
      </div>

      {/* Goals Table */}
      {goals.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-2">
          No goals found. Upload an IEP PDF below to extract and save goals automatically.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                {["Goal", "Timeframe", "Baseline", "Target", "Latest", "Progress"].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wide text-slate-500 font-medium pb-3 pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {goals.map((goal) => (
                <tr key={goal.id}>
                  <td className="py-3 pr-4 font-medium text-slate-800 max-w-[200px]">{goal.title}</td>
                  <td className="py-3 pr-4 text-slate-500 text-xs whitespace-nowrap">{goal.timeframe}</td>
                  <td className="py-3 pr-4 text-slate-700">{goal.baseline}</td>
                  <td className="py-3 pr-4 text-slate-700">{goal.target}</td>
                  <td className="py-3 pr-4 text-slate-700">
                    {goal.latestScore !== null ? goal.latestScore : (
                      <span className="text-slate-400 italic text-xs">No data</span>
                    )}
                  </td>
                  <td className="py-3 min-w-[140px]">
                    {goal.latestScore !== null ? (
                      <ProgressBar pct={goal.progressPct} />
                    ) : (
                      <span className="text-slate-400 italic text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Note Form */}
      {showForm && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-800">Add Progress Note</p>
            <button type="button" onClick={() => setShowForm(false)}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Describe the student's progress, observations, or any concerns…"
              className="w-full rounded-lg border border-sand px-3 py-2 text-sm text-espresso-noir placeholder:text-stone-400 focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam resize-none"
            />
            <button
              type="submit"
              disabled={saving || !note.trim()}
              className="flex items-center gap-2 rounded-lg bg-cold-brew text-vanilla px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : "Save Note"}
            </button>
          </form>
        </div>
      )}

      {/* Progress Notes History */}
      {localNotes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-3">
            <MessageSquare size={14} className="text-mocha" />
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
              Progress Notes ({localNotes.length})
            </p>
          </div>
          <div className="space-y-3">
            {localNotes.map((n) => (
              <div key={n.id} className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-400 mb-1">
                  {new Date(n.created_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })}
                </p>
                <p className="text-sm text-slate-700">{n.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
