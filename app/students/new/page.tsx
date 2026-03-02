"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, ArrowLeft, Loader2, PlusCircle, Trash2
} from "lucide-react";

type GoalDraft = {
  title: string; baseline: string; target: string; timeframe: string; target_date: string;
};
type ServiceDraft = {
  type: string; frequency: string; duration: string; provider: string;
};

type Phase = "idle" | "extracting" | "review" | "saving" | "done";

export default function AddStudentPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [showFlags, setShowFlags] = useState(false);

  // Extracted / editable fields
  const [studentName, setStudentName]       = useState("");
  const [districtId, setDistrictId]         = useState("");
  const [dob, setDob]                       = useState("");
  const [disability, setDisability]         = useState("");
  const [grade, setGrade]                   = useState("");
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [creationDate, setCreationDate]     = useState("");
  const [revisionDate, setRevisionDate]     = useState("");
  const [goals, setGoals]                   = useState<GoalDraft[]>([]);
  const [services, setServices]             = useState<ServiceDraft[]>([]);
  const [complianceFlags, setComplianceFlags] = useState<string[]>([]);
  const [rawText, setRawText]               = useState("");
  const [extractedJson, setExtractedJson]   = useState<Record<string, unknown>>({});

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPhase("extracting");

    try {
      const fd = new FormData();
      fd.append("pdf", file);
      const res = await fetch("/api/extract-iep", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Extraction failed."); setPhase("idle"); return; }

      const ext = json.extracted ?? {};
      setExtractedJson(ext);
      setRawText(json.rawText ?? "");

      setStudentName(ext.student_name ?? "");
      setDistrictId(ext.district_id ?? "");
      setDob(ext.date_of_birth ?? "");
      setDisability(ext.disability_category ?? "");
      setGrade("");
      setStartDate(ext.start_date ?? "");
      setEndDate(ext.end_date ?? "");
      setCreationDate(ext.creation_date ?? "");
      setRevisionDate(ext.revision_date ?? "");
      setGoals(
        (ext.goals as GoalDraft[] | undefined)?.map((g) => ({
          title: g.title ?? "", baseline: g.baseline ?? "", target: g.target ?? "",
          timeframe: g.timeframe ?? "", target_date: g.target_date ?? "",
        })) ?? []
      );
      setServices(
        (ext.services as ServiceDraft[] | undefined)?.map((s) => ({
          type: s.type ?? "", frequency: s.frequency ?? "",
          duration: s.duration ?? "", provider: s.provider ?? "",
        })) ?? []
      );
      setComplianceFlags((ext.compliance_flags as string[]) ?? []);
      setPhase("review");
    } catch {
      setError("Network error. Please try again.");
      setPhase("idle");
    }
  }

  function updateGoal(i: number, field: keyof GoalDraft, val: string) {
    setGoals((prev) => prev.map((g, idx) => idx === i ? { ...g, [field]: val } : g));
  }
  function removeGoal(i: number) { setGoals((prev) => prev.filter((_, idx) => idx !== i)); }
  function addGoal() { setGoals((prev) => [...prev, { title: "", baseline: "", target: "", timeframe: "", target_date: "" }]); }

  function updateService(i: number, field: keyof ServiceDraft, val: string) {
    setServices((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }
  function removeService(i: number) { setServices((prev) => prev.filter((_, idx) => idx !== i)); }
  function addService() { setServices((prev) => [...prev, { type: "", frequency: "", duration: "", provider: "" }]); }

  async function handleCreate() {
    if (!studentName.trim() || !disability.trim() || !grade.trim()) {
      setError("Student name, disability category, and grade are required."); return;
    }
    setPhase("saving");
    setError("");
    try {
      const res = await fetch("/api/add-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName, district_id: districtId, date_of_birth: dob,
          disability_category: disability, grade,
          start_date: startDate, end_date: endDate,
          creation_date: creationDate, revision_date: revisionDate,
          goals, services, raw_document_text: rawText,
          ai_extracted_json: { ...extractedJson, compliance_flags: complianceFlags },
          compliance_flags: complianceFlags,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to create student."); setPhase("review"); return; }
      setNewStudentId(json.studentId);
      setPhase("done");
    } catch {
      setError("Network error. Please try again."); setPhase("review");
    }
  }

  const labelCls = "block text-xs font-semibold text-stone-500 mb-1";
  const inputCls = "w-full border border-sand rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-espresso-foam";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push("/students")} className="p-2 rounded-lg hover:bg-slate-100 text-stone-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-espresso-noir">Add New Student</h1>
          <p className="text-sm text-stone-500 mt-0.5">Upload an IEP PDF — AI will extract student information automatically</p>
        </div>
      </div>

      {/* PHASE: idle */}
      {phase === "idle" && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Upload size={48} className="text-slate-400" />
          <div className="text-center">
            <p className="text-lg font-semibold text-stone-700">Upload IEP PDF</p>
            <p className="text-sm text-stone-500 mt-1">Click to browse or drag and drop</p>
          </div>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        </div>
      )}

      {/* PHASE: extracting */}
      {phase === "extracting" && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 font-medium">Reading PDF and extracting IEP information…</p>
          <p className="text-xs text-slate-400">This usually takes 10–20 seconds</p>
        </div>
      )}

      {/* PHASE: review */}
      {phase === "review" && (
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Student Info */}
          <section className="bg-white rounded-2xl border border-sand p-6">
            <h2 className="font-semibold text-espresso-noir mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-500" /> Student Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} value={studentName} onChange={(e) => setStudentName(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>District / Student ID</label>
                <input className={inputCls} value={districtId} onChange={(e) => setDistrictId(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" className={inputCls} value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Disability Category *</label>
                <input className={inputCls} value={disability} onChange={(e) => setDisability(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Grade *</label>
                <input className={inputCls} placeholder="e.g. 3" value={grade} onChange={(e) => setGrade(e.target.value)} />
              </div>
            </div>
          </section>

          {/* IEP Dates */}
          <section className="bg-white rounded-2xl border border-sand p-6">
            <h2 className="font-semibold text-espresso-noir mb-4">IEP Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "IEP Start Date", val: startDate, set: setStartDate },
                { label: "IEP End Date",   val: endDate,   set: setEndDate },
                { label: "Creation Date",  val: creationDate, set: setCreationDate },
                { label: "Revision Date",  val: revisionDate, set: setRevisionDate },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <input type="date" className={inputCls} value={val} onChange={(e) => set(e.target.value)} />
                </div>
              ))}
            </div>
          </section>

          {/* Goals */}
          <section className="bg-white rounded-2xl border border-sand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-espresso-noir">Goals & Objectives ({goals.length})</h2>
              <button onClick={addGoal} className="flex items-center gap-1 text-sm text-cold-brew hover:text-blue-700">
                <PlusCircle size={15} /> Add Goal
              </button>
            </div>
            <div className="space-y-4">
              {goals.length === 0 && (
                <p className="text-sm text-slate-400 italic">No goals extracted. Add them manually.</p>
              )}
              {goals.map((g, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-4 bg-vanilla space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className={labelCls}>Goal Description</label>
                      <input className={inputCls} value={g.title} onChange={(e) => updateGoal(i, "title", e.target.value)} />
                    </div>
                    <button onClick={() => removeGoal(i)} className="text-slate-400 hover:text-red-500 mt-5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Baseline</label>
                      <input className={inputCls} value={g.baseline} onChange={(e) => updateGoal(i, "baseline", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Target</label>
                      <input className={inputCls} value={g.target} onChange={(e) => updateGoal(i, "target", e.target.value)} />
                    </div>
                    <div>
                      <label className={labelCls}>Timeframe</label>
                      <input className={inputCls} value={g.timeframe} onChange={(e) => updateGoal(i, "timeframe", e.target.value)} placeholder="e.g. Annual" />
                    </div>
                    <div>
                      <label className={labelCls}>Target Date</label>
                      <input type="date" className={inputCls} value={g.target_date} onChange={(e) => updateGoal(i, "target_date", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Services */}
          <section className="bg-white rounded-2xl border border-sand p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-espresso-noir">Services & Accommodations ({services.length})</h2>
              <button onClick={addService} className="flex items-center gap-1 text-sm text-cold-brew hover:text-blue-700">
                <PlusCircle size={15} /> Add Service
              </button>
            </div>
            <div className="space-y-4">
              {services.length === 0 && (
                <p className="text-sm text-slate-400 italic">No services extracted. Add them manually.</p>
              )}
              {services.map((s, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-4 bg-vanilla space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <label className={labelCls}>Service / Accommodation Type</label>
                      <input className={inputCls} value={s.type} onChange={(e) => updateService(i, "type", e.target.value)} />
                    </div>
                    <button onClick={() => removeService(i)} className="text-slate-400 hover:text-red-500 mt-5">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelCls}>Frequency</label>
                      <input className={inputCls} value={s.frequency} onChange={(e) => updateService(i, "frequency", e.target.value)} placeholder="e.g. 3x/week" />
                    </div>
                    <div>
                      <label className={labelCls}>Duration</label>
                      <input className={inputCls} value={s.duration} onChange={(e) => updateService(i, "duration", e.target.value)} placeholder="e.g. 45 min" />
                    </div>
                    <div>
                      <label className={labelCls}>Provider</label>
                      <input className={inputCls} value={s.provider} onChange={(e) => updateService(i, "provider", e.target.value)} placeholder="e.g. Ms. Rivera" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Compliance Flags */}
          {complianceFlags.length > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
              <button
                onClick={() => setShowFlags((v) => !v)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="font-semibold text-amber-800">
                  ⚠ AI-Detected Compliance Concerns ({complianceFlags.length})
                </h2>
                {showFlags ? <ChevronUp size={16} className="text-amber-600" /> : <ChevronDown size={16} className="text-amber-600" />}
              </button>
              {showFlags && (
                <ul className="mt-3 space-y-1">
                  {complianceFlags.map((f, i) => (
                    <li key={i} className="text-sm text-amber-700 flex gap-2">
                      <span className="mt-0.5">•</span> {f}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pb-8">
            <button
              onClick={() => { setPhase("idle"); if (fileRef.current) fileRef.current.value = ""; }}
              className="px-5 py-2.5 border border-sand rounded-xl text-slate-600 hover:bg-vanilla text-sm font-medium"
            >
              Re-upload PDF
            </button>
            <button
              onClick={handleCreate}
              className="px-6 py-2.5 bg-cold-brew text-vanilla rounded-xl hover:opacity-90 text-sm font-semibold shadow-sm"
            >
              Create Student
            </button>
          </div>
        </div>
      )}

      {/* PHASE: saving */}
      {phase === "saving" && (
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 size={48} className="text-blue-500 animate-spin" />
          <p className="text-slate-600 font-medium">Saving student to database…</p>
        </div>
      )}

      {/* PHASE: done */}
      {phase === "done" && (
        <div className="flex flex-col items-center gap-6 py-20">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-espresso-noir">Student Created!</p>
            <p className="text-stone-500 text-sm mt-1">{studentName} has been added to the system</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/students/${newStudentId}`)}
              className="px-6 py-2.5 bg-cold-brew text-vanilla rounded-xl hover:opacity-90 text-sm font-semibold shadow-sm"
            >
              View Student Profile
            </button>
            <button
              onClick={() => router.push("/students")}
              className="px-5 py-2.5 border border-sand rounded-xl text-slate-600 hover:bg-vanilla text-sm font-medium"
            >
              Back to Students
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
