/*
      # Create Courses Table

      This migration creates the `courses` table to store information about available courses.

      1.  **New Table:**
          - `courses`
            - `id` (uuid, primary key, default: gen_random_uuid()): Unique identifier for the course.
            - `title` (text, not null): The title of the course.
            - `description` (text): A description of the course content.
            - `image_url` (text): URL for the course's cover image.
            - `created_at` (timestamptz, default: now(), not null): Timestamp of when the course was created.

      2.  **Indexes:**
          - Primary key index on `id`.

      3.  **Security:**
          - Enable Row Level Security (RLS) on the `courses` table.
          - Policy `Allow authenticated read access`: Allows any authenticated user to read course data.

      4.  **Notes:**
          - The `image_url` is currently a simple text field. Consider using Supabase Storage for image uploads in a future enhancement.
          - Instructor/Admin policies for CUD operations will need refinement when roles are implemented.
    */

    -- 1. Create Table
    CREATE TABLE IF NOT EXISTS courses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      image_url text,
      created_at timestamptz DEFAULT now() NOT NULL
    );

    -- 2. Enable RLS
    ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

    -- 3. RLS Policies
    -- Allow authenticated users to read all courses
    CREATE POLICY "Allow authenticated read access"
      ON courses
      FOR SELECT
      TO authenticated
      USING (true);