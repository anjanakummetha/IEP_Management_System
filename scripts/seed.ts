/**
 * EveryLearner – Demo seed (v3)
 * Run AFTER applying supabase/schema.sql in the Supabase SQL Editor.
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Run: npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { config } from "dotenv";
import { calculateCompliance } from "../lib/complianceUtils";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const PASSWORD = "demo-password-1";
const YEAR = new Date().getFullYear();
const PREV = YEAR - 1;

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

async function getOrCreateAuthUser(email: string, fullName: string): Promise<string> {
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, { password: PASSWORD });
    console.log(`  ↩  Reused: ${email}`);
    return existing.id;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`Auth user ${email}: ${error.message}`);
  return data.user.id;
}

async function seed() {
  console.log("EveryLearner – seeding demo data (v3)…\n");

  // ── School ─────────────────────────────────────────────────────────────────
  const { data: school, error: schoolErr } = await supabase
    .from("schools").insert({ name: "Riverside Elementary" }).select("id").single();
  if (schoolErr) throw new Error(`School: ${schoolErr.message}`);
  const schoolId = school.id;
  console.log("✓ School: Riverside Elementary");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminId   = await getOrCreateAuthUser("admin@demo.edu",   "Alex Admin");
  const teacherId = await getOrCreateAuthUser("teacher@demo.edu", "Jordan Teacher");
  await supabase.from("users").insert([
    { id: adminId,   school_id: schoolId, full_name: "Alex Admin",     role: "admin"   },
    { id: teacherId, school_id: schoolId, full_name: "Jordan Teacher", role: "teacher" },
  ]);
  console.log("✓ Users: Alex Admin, Jordan Teacher");

  // ── Students ───────────────────────────────────────────────────────────────
  const studentDefs = [
    { name: "Morgan Lee",     district_id: "RSE-2021-001", dob: "2015-03-12",
      grade: "3", disability: "SLD",   review: `${YEAR}-04-15`, riskScore: 0 },
    { name: "Riley Chen",     district_id: "RSE-2019-042", dob: "2013-07-28",
      grade: "5", disability: "OHI",   review: `${YEAR}-03-08`, riskScore: 0 },
    { name: "Casey Williams", district_id: "RSE-2022-017", dob: "2016-11-05",
      grade: "2", disability: "Autism",review: `${YEAR}-06-20`, riskScore: 0 },
    { name: "Taylor Brown",   district_id: "RSE-2020-088", dob: "2014-09-22",
      grade: "4", disability: "SLD",   review: `${PREV}-11-30`, riskScore: 0 },
  ];

  const { data: students, error: studentsErr } = await supabase
    .from("students")
    .insert(studentDefs.map((s) => ({
      school_id: schoolId, name: s.name, district_id: s.district_id,
      date_of_birth: s.dob, grade: s.grade, disability_category: s.disability,
      case_manager_id: teacherId, review_date: s.review,
      compliance_risk_score: 0, compliance_risk_reasons: [],
    })))
    .select("id, name");
  if (studentsErr) throw new Error(`Students: ${studentsErr.message}`);
  const [morgan, riley, casey, taylor] = students!;
  console.log("✓ 4 students");

  // ── Helper: build IEP + goals + services + progress ────────────────────────
  async function buildIEP(
    studentId: string,
    iep: { start: string; end: string; creation: string },
    goals: Array<{ title: string; baseline: string; target: string; timeframe: string; targetDate: string; scores: Array<{ score: number; ago: number }> }>,
    services: Array<{ type: string; frequency: string; duration: string; provider: string }>,
    aiFlags: string[]
  ) {
    const { data: iepRow } = await supabase.from("ieps").insert({
      student_id: studentId,
      start_date: iep.start, end_date: iep.end, creation_date: iep.creation,
      revision_date: null, raw_document_text: null, ai_extracted_json: null,
    }).select("id").single();
    if (!iepRow) return;

    const allGoalIds: string[] = [];
    for (const g of goals) {
      const { data: goalRow } = await supabase.from("goals").insert({
        iep_id: iepRow.id, title: g.title, baseline: g.baseline,
        target: g.target, timeframe: g.timeframe, target_date: g.targetDate,
      }).select("id").single();
      if (goalRow) {
        allGoalIds.push(goalRow.id);
        if (g.scores.length > 0) {
          await supabase.from("progress_updates").insert(
            g.scores.map(({ score, ago }) => ({ goal_id: goalRow.id, score, recorded_at: monthsAgo(ago) }))
          );
        }
      }
    }
    if (services.length > 0) {
      await supabase.from("services_accommodations").insert(
        services.map((s) => ({ iep_id: iepRow.id, ...s }))
      );
    }

    // Calculate compliance and update student
    const lastProgress = goals.flatMap(g => g.scores).sort((a, b) => a.ago - b.ago)[0];
    const lastProgressDate = lastProgress
      ? new Date(Date.now() - lastProgress.ago * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const { score, reasons } = calculateCompliance({
      iepEndDate: iep.end,
      iepStartDate: iep.start,
      goals: goals.map(g => ({ baseline: g.baseline, target: g.target })),
      services,
      lastProgressNoteDate: lastProgressDate,
      aiFlags,
    });
    await supabase.from("students").update({
      compliance_risk_score: score,
      compliance_risk_reasons: reasons,
    }).eq("id", studentId);
  }

  // ── Morgan Lee – SLD, Grade 3 ───────────────────────────────────────────────
  await buildIEP(morgan.id,
    { start: `${PREV}-09-01`, end: `${YEAR}-04-15`, creation: `${PREV}-08-20` },
    [
      { title: "Reading Comprehension", baseline: "42", target: "80", timeframe: "Annual",
        targetDate: `${YEAR}-04-15`,
        scores: [{ score: 45, ago: 5 }, { score: 51, ago: 4 }, { score: 57, ago: 3 }, { score: 63, ago: 2 }, { score: 69, ago: 1 }] },
      { title: "Math Problem Solving", baseline: "48", target: "75", timeframe: "Annual",
        targetDate: `${YEAR}-04-15`,
        scores: [{ score: 50, ago: 4 }, { score: 55, ago: 3 }, { score: 60, ago: 2 }, { score: 64, ago: 1 }] },
      { title: "Oral Expression", baseline: "35", target: "70", timeframe: "Semester",
        targetDate: `${YEAR}-02-15`,
        scores: [{ score: 38, ago: 3 }, { score: 44, ago: 2 }, { score: 50, ago: 1 }] },
    ],
    [
      { type: "Reading Specialist Support", frequency: "3x per week", duration: "45 min", provider: "Ms. Rivera" },
      { type: "Speech-Language Therapy",   frequency: "2x per week", duration: "30 min", provider: "Mr. Kim" },
    ],
    []
  );
  await supabase.from("progress_notes").insert([
    { student_id: morgan.id, created_by: teacherId, note: "Morgan is making excellent progress in reading. Completed grade-level comprehension passages with 80% accuracy this week.", created_at: monthsAgo(1) },
    { student_id: morgan.id, created_by: teacherId, note: "Math problem solving has improved. Morgan now attempts multi-step word problems independently.", created_at: monthsAgo(2) },
  ]);
  console.log("✓ Morgan Lee – IEP, 3 goals, 2 services, 2 notes");

  // ── Riley Chen – OHI, Grade 5 ──────────────────────────────────────────────
  await buildIEP(riley.id,
    { start: `${PREV}-09-01`, end: `${YEAR}-03-08`, creation: `${PREV}-08-25` },
    [
      { title: "Reading Fluency", baseline: "55", target: "85", timeframe: "Annual",
        targetDate: `${YEAR}-03-08`,
        scores: [{ score: 57, ago: 4 }, { score: 59, ago: 3 }, { score: 61, ago: 2 }] },
      { title: "Written Expression", baseline: "40", target: "72", timeframe: "Annual",
        targetDate: `${YEAR}-03-08`,
        scores: [{ score: 42, ago: 3 }, { score: 45, ago: 2 }, { score: 47, ago: 1 }] },
      { title: "Attention & Task Completion", baseline: "30", target: "75", timeframe: "Semester",
        targetDate: `${YEAR}-01-31`,
        scores: [{ score: 33, ago: 2 }, { score: 38, ago: 1 }] },
    ],
    [
      { type: "504 Accommodations – Extended Time", frequency: "All assessments", duration: "1.5x", provider: "General Education" },
      { type: "Occupational Therapy", frequency: "1x per week", duration: "30 min", provider: "Ms. Patel" },
    ],
    []
  );
  await supabase.from("progress_notes").insert([
    { student_id: riley.id, created_by: teacherId, note: "Riley struggled with attention during the writing assessment. Extended time was provided. Parent contacted.", created_at: monthsAgo(1) },
  ]);
  console.log("✓ Riley Chen – IEP, 3 goals, 2 services, 1 note");

  // ── Casey Williams – Autism, Grade 2 ───────────────────────────────────────
  await buildIEP(casey.id,
    { start: `${PREV}-09-01`, end: `${YEAR}-06-20`, creation: `${PREV}-08-18` },
    [
      { title: "Social Communication", baseline: "25", target: "70", timeframe: "Annual",
        targetDate: `${YEAR}-06-20`,
        scores: [{ score: 30, ago: 5 }, { score: 38, ago: 4 }, { score: 46, ago: 3 }, { score: 54, ago: 2 }, { score: 60, ago: 1 }] },
      { title: "Daily Living Skills",  baseline: "40", target: "80", timeframe: "Annual",
        targetDate: `${YEAR}-06-20`,
        scores: [{ score: 46, ago: 4 }, { score: 54, ago: 3 }, { score: 62, ago: 2 }, { score: 68, ago: 1 }] },
      { title: "Fine Motor Skills",    baseline: "50", target: "85", timeframe: "Semester",
        targetDate: `${YEAR}-02-28`,
        scores: [{ score: 57, ago: 3 }, { score: 63, ago: 2 }, { score: 70, ago: 1 }] },
    ],
    [
      { type: "Applied Behavior Analysis (ABA)", frequency: "5x per week", duration: "60 min", provider: "ABA Specialists Inc." },
      { type: "Occupational Therapy",            frequency: "2x per week", duration: "45 min", provider: "Ms. Patel" },
      { type: "Social Skills Group",             frequency: "2x per week", duration: "30 min", provider: "School Counselor" },
    ],
    []
  );
  await supabase.from("progress_notes").insert([
    { student_id: casey.id, created_by: teacherId, note: "Casey initiated conversation with two peers during lunch unprompted — a major milestone! Social communication skills are strengthening.", created_at: monthsAgo(1) },
    { student_id: casey.id, created_by: teacherId, note: "Fine motor skills showing strong improvement. Casey can now button shirt and use scissors with moderate assistance.", created_at: monthsAgo(2) },
    { student_id: casey.id, created_by: teacherId, note: "Daily living skills practice going well. Casey follows a 5-step routine independently.", created_at: monthsAgo(3) },
  ]);
  console.log("✓ Casey Williams – IEP, 3 goals, 3 services, 3 notes");

  // ── Taylor Brown – SLD, Grade 4 – HIGH RISK (overdue, stale) ──────────────
  await buildIEP(taylor.id,
    { start: `${PREV}-09-01`, end: `${PREV}-11-30`, creation: `${PREV}-08-22` },
    [
      { title: "Reading Comprehension", baseline: "38", target: "78", timeframe: "Annual",
        targetDate: `${PREV}-11-30`,
        scores: [{ score: 41, ago: 7 }] },
      { title: "Math Computation", baseline: "44", target: "76", timeframe: "Annual",
        targetDate: `${PREV}-11-30`,
        scores: [{ score: 46, ago: 6 }] },
    ],
    [
      { type: "Resource Room – Reading", frequency: "Daily", duration: "45 min", provider: "Jordan Teacher" },
    ],
    [
      "IEP end date has passed — annual review required immediately",
      "No progress documented in over 60 days — IDEA requires regular progress monitoring",
    ]
  );
  console.log("✓ Taylor Brown – IEP, 2 goals, 1 service, HIGH RISK");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(54));
  console.log("  DEMO LOGINS  (password: demo-password-1)");
  console.log("═".repeat(54));
  console.log("  Teacher  →  teacher@demo.edu");
  console.log("  Admin    →  admin@demo.edu");
  console.log("═".repeat(54));
  console.log("\nStudent roster:");
  console.log("  Morgan Lee     · Grade 3 · SLD    · Low risk");
  console.log("  Riley Chen     · Grade 5 · OHI    · Medium risk");
  console.log("  Casey Williams · Grade 2 · Autism · Low risk");
  console.log("  Taylor Brown   · Grade 4 · SLD    · HIGH risk ⚠");
  console.log("");
}

seed().catch((err) => { console.error(err); process.exit(1); });
