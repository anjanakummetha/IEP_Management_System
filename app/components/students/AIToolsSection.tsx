"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Upload, Copy, Check, AlertCircle, CheckCircle2, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtractedGoal {
  title: string;
  baseline: string;
  target: string;
  timeframe: string;
}

interface ExtractedIEP {
  student_name?: string | null;
  disability_category?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  goals?: ExtractedGoal[];
}

interface AIToolsSectionProps {
  role: string;
  studentId: string;
  studentName: string;
  disabilityCategory: string;
  reviewDate: string;
}

type UploadPhase = "idle" | "extracting" | "review" | "saving" | "saved" | "error";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "zh", label: "Chinese (中文)" },
];

export function AIToolsSection({
  role,
  studentId,
  studentName,
  disabilityCategory,
  reviewDate,
}: AIToolsSectionProps) {
  const router = useRouter();

  // ── IEP upload state ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedIEP | null>(null);
  const [rawText, setRawText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [editName, setEditName] = useState("");
  const [editDisability, setEditDisability] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editGoals, setEditGoals] = useState<ExtractedGoal[]>([]);

  // ── Parent summary state ──────────────────────────────────────────────────
  const [language, setLanguage] = useState("en");
  const [summaryText, setSummaryText] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  // ── PLAAFP state ──────────────────────────────────────────────────────────
  const [plaafpText, setPlaafpText] = useState("");
  const [plaafpError, setPlaafpError] = useState("");
  const [generatingPlaafp, setGeneratingPlaafp] = useState(false);
  const [plaafpCopied, setPlaafpCopied] = useState(false);

  // ── IEP upload handlers ───────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setFileName(f.name); setPhase("idle"); setErrorMsg(""); }
  }

  async function handleExtract() {
    if (!file) return;
    setPhase("extracting");
    setErrorMsg("");
    const body = new FormData();
    body.append("pdf", file);
    try {
      const res = await fetch("/api/extract-iep", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) { setErrorMsg(json.error ?? "Extraction failed."); setPhase("error"); return; }
      const data: ExtractedIEP = json.extracted ?? {};
      setExtracted(data);
      setRawText(json.rawText ?? "");
      setEditName(data.student_name ?? studentName);
      setEditDisability(data.disability_category ?? disabilityCategory);
      setEditStartDate(data.start_date ?? "");
      setEditEndDate(data.end_date ?? reviewDate ?? "");
      setEditGoals(data.goals ?? []);
      setPhase("review");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  async function handleSave() {
    if (!extracted) return;
    setPhase("saving");
    const payload = {
      studentId, rawText,
      extracted: {
        ...extracted,
        student_name: editName, disability_category: editDisability,
        start_date: editStartDate || null, end_date: editEndDate || null,
        goals: editGoals,
      },
    };
    try {
      const res = await fetch("/api/save-iep", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setErrorMsg(json.error ?? "Save failed."); setPhase("error"); return; }
      setPhase("saved");
      router.refresh();
    } catch {
      setErrorMsg("Network error while saving.");
      setPhase("error");
    }
  }

  function handleReset() { setPhase("idle"); setFile(null); setFileName(""); setExtracted(null); setErrorMsg(""); }

  function handleGoalChange(idx: number, field: keyof ExtractedGoal, value: string) {
    setEditGoals((prev) => prev.map((g, i) => (i === idx ? { ...g, [field]: value } : g)));
  }

  // ── Parent summary handlers ───────────────────────────────────────────────
  async function handleGenerate() {
    setGenerating(true); setSummaryError(""); setSummaryText("");
    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, language }),
      });
      const json = await res.json();
      if (!res.ok) { setSummaryError(json.error ?? "Failed to generate summary."); }
      else { setSummaryText(json.summary); }
    } catch { setSummaryError("Network error. Please try again."); }
    finally { setGenerating(false); }
  }

  function handleSummaryCopy() {
    navigator.clipboard.writeText(summaryText);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2000);
  }

  // ── PLAAFP handlers ───────────────────────────────────────────────────────
  async function handleGeneratePlaafp() {
    setGeneratingPlaafp(true); setPlaafpError(""); setPlaafpText("");
    try {
      const res = await fetch("/api/generate-plaafp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const json = await res.json();
      if (!res.ok) { setPlaafpError(json.error ?? "Failed to generate PLAAFP."); }
      else { setPlaafpText(json.plaafp); }
    } catch { setPlaafpError("Network error. Please try again."); }
    finally { setGeneratingPlaafp(false); }
  }

  function handlePlaafpCopy() {
    navigator.clipboard.writeText(plaafpText);
    setPlaafpCopied(true);
    setTimeout(() => setPlaafpCopied(false), 2000);
  }

  const isTeacher = role === "teacher";
  const spinnerCls = "w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0";

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-slate-800">AI Tools</h2>

      {/* ── IEP Upload Card ── */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Upload IEP</h3>
        <p className="text-xs text-slate-500 mb-4">
          {isTeacher
            ? "Upload the student's IEP as a PDF. The AI will extract key information and update the student record."
            : "IEP documents are managed by the case manager teacher."}
        </p>

        {isTeacher && phase === "idle" && (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-slate-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-xs text-slate-500">{fileName ? fileName : "Click to select a PDF"}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </label>
            <button type="button" onClick={handleExtract} disabled={!file}
              className="rounded-lg bg-cold-brew text-vanilla px-4 py-2 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Upload & Extract
            </button>
          </div>
        )}

        {phase === "extracting" && (
          <div className="flex items-center gap-3 py-6">
            <div className={spinnerCls} />
            <p className="text-sm text-slate-600">Extracting data from IEP — this usually takes 10–20 seconds…</p>
          </div>
        )}

        {phase === "saving" && (
          <div className="flex items-center gap-3 py-6">
            <div className={spinnerCls} />
            <p className="text-sm text-slate-600">Saving to database…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
            </div>
            <button type="button" onClick={handleReset} className="text-sm font-medium text-cold-brew hover:underline">Try again</button>
          </div>
        )}

        {phase === "saved" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>IEP data saved successfully. The student record and goals have been updated.</span>
            </div>
            <button type="button" onClick={handleReset} className="text-sm font-medium text-cold-brew hover:underline">Upload another IEP</button>
          </div>
        )}

        {phase === "review" && extracted && (
          <div className="space-y-5">
            <p className="text-xs text-slate-500">Review the extracted fields below. Edit anything before saving.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Student Name", val: editName, set: setEditName, type: "text" },
                { label: "Disability Category", val: editDisability, set: setEditDisability, type: "text" },
                { label: "IEP Start Date", val: editStartDate, set: setEditStartDate, type: "date" },
                { label: "IEP End / Review Date", val: editEndDate, set: setEditEndDate, type: "date" },
              ].map(({ label, val, set, type }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input type={type} value={val} onChange={(e) => set(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam" />
                </div>
              ))}
            </div>

            {editGoals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Extracted Goals ({editGoals.length})</p>
                <div className="space-y-3">
                  {editGoals.map((goal, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Goal {idx + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-slate-500 mb-1">Title</label>
                          <input type="text" value={goal.title} onChange={(e) => handleGoalChange(idx, "title", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam" />
                        </div>
                        {(["baseline", "target", "timeframe"] as const).map((field) => (
                          <div key={field}>
                            <label className="block text-xs text-slate-500 mb-1 capitalize">{field}</label>
                            <input type="text" value={goal[field]} onChange={(e) => handleGoalChange(idx, field, e.target.value)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editGoals.length === 0 && (
              <p className="text-sm text-slate-400 italic">No goals were detected in the document.</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button type="button" onClick={handleSave}
                className={cn("rounded-lg bg-cold-brew text-vanilla px-5 py-2 text-sm font-medium", "hover:opacity-90 transition-colors")}>
                Confirm & Save
              </button>
              <button type="button" onClick={handleReset} className="text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
          </div>
        )}

        {!isTeacher && phase === "idle" && (
          <p className="text-sm text-slate-500 italic">IEP documents are managed by the case manager teacher.</p>
        )}
      </Card>

      {/* ── PLAAFP Generator Card ── */}
      <Card>
        <div className="flex items-start gap-3 mb-1">
          <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Present Levels (PLAAFP) Generator</h3>
            <p className="text-xs text-slate-500 mt-1">
              AI drafts a Present Levels of Academic Achievement and Functional Performance statement using this
              student&apos;s goals, progress scores, and teacher notes. Review and edit before copying into the IEP.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <button type="button" onClick={handleGeneratePlaafp} disabled={generatingPlaafp}
            className="flex items-center gap-2 rounded-lg bg-cold-brew text-vanilla px-4 py-2 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
            {generatingPlaafp && <Loader2 size={14} className="animate-spin" />}
            {generatingPlaafp ? "Generating PLAAFP…" : "Generate PLAAFP Draft"}
          </button>
        </div>

        {generatingPlaafp && (
          <div className="flex items-center gap-3 py-4 mt-3">
            <div className={spinnerCls} />
            <p className="text-sm text-slate-600">Analyzing goals and progress data — this takes 10–20 seconds…</p>
          </div>
        )}

        {plaafpError && !generatingPlaafp && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{plaafpError}</span>
          </div>
        )}

        {plaafpText && !generatingPlaafp && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-vanilla border border-sand px-3 py-2">
              <p className="text-xs text-mocha font-medium">AI-generated draft — review carefully before including in an official IEP</p>
            </div>
            <textarea
              value={plaafpText}
              onChange={(e) => setPlaafpText(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 leading-relaxed focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam resize-y font-mono"
            />
            <div className="flex items-center gap-4">
              <button type="button" onClick={handlePlaafpCopy}
                className="flex items-center gap-2 text-sm font-medium text-cold-brew hover:underline">
                {plaafpCopied
                  ? <><Check className="w-4 h-4" />Copied!</>
                  : <><Copy className="w-4 h-4" />Copy to clipboard</>}
              </button>
              <button type="button" onClick={handleGeneratePlaafp}
                className="text-sm text-slate-500 hover:text-slate-700">
                Regenerate
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Parent Summary Card ── */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Parent Summary Generator</h3>
        <p className="text-xs text-slate-500 mb-4">
          Generate a plain-language summary to share with parents. Select a language and click Generate.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={language}
            onChange={(e) => { setLanguage(e.target.value); setSummaryText(""); setSummaryError(""); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam">
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          <button type="button" onClick={handleGenerate} disabled={generating}
            className="rounded-lg bg-cold-brew text-vanilla px-4 py-2 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
            {generating ? "Generating…" : "Generate Summary"}
          </button>
        </div>

        {generating && (
          <div className="flex items-center gap-3 py-4">
            <div className={spinnerCls} />
            <p className="text-sm text-slate-600">Writing summary — this takes 10–20 seconds…</p>
          </div>
        )}

        {summaryError && !generating && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{summaryError}</span>
          </div>
        )}

        {summaryText && !generating && (
          <div className="space-y-3">
            <textarea value={summaryText} onChange={(e) => setSummaryText(e.target.value)} rows={12}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 font-serif focus:ring-2 focus:ring-espresso-foam focus:border-espresso-foam resize-none" />
            <button type="button" onClick={handleSummaryCopy}
              className="flex items-center gap-2 text-sm font-medium text-cold-brew hover:underline">
              {summaryCopied
                ? <><Check className="w-4 h-4" />Copied!</>
                : <><Copy className="w-4 h-4" />Copy to clipboard</>}
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
