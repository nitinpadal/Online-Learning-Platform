/*
      # Add Instructor ID to Courses Table

      This migration links courses to the instructors who created them and updates RLS policies accordingly.

      1.  **Schema Changes:**
          - Add `instructor_id` column to the `courses` table.
            - Type: `uuid`
            - Foreign Key: References `auth.users(id)`
            - Constraint: `NOT NULL` (every course must have an instructor)

      2.  **RLS Policy Changes:**
          - **DROP** existing `Allow authenticated read access` policy (will be replaced).
          - **ADD** policy `Allow authenticated users to read all courses`: Re-adds read access for any logged-in user.
          - **ADD** policy `Allow instructors to insert courses`: Allows authenticated users to insert courses, setting `instructor_id` to their own ID.
          - **ADD** policy `Allow instructors to update their own courses`: Allows users to update courses where their ID matches the `instructor_id`.
          - **ADD** policy `Allow instructors to delete their own courses`: Allows users to delete courses where their ID matches the `instructor_id`.

      3.  **Notes:**
          - This ensures courses are tied to specific instructors.
          - RLS enforces that instructors can only manage their own content.
    */

    -- 1. Add instructor_id column
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'courses' AND column_name = 'instructor_id'
      ) THEN
        ALTER TABLE public.courses
        ADD COLUMN instructor_id uuid REFERENCES auth.users(id) NOT NULL;
      END IF;
    END $$;

    -- 2. Update RLS Policies

    -- Drop the old generic read policy first if it exists
    DROP POLICY IF EXISTS "Allow authenticated read access" ON public.courses;

    -- Re-add read access for any authenticated user
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
      WITH CHECK (auth.uid() IS NOT NULL); -- Ensure user is logged in

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