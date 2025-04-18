/*
      # Create Enrollments Table

      This migration creates the `enrollments` table to track which users are enrolled in which courses.

      1.  **New Table:**
          - `enrollments`
            - `id` (uuid, primary key, default: gen_random_uuid()): Unique identifier for the enrollment record.
            - `user_id` (uuid, not null, references auth.users(id) ON DELETE CASCADE): Foreign key linking to the user who enrolled.
            - `course_id` (uuid, not null, references courses(id) ON DELETE CASCADE): Foreign key linking to the course.
            - `enrolled_at` (timestamptz, default: now()): Timestamp of when the enrollment occurred.

      2.  **Constraints:**
          - `enrollments_user_id_course_id_key`: Unique constraint to prevent a user from enrolling in the same course multiple times.

      3.  **Indexes:**
          - Primary key index on `id`.
          - Foreign key index on `user_id`.
          - Foreign key index on `course_id`.
          - Index on `(user_id, course_id)` due to the unique constraint.

      4.  **Security:**
          - Enable Row Level Security (RLS) on the `enrollments` table.
          - Policy `Allow individual read access`: Allows users to read their *own* enrollment records.
          - Policy `Allow individual insert access`: Allows users to create enrollment records for *themselves*.
          - Policy `Allow individual delete access`: Allows users to delete their *own* enrollment records (unenroll).

      5.  **Notes:**
          - `ON DELETE CASCADE` on `course_id` means if a course is deleted, corresponding enrollments are automatically removed.
          - `user_id` references `auth.users(id)`, linking directly to Supabase's authentication system.
    */

    -- 1. Create Table
    CREATE TABLE IF NOT EXISTS enrollments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      enrolled_at timestamptz DEFAULT now() NOT NULL,
      -- Prevent duplicate enrollments
      CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id)
    );

    -- 2. Add Indexes (Optional but recommended)
    CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON enrollments (user_id);
    CREATE INDEX IF NOT EXISTS enrollments_course_id_idx ON enrollments (course_id);

    -- 3. Enable RLS
    ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

    -- 4. RLS Policies
    -- Allow users to read their own enrollments
    CREATE POLICY "Allow individual read access"
      ON enrollments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    -- Allow users to insert their own enrollment
    CREATE POLICY "Allow individual insert access"
      ON enrollments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    -- Allow users to delete their own enrollment (unenroll)
    CREATE POLICY "Allow individual delete access"
      ON enrollments
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);