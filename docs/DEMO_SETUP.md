# Demo Setup: 1 Teacher, 1 Admin, 1 Service Provider

This guide sets up the database with three demo users so you can see how **Teacher**, **Administrator**, and **Service Provider** roles work in IEPulse.

---

## Step 1: Apply the schema (one-time)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Copy the contents of **`supabase/schema.sql`** and run it.  
   This creates tables (`schools`, `users`, `students`, `ieps`, `goals`, `services`, `service_logs`) and Row Level Security (RLS) policies.

---

## Step 2: Add your service role key

1. In Supabase: **Settings** → **API**.
2. Copy the **service_role** key (secret; never use in frontend).
3. In your project root, open **`.env.local`** and add:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```
   You should already have:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## Step 3: Run the seed

From the project root:

```bash
npm run seed
```

This creates:

- **1 school** (Demo School)
- **3 users** in Auth + `public.users`:
  - 1 **Administrator**
  - 1 **Teacher** (case manager)
  - 1 **Service Provider**
- **4 students** (all with the teacher as case manager)
- **IEPs and goals** for each student
- **Services** linking the **provider** to **2 of the 4 students**
- **Service logs** (session minutes) for those 2 students

---

## Demo logins

**Password for all:** `demo-password-1`

| Role              | Email             | What they see |
|-------------------|-------------------|----------------|
| **Teacher**       | `teacher@demo.edu`   | All 4 students (their caseload), IEPs, goals, compliance |
| **Administrator** | `admin@demo.edu`     | All 4 students + school-wide oversight |
| **Service Provider** | `provider@demo.edu` | Only 2 students: **Morgan Lee**, **Riley Chen** (assigned via services) |

---

## How roles map to the system

| Role        | Conceptual role | In the app / DB |
|------------|------------------|------------------|
| **Teacher** | Plans: owns the IEP, adds goals, tracks progress, sees compliance | Case manager for students (`students.case_manager_id`). Sees students where they are case manager. |
| **Service Provider** | Delivers: logs sessions, updates goal data | Linked to students via `services`. Sees only students they have a service row for. |
| **Administrator** | Oversees: compliance, risk, whole school | Same `school_id` as everyone. RLS lets them select all students (and related data) in that school. |

---

## Quick checks after login

1. **Teacher** (`teacher@demo.edu`)  
   - Go to **Students**. You should see **4 students**: Morgan Lee, Riley Chen, Casey Williams, Taylor Brown.

2. **Service Provider** (`provider@demo.edu`)  
   - Go to **Students**. You should see **2 students**: Morgan Lee, Riley Chen.  
   - Casey and Taylor do not appear (no service link).

3. **Administrator** (`admin@demo.edu`)  
   - Go to **Students**. You should see all **4 students** (school-wide view).

---

## Resetting the demo

If you need a clean slate:

1. In Supabase: **Authentication** → **Users** → delete the demo users.
2. In **SQL Editor**, run (adjust if you have more data):
   ```sql
   TRUNCATE service_logs, services, progress_updates, goals, ieps, students, users, schools RESTART IDENTITY CASCADE;
   ```
3. Run **`npm run seed`** again to recreate the three users and demo data.
