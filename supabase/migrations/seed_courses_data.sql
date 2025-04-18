/*
      # Seed Courses Data

      This migration inserts some initial sample data into the `courses` table.

      1.  **Data Insertion:**
          - Inserts three sample courses: JavaScript Fundamentals, React Development, and Python Programming.

      2.  **Notes:**
          - Uses `INSERT INTO ... ON CONFLICT DO NOTHING` based on the `id` to avoid errors if the data already exists from a previous run. We are defining specific UUIDs here for consistency.
          - Replace placeholder image URLs with actual ones if available.
    */

    INSERT INTO courses (id, title, description, image_url) VALUES
      ('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'JavaScript Fundamentals', 'Learn the basics of JavaScript programming, including variables, data types, functions, and the DOM.', 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&q=80&w=400'),
      ('b2c3d4e5-f6a7-8901-2345-67890abcdef0', 'React Development', 'Master modern React development, covering components, state, props, hooks, and routing.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400'),
      ('c3d4e5f6-a7b8-9012-3456-7890abcdef01', 'Python Programming', 'A comprehensive introduction to Python programming, suitable for beginners and experienced programmers.', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=400')
    ON CONFLICT (id) DO NOTHING;