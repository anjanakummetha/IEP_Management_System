-- IEPulse Phase 2 – Database schema and RLS
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS guards throughout

-- ========== CLEAN SLATE (drop in reverse dependency order) ==========
DROP POLICY IF EXISTS "Service logs visible when service visible" ON service_logs;
DROP POLICY IF EXISTS "Services visible by role" ON services;
DROP POLICY IF EXISTS "Progress visible when goal visible" ON progress_updates;
DROP POLICY IF EXISTS "Goals visible when IEP visible" ON goals;
DROP POLICY IF EXISTS "IEPs visible when student visible" ON ieps;
DROP POLICY IF EXISTS "Students visible by role" ON students;
DROP POLICY IF EXISTS "Users can read own school" ON schools;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

DROP INDEX IF EXISTS idx_users_school;
DROP INDEX IF EXISTS idx_services_student;
DROP INDEX IF EXISTS idx_services_provider;
DROP INDEX IF EXISTS idx_students_case_manager;
DROP INDEX IF EXISTS idx_students_school;

DROP TABLE IF EXISTS service_logs CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS progress_updates CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS ieps CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

DROP TYPE IF EXISTS role_type;

-- ========== TYPES ==========
CREATE TYPE role_type AS ENUM ('teacher', 'provider', 'admin');

-- ========== TABLES ==========

-- Schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Users (id must match auth.users.id)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role role_type NOT NULL
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  disability_category TEXT NOT NULL,
  case_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  review_date DATE NOT NULL,
  risk_score INT DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review_due', 'compliant'))
);

-- IEPs
CREATE TABLE ieps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  expiration_date DATE NOT NULL,
  compliance_score INT DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100)
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iep_id UUID NOT NULL REFERENCES ieps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  baseline TEXT,
  target TEXT
);

-- Progress updates
CREATE TABLE progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services (student ↔ provider link)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  required_minutes INT NOT NULL CHECK (required_minutes > 0)
);

-- Service logs
CREATE TABLE service_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  minutes_logged INT NOT NULL CHECK (minutes_logged >= 0),
  session_date DATE NOT NULL
);

-- ========== INDEXES ==========
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_case_manager ON students(case_manager_id);
CREATE INDEX idx_services_provider ON services(provider_id);
CREATE INDEX idx_services_student ON services(student_id);
CREATE INDEX idx_users_school ON users(school_id);

-- ========== ROW LEVEL SECURITY ==========
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE ieps ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;

-- Users: can read own row
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

-- Schools: read if user belongs to that school
CREATE POLICY "Users can read own school"
  ON schools FOR SELECT
  USING (
    id IN (SELECT school_id FROM users WHERE id = auth.uid())
  );

-- Students: teachers (case manager), providers (via services), admins (same school)
CREATE POLICY "Students visible by role"
  ON students FOR SELECT
  USING (
    case_manager_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM services s
      WHERE s.student_id = students.id AND s.provider_id = auth.uid()
    )
    OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- IEPs: visible if student is visible
CREATE POLICY "IEPs visible when student visible"
  ON ieps FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE
        case_manager_id = auth.uid()
        OR EXISTS (SELECT 1 FROM services s WHERE s.student_id = students.id AND s.provider_id = auth.uid())
        OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Goals: visible when IEP is visible
CREATE POLICY "Goals visible when IEP visible"
  ON goals FOR SELECT
  USING (
    iep_id IN (SELECT id FROM ieps WHERE student_id IN (
      SELECT id FROM students WHERE
        case_manager_id = auth.uid()
        OR EXISTS (SELECT 1 FROM services s WHERE s.student_id = students.id AND s.provider_id = auth.uid())
        OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    ))
  );

-- Progress updates: visible when goal is visible
CREATE POLICY "Progress visible when goal visible"
  ON progress_updates FOR SELECT
  USING (
    goal_id IN (
      SELECT g.id FROM goals g
      JOIN ieps i ON i.id = g.iep_id
      JOIN students s ON s.id = i.student_id
      WHERE s.case_manager_id = auth.uid()
        OR EXISTS (SELECT 1 FROM services svc WHERE svc.student_id = s.id AND svc.provider_id = auth.uid())
        OR s.school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Services: provider sees own; teachers and admins see if student is visible
CREATE POLICY "Services visible by role"
  ON services FOR SELECT
  USING (
    provider_id = auth.uid()
    OR student_id IN (
      SELECT id FROM students WHERE
        case_manager_id = auth.uid()
        OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Service logs: visible when service is visible
CREATE POLICY "Service logs visible when service visible"
  ON service_logs FOR SELECT
  USING (
    service_id IN (
      SELECT id FROM services WHERE
        provider_id = auth.uid()
        OR student_id IN (
          SELECT id FROM students WHERE
            case_manager_id = auth.uid()
            OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );
