-- EveryLearner – Full schema (v3)
-- Safe to re-run: drops all tables in reverse dependency order, then recreates.

-- ========== CLEAN SLATE ==========
-- Drop tables in reverse dependency order (CASCADE removes policies + indexes automatically)
DROP TABLE IF EXISTS progress_notes          CASCADE;
DROP TABLE IF EXISTS services_accommodations CASCADE;
DROP TABLE IF EXISTS progress_updates        CASCADE;
DROP TABLE IF EXISTS goals                   CASCADE;
DROP TABLE IF EXISTS ieps                    CASCADE;
DROP TABLE IF EXISTS students                CASCADE;
DROP TABLE IF EXISTS users                   CASCADE;
DROP TABLE IF EXISTS schools                 CASCADE;

DROP TYPE IF EXISTS role_type;

-- ========== TYPES ==========
CREATE TYPE role_type AS ENUM ('teacher', 'admin');

-- ========== TABLES ==========

CREATE TABLE schools (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE users (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role      role_type NOT NULL
);

CREATE TABLE students (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id               UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  district_id             TEXT,
  date_of_birth           DATE,
  grade                   TEXT NOT NULL,
  disability_category     TEXT NOT NULL,
  case_manager_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  review_date             DATE NOT NULL,
  compliance_risk_score   INT DEFAULT 0 CHECK (compliance_risk_score >= 0 AND compliance_risk_score <= 100),
  compliance_risk_reasons TEXT[] DEFAULT '{}'
);

CREATE TABLE ieps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  start_date        DATE,
  end_date          DATE,
  creation_date     DATE,
  revision_date     DATE,
  raw_document_text TEXT,
  ai_extracted_json JSONB
);

CREATE TABLE goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iep_id      UUID NOT NULL REFERENCES ieps(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  baseline    TEXT,
  target      TEXT,
  timeframe   TEXT,
  target_date DATE
);

CREATE TABLE progress_updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  score       NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE services_accommodations (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  iep_id    UUID NOT NULL REFERENCES ieps(id) ON DELETE CASCADE,
  type      TEXT NOT NULL,
  frequency TEXT,
  duration  TEXT,
  provider  TEXT
);

-- Teacher progress notes (general, per-student)
CREATE TABLE progress_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== INDEXES ==========
CREATE INDEX idx_students_school       ON students(school_id);
CREATE INDEX idx_students_case_manager ON students(case_manager_id);
CREATE INDEX idx_users_school          ON users(school_id);

-- ========== ROW LEVEL SECURITY ==========
ALTER TABLE schools               ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE students              ENABLE ROW LEVEL SECURITY;
ALTER TABLE ieps                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_updates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_notes        ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT USING (id = auth.uid());

-- Schools: own school only
CREATE POLICY "Users can read own school"
  ON schools FOR SELECT
  USING (id IN (SELECT school_id FROM users WHERE id = auth.uid()));

-- Students: teacher → caseload; admin → whole school
CREATE POLICY "Students visible by role"
  ON students FOR SELECT
  USING (
    case_manager_id = auth.uid()
    OR school_id IN (
      SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- IEPs: same visibility as students
CREATE POLICY "IEPs visible when student visible"
  ON ieps FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE
        case_manager_id = auth.uid()
        OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Goals: same visibility as IEPs
CREATE POLICY "Goals visible when IEP visible"
  ON goals FOR SELECT
  USING (
    iep_id IN (
      SELECT id FROM ieps WHERE student_id IN (
        SELECT id FROM students WHERE
          case_manager_id = auth.uid()
          OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Progress updates: same as goals
CREATE POLICY "Progress visible when goal visible"
  ON progress_updates FOR SELECT
  USING (
    goal_id IN (
      SELECT g.id FROM goals g
      JOIN ieps i     ON i.id = g.iep_id
      JOIN students s ON s.id = i.student_id
      WHERE s.case_manager_id = auth.uid()
        OR s.school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );

-- Services & Accommodations: same as IEPs
CREATE POLICY "Services accommodations visible"
  ON services_accommodations FOR SELECT
  USING (
    iep_id IN (
      SELECT id FROM ieps WHERE student_id IN (
        SELECT id FROM students WHERE
          case_manager_id = auth.uid()
          OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Progress notes: teacher → own students; admin → whole school
CREATE POLICY "Progress notes visible by role"
  ON progress_notes FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE
        case_manager_id = auth.uid()
        OR school_id IN (SELECT school_id FROM users WHERE id = auth.uid() AND role = 'admin')
    )
  );
