/*
      # Add RLS Policies for Courses Table

      This migration adds Row Level Security (RLS) policies to the `courses` table
      to control access based on user authentication and ownership.

      1.  **Security**:
          - Enable RLS on the `courses` table (if not already enabled).
          - Add policy: Authenticated users can view all courses.
          - Add policy: Authenticated users can insert new courses, setting themselves as the instructor.
          - Add policy: Instructors can update their own courses.
          - Add policy: Instructors can delete their own courses.

      2.  **Notes**:
          - Assumes the `courses` table has an `instructor_id` column of type `uuid` that references `auth.users(id)`.
          - These policies provide basic ownership-based access control. Adjust as needed for more complex roles (e.g., admins).
    */

    -- 1. Enable RLS on the courses table if it's not already enabled
    -- Note: The initial migration might have already enabled it. This ensures it is.
    ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

    -- 2. Allow authenticated users to view all courses
    -- Adjust this policy if courses should only be visible under certain conditions (e.g., published)
    DROP POLICY IF EXISTS "Allow authenticated users to view courses" ON public.courses;
    CREATE POLICY "Allow authenticated users to view courses"
      ON public.courses
      FOR SELECT
      TO authenticated
      USING (true); -- Allows any authenticated user to select any course

    -- 3. Allow authenticated users to insert courses, setting themselves as instructor
    DROP POLICY IF EXISTS "Allow authenticated users to insert courses" ON public.courses;
    CREATE POLICY "Allow authenticated users to insert courses"
      ON public.courses
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = instructor_id); -- Ensures the user inserting is the instructor

    -- 4. Allow instructors to update their own courses
    DROP POLICY IF EXISTS "Allow instructors to update their own courses" ON public.courses;
    CREATE POLICY "Allow instructors to update their own courses"
      ON public.courses
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = instructor_id) -- Checks ownership for the row being updated
      WITH CHECK (auth.uid() = instructor_id); -- Ensures ownership on the new data

    -- 5. Allow instructors to delete their own courses
    DROP POLICY IF EXISTS "Allow instructors to delete their own courses" ON public.courses;
    CREATE POLICY "Allow instructors to delete their own courses"
      ON public.courses
      FOR DELETE
      TO authenticated
      USING (auth.uid() = instructor_id); -- Checks ownership for the row being deleted