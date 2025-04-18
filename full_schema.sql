-- ==================================================================
--                      Courses Table Schema
-- ==================================================================

/*
  # Create Courses Table

  Stores information about available courses.

  1.  **Table:** `courses`
      - `id` (uuid, primary key): Unique identifier.
      - `title` (text, not null): Course title.
      - `description` (text): Course description.
      - `image_url` (text): URL for the course image.
      - `created_at` (timestamptz, default: now()): Creation timestamp.
      - `instructor_id` (uuid, not null, references auth.users(id)): Foreign key to the instructor user.

  2.  **Security:**
      - RLS Enabled.
      - Policies:
        - Authenticated users can read all courses.
        - Instructors (authenticated users) can insert courses (setting their own ID).
        - Instructors can update their own courses.
        - Instructors can delete their own courses.
*/

-- Create Table: courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  instructor_id uuid NOT NULL REFERENCES auth.users(id) -- Added instructor reference
);

-- Enable RLS: courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies: courses

-- Drop existing policies defined during setup (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.courses; -- Old policy name
DROP POLICY IF EXISTS "Allow authenticated users to read all courses" ON public.courses;
DROP POLICY IF EXISTS "Allow instructors to insert courses" ON public.courses;
DROP POLICY IF EXISTS "Allow instructors to update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Allow instructors to delete their own courses" ON public.courses;
DROP POLICY IF EXISTS "Allow authenticated users to view courses" ON public.courses; -- From add_course_rls_policies.sql
DROP POLICY IF EXISTS "Allow authenticated users to insert courses" ON public.courses; -- From add_course_rls_policies.sql


-- Allow authenticated users to read all courses
CREATE POLICY "Allow authenticated users to read all courses"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow instructors (any authenticated user) to insert courses, setting their own ID
CREATE POLICY "Allow instructors to insert courses"
  ON public.courses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instructor_id); -- Ensure the user inserting is the instructor

-- Allow instructors to update only their own courses
CREATE POLICY "Allow instructors to update their own courses"
  ON public.courses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

-- Allow instructors to delete only their own courses
CREATE POLICY "Allow instructors to delete their own courses"
  ON public.courses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = instructor_id);


-- ==================================================================
--                    Enrollments Table Schema
-- ==================================================================

/*
  # Create Enrollments Table

  Tracks user enrollments in courses.

  1.  **Table:** `enrollments`
      - `id` (uuid, primary key): Unique identifier.
      - `user_id` (uuid, not null, references auth.users(id)): Foreign key to the enrolled user.
      - `course_id` (uuid, not null, references courses(id)): Foreign key to the course.
      - `enrolled_at` (timestamptz, default: now()): Enrollment timestamp.

  2.  **Constraints:**
      - `enrollments_user_id_course_id_key`: Unique constraint (user_id, course_id).

  3.  **Indexes:**
      - Indexes on `user_id` and `course_id`.

  4.  **Security:**
      - RLS Enabled.
      - Policies:
        - Users can read their own enrollments.
        - Users can create enrollments for themselves.
        - Users can delete their own enrollments (unenroll).
*/

-- Create Table: enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT enrollments_user_id_course_id_key UNIQUE (user_id, course_id)
);

-- Add Indexes: enrollments (Optional but recommended)
CREATE INDEX IF NOT EXISTS enrollments_user_id_idx ON public.enrollments (user_id);
CREATE INDEX IF NOT EXISTS enrollments_course_id_idx ON public.enrollments (course_id);

-- Enable RLS: enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: enrollments

-- Drop existing policies defined during setup (if any) to avoid conflicts
DROP POLICY IF EXISTS "Allow individual read access" ON public.enrollments;
DROP POLICY IF EXISTS "Allow individual insert access" ON public.enrollments;
DROP POLICY IF EXISTS "Allow individual delete access" ON public.enrollments;

-- Allow users to read their own enrollments
CREATE POLICY "Allow individual read access"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own enrollment
CREATE POLICY "Allow individual insert access"
  ON public.enrollments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own enrollment (unenroll)
CREATE POLICY "Allow individual delete access"
  ON public.enrollments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==================================================================
--                          End of Schema
-- ==================================================================
