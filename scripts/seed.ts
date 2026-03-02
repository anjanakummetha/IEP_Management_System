/**
 * EveryLearner – Demo seed (v4)
 * Two teachers with split caseloads so admin vs teacher views differ clearly.
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
  console.log("EveryLearner – seeding demo data (v4)…\n");

  // ── School ─────────────────────────────────────────────────────────────────
  const { data: school, error: schoolErr } = await supabase
    .from("schools").insert({ name: "Riverside Elementary" }).select("id").single();
  if (schoolErr) throw new Error(`School: ${schoolErr.message}`);
  const schoolId = school.id;
  console.log("✓ School: Riverside Elementary");

  // ── Users: 1 admin + 2 teachers ────────────────────────────────────────────
  const adminId    = await getOrCreateAuthUser("admin@demo.edu",    "Alex Admin");
  const teacher1Id = await getOrCreateAuthUser("teacher@demo.edu",  "Jordan Teacher");
  const teacher2Id = await getOrCreateAuthUser("teacher2@demo.edu", "Sam Rivera");

  await supabase.from("users").insert([
    { id: adminId,    school_id: schoolId, full_name: "Alex Admin",     role: "admin"   },
    { id: teacher1Id, school_id: schoolId, full_name: "Jordan Teacher", role: "teacher" },
    { id: teacher2Id, school_id: schoolId, full_name: "Sam Rivera",     role: "teacher" },
  ]);
  console.log("✓ Users: Alex Admin, Jordan Teacher, Sam Rivera");

  // ── Students ───────────────────────────────────────────────────────────────
  // Jordan Teacher (teacher@demo.edu) → Morgan Lee, Taylor Brown
  // Sam Rivera   (teacher2@demo.edu) → Riley Chen, Casey Williams
  const { data: students, error: studentsErr } = await supabase
    .from("students")
    .insert([
      // Jordan's caseload
      { school_id: schoolId, name: "Morgan Lee",     district_id: "RSE-2021-001",
        date_of_birth: "2015-03-12", grade: "3", disability_category: "SLD",
        case_manager_id: teacher1Id, review_date: `${YEAR}-04-15`,
        compliance_risk_score: 0, compliance_risk_reasons: [] },
      { school_id: schoolId, name: "Taylor Brown",   district_id: "RSE-2020-088",
        date_of_birth: "2014-09-22", grade: "4", disability_category: "SLD",
        case_manager_id: teacher1Id, review_date: `${PREV}-11-30`,
        compliance_risk_score: 0, compliance_risk_reasons: [] },
      // Sam's caseload
      { school_id: schoolId, name: "Riley Chen",     district_id: "RSE-2019-042",
        date_of_birth: "2013-07-28", grade: "5", disability_category: "OHI",
        case_manager_id: teacher2Id, review_date: `${YEAR}-03-08`,
        compliance_risk_score: 0, compliance_risk_reasons: [] },
      { school_id: schoolId, name: "Casey Williams", district_id: "RSE-2022-017",
        date_of_birth: "2016-11-05", grade: "2", disability_category: "Autism",
        case_manager_id: teacher2Id, review_date: `${YEAR}-06-20`,
        compliance_risk_score: 0, compliance_risk_reasons: [] },
    ])
    .select("id, name");
  if (studentsErr) throw new Error(`Students: ${studentsErr.message}`);
  const [morgan, taylor, riley, casey] = students!;
  console.log("✓ 4 students (2 per teacher)");

  // ── Helper: build IEP + goals + services + progress ────────────────────────
  async function buildIEP(
    studentId: string,
    teacherId: string,
    iep: { start: string; end: string; creation: string },
    goals: Array<{ title: string; baseline: string; target: string; timeframe: string; targetDate: string; scores: Array<{ score: number; ago: number }> }>,
    services: Array<{ type: string; frequency: string; duration: string; provider: string }>,
    notes: string[],
    aiFlags: string[]
  ) {
    const { data: iepRow } = await supabase.from("ieps").insert({
      student_id: studentId,
      start_date: iep.start, end_date: iep.end, creation_date: iep.creation,
      revision_date: null, raw_document_text: null, ai_extracted_json: null,
    }).select("id").single();
    if (!iepRow) return;

    for (const g of goals) {
      const { data: goalRow } = await supabase.from("goals").insert({
        iep_id: iepRow.id, title: g.title, baseline: g.baseline,
        target: g.target, timeframe: g.timeframe, target_date: g.targetDate,
      }).select("id").single();
      if (goalRow && g.scores.length > 0) {
        await supabase.from("progress_updates").insert(
          g.scores.map(({ score, ago }) => ({ goal_id: goalRow.id, score, recorded_at: monthsAgo(ago) }))
        );
      }
    }

    if (services.length > 0) {
      await supabase.from("services_accommodations").insert(
        services.map((s) => ({ iep_id: iepRow.id, ...s }))
      );
    }

    if (notes.length > 0) {
      await supabase.from("progress_notes").insert(
        notes.map((note, i) => ({
          student_id: studentId, created_by: teacherId,
          note, created_at: monthsAgo(i + 1),
        }))
      );
    }

    // Calculate & store compliance risk
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

  // ═══════════════════════════════════════════════════════════════════════════
  // JORDAN's caseload  (teacher@demo.edu)
  // ═══════════════════════════════════════════════════════════════════════════

  // Morgan Lee – SLD, Grade 3 – Low risk, good progress
  await buildIEP(morgan.id, teacher1Id,
    { start: `${PREV}-09-01`, end: `${YEAR}-04-15`, creation: `${PREV}-08-20` },
    [
      { title: "Reading Comprehension", baseline: "42", target: "80", timeframe: "Annual",
        targetDate: `${YEAR}-04-15`,
        scores: [{ score: 45, ago: 5 }, { score: 51, ago: 4 }, { score: 57, ago: 3 }, { score: 63, ago: 2 }, { score: 69, ago: 1 }] },
      { title: "Math Problem Solving",  baseline: "48", target: "75", timeframe: "Annual",
        targetDate: `${YEAR}-04-15`,
        scores: [{ score: 50, ago: 4 }, { score: 55, ago: 3 }, { score: 60, ago: 2 }, { score: 64, ago: 1 }] },
      { title: "Oral Expression",       baseline: "35", target: "70", timeframe: "Semester",
        targetDate: `${YEAR}-02-15`,
        scores: [{ score: 38, ago: 3 }, { score: 44, ago: 2 }, { score: 50, ago: 1 }] },
    ],
    [
      { type: "Reading Specialist Support", frequency: "3x per week", duration: "45 min", provider: "Ms. Rivera" },
      { type: "Speech-Language Therapy",    frequency: "2x per week", duration: "30 min", provider: "Mr. Kim" },
    ],
    [
      "Morgan is making excellent progress in reading. Completed grade-level passages with 80% accuracy this week.",
      "Math problem solving has improved. Morgan now attempts multi-step word problems independently.",
    ],
    []
  );
  console.log("✓ Morgan Lee (Jordan) – 3 goals, 2 services, 2 notes · Low risk");

  // Taylor Brown – SLD, Grade 4 – HIGH RISK (review overdue, stale)
  await buildIEP(taylor.id, teacher1Id,
    { start: `${PREV}-09-01`, end: `${PREV}-11-30`, creation: `${PREV}-08-22` },
    [
      { title: "Reading Comprehension", baseline: "38", target: "78", timeframe: "Annual",
        targetDate: `${PREV}-11-30`,
        scores: [{ score: 41, ago: 7 }] },
      { title: "Math Computation",      baseline: "44", target: "76", timeframe: "Annual",
        targetDate: `${PREV}-11-30`,
        scores: [{ score: 46, ago: 6 }] },
    ],
    [
      { type: "Resource Room – Reading", frequency: "Daily", duration: "45 min", provider: "Jordan Teacher" },
    ],
    [],
    [
      "IEP end date has passed — annual review required immediately",
      "No progress documented in over 60 days — IDEA requires regular progress monitoring",
    ]
  );
  console.log("✓ Taylor Brown (Jordan) – 2 goals, 1 service, 0 notes · HIGH risk ⚠");

  // ═══════════════════════════════════════════════════════════════════════════
  // SAM's caseload  (teacher2@demo.edu)
  // ═══════════════════════════════════════════════════════════════════════════

  // Riley Chen – OHI, Grade 5 – Medium risk (review approaching)
  await buildIEP(riley.id, teacher2Id,
    { start: `${PREV}-09-01`, end: `${YEAR}-03-08`, creation: `${PREV}-08-25` },
    [
      { title: "Reading Fluency",             baseline: "55", target: "85", timeframe: "Annual",
        targetDate: `${YEAR}-03-08`,
        scores: [{ score: 57, ago: 4 }, { score: 59, ago: 3 }, { score: 61, ago: 2 }] },
      { title: "Written Expression",          baseline: "40", target: "72", timeframe: "Annual",
        targetDate: `${YEAR}-03-08`,
        scores: [{ score: 42, ago: 3 }, { score: 45, ago: 2 }, { score: 47, ago: 1 }] },
      { title: "Attention & Task Completion", baseline: "30", target: "75", timeframe: "Semester",
        targetDate: `${YEAR}-01-31`,
        scores: [{ score: 33, ago: 2 }, { score: 38, ago: 1 }] },
    ],
    [
      { type: "504 Accommodations – Extended Time", frequency: "All assessments", duration: "1.5x",   provider: "General Education" },
      { type: "Occupational Therapy",               frequency: "1x per week",     duration: "30 min", provider: "Ms. Patel" },
    ],
    [
      "Riley struggled with attention during the writing assessment. Extended time was provided. Parent contacted.",
    ],
    []
  );
  console.log("✓ Riley Chen (Sam) – 3 goals, 2 services, 1 note · Medium risk");

  // Casey Williams – Autism, Grade 2 – Low risk, strong progress
  await buildIEP(casey.id, teacher2Id,
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
    [
      "Casey initiated conversation with two peers during lunch unprompted — a major milestone!",
      "Fine motor skills showing strong improvement. Casey can now button shirt and use scissors with moderate assistance.",
      "Daily living skills practice going well. Casey follows a 5-step routine independently.",
    ],
    []
  );
  console.log("✓ Casey Williams (Sam) – 3 goals, 3 services, 3 notes · Low risk");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n" + "═".repeat(60));
  console.log("  DEMO LOGINS  (password: demo-password-1)");
  console.log("═".repeat(60));
  console.log("  Admin      →  admin@demo.edu       (sees all 4 students)");
  console.log("  Teacher 1  →  teacher@demo.edu     (sees Morgan + Taylor)");
  console.log("  Teacher 2  →  teacher2@demo.edu    (sees Riley + Casey)");
  console.log("═".repeat(60));
  console.log("\nStudent roster:");
  console.log("  Morgan Lee     · Grade 3 · SLD    · Jordan · Low risk");
  console.log("  Taylor Brown   · Grade 4 · SLD    · Jordan · HIGH risk ⚠");
  console.log("  Riley Chen     · Grade 5 · OHI    · Sam    · Medium risk");
  console.log("  Casey Williams · Grade 2 · Autism · Sam    · Low risk");
  console.log("");
}

seed().catch((err) => { console.error(err); process.exit(1); });
