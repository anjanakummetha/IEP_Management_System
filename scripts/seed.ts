/**
 * Demo seed: 1 Teacher, 1 Administrator, 1 Service Provider
 *
 * Run after applying supabase/schema.sql in the Supabase SQL Editor.
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Run: npm run seed
 *
 * Who sees what (enforced by RLS):
 * - Teacher (case manager): sees all 4 students (owns their IEPs)
 * - Provider: sees only 2 students (those they have services for)
 * - Admin: sees all 4 students + school-wide oversight
 */

import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const PASSWORD = "demo-password-1";

async function createAuthUser(email: string, fullName: string) {
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
  console.log("Seeding demo: 1 Teacher, 1 Admin, 1 Service Provider...\n");

  // 1. School
  const { data: school, error: schoolErr } = await supabase
    .from("schools")
    .insert({ name: "Demo School" })
    .select("id")
    .single();
  if (schoolErr) throw new Error(`School: ${schoolErr.message}`);
  const schoolId = school.id;
  console.log("✓ School created");

  // 2. Three users: Admin, Teacher (case manager), Provider
  const adminId = await createAuthUser("admin@demo.edu", "Alex Admin");
  const teacherId = await createAuthUser("teacher@demo.edu", "Jordan Teacher");
  const providerId = await createAuthUser("provider@demo.edu", "Sam Provider");

  await supabase.from("users").insert([
    { id: adminId, school_id: schoolId, full_name: "Alex Admin", role: "admin" },
    { id: teacherId, school_id: schoolId, full_name: "Jordan Teacher", role: "teacher" },
    { id: providerId, school_id: schoolId, full_name: "Sam Provider", role: "provider" },
  ]);
  console.log("✓ Users: 1 admin, 1 teacher, 1 service provider");

  // 3. Students — all owned by the teacher (case_manager_id)
  const { data: students, error: studentsErr } = await supabase
    .from("students")
    .insert([
      { school_id: schoolId, name: "Morgan Lee", grade: "3", disability_category: "SLD", case_manager_id: teacherId, review_date: "2025-04-15", risk_score: 18, status: "active" },
      { school_id: schoolId, name: "Riley Chen", grade: "5", disability_category: "OHI", case_manager_id: teacherId, review_date: "2025-03-08", risk_score: 42, status: "review_due" },
      { school_id: schoolId, name: "Casey Williams", grade: "2", disability_category: "Autism", case_manager_id: teacherId, review_date: "2025-06-20", risk_score: 8, status: "compliant" },
      { school_id: schoolId, name: "Taylor Brown", grade: "4", disability_category: "SLD", case_manager_id: teacherId, review_date: "2025-02-28", risk_score: 55, status: "review_due" },
    ])
    .select("id");
  if (studentsErr) throw new Error(`Students: ${studentsErr.message}`);
  const studentIds = students!.map((s) => s.id);
  console.log("✓ 4 students (case manager = teacher)");

  // 4. IEPs + goals (teacher “owns” the plan); progress_updates (provider enters data)
  const allGoalIds: string[] = [];
  for (let i = 0; i < studentIds.length; i++) {
    const { data: iep } = await supabase
      .from("ieps")
      .insert({ student_id: studentIds[i], expiration_date: "2025-12-31", compliance_score: 20 + i * 10 })
      .select("id")
      .single();
    if (iep) {
      const { data: goals } = await supabase
        .from("goals")
        .insert([
          { iep_id: iep.id, title: "Reading Comprehension", baseline: "45", target: "80" },
          { iep_id: iep.id, title: "Math Problem Solving", baseline: "52", target: "75" },
        ])
        .select("id");
      if (goals) allGoalIds.push(...goals.map((g) => g.id));
    }
  }
  console.log("✓ IEPs and goals (per student)");

  // Progress updates (provider logs goal progress) — first 3 goals get sample data
  if (allGoalIds.length >= 3) {
    await supabase.from("progress_updates").insert([
      { goal_id: allGoalIds[0], score: 58, recorded_at: "2025-01-15T10:00:00Z" },
      { goal_id: allGoalIds[0], score: 65, recorded_at: "2025-02-01T10:00:00Z" },
      { goal_id: allGoalIds[0], score: 72, recorded_at: "2025-02-15T10:00:00Z" },
      { goal_id: allGoalIds[1], score: 55, recorded_at: "2025-01-20T10:00:00Z" },
      { goal_id: allGoalIds[2], score: 60, recorded_at: "2025-02-10T10:00:00Z" },
    ]);
    console.log("✓ Progress updates (sample provider-entered goal data)");
  }

  // 5. Services: provider is linked to 2 students only (RLS: provider sees only these)
  const { data: services } = await supabase
    .from("services")
    .insert([
      { student_id: studentIds[0], provider_id: providerId, required_minutes: 120 },
      { student_id: studentIds[1], provider_id: providerId, required_minutes: 90 },
    ])
    .select("id");
  console.log("✓ Services: provider delivers to 2 students (Morgan, Riley)");

  // 6. Service logs (provider “delivers” and logs)
  if (services?.length) {
    await supabase.from("service_logs").insert([
      { service_id: services[0].id, minutes_logged: 30, session_date: "2025-02-15" },
      { service_id: services[0].id, minutes_logged: 45, session_date: "2025-02-22" },
      { service_id: services[1].id, minutes_logged: 30, session_date: "2025-02-20" },
    ]);
    console.log("✓ Service logs (provider session minutes)");
  }

  console.log("\n" + "—".repeat(50));
  console.log("DEMO LOGINS (password for all: demo-password-1)");
  console.log("—".repeat(50));
  console.log("  Teacher (case manager):  teacher@demo.edu");
  console.log("  Administrator:           admin@demo.edu");
  console.log("  Service Provider:        provider@demo.edu");
  console.log("—".repeat(50));
  console.log("\nWhat each role sees:");
  console.log("  • Teacher: 4 students (full caseload), IEPs, goals, compliance");
  console.log("  • Provider: 2 students (Morgan Lee, Riley Chen) — only assigned via services");
  console.log("  • Admin: all 4 students + school-wide view");
  console.log("");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
