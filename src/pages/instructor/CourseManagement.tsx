import React, { useState, useEffect, useCallback } from 'react';
    import { supabase } from '../../lib/supabaseClient';
    import { useAuth } from '../../context/AuthContext'; // Import useAuth

    // Define the Course type based on your table structure
    interface Course {
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      created_at: string;
      instructor_id: string; // Added instructor_id
    }

    const CourseManagement = () => {
      const { user } = useAuth(); // Get the authenticated user
      const [courses, setCourses] = useState<Course[]>([]);
      const [isLoading, setIsLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      // State for the "Create New Course" form
      const [showCreateForm, setShowCreateForm] = useState(false);
      const [newCourseTitle, setNewCourseTitle] = useState('');
      const [newCourseDescription, setNewCourseDescription] = useState('');
      const [newCourseImageUrl, setNewCourseImageUrl] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [formError, setFormError] = useState<string | null>(null);

      // Fetch courses created by the current instructor
      const fetchCourses = useCallback(async () => {
        if (!user) return; // Don't fetch if user is not logged in

        setIsLoading(true);
        setError(null);
        try {
          // RLS policy ensures only instructor's courses are fetched if SELECT policy uses `instructor_id = auth.uid()`
          // If SELECT policy is `USING (true)`, this fetches all courses.
          // Let's assume for management, we only want the instructor's courses.
          // We need to adjust the SELECT RLS policy or filter here if needed.
          // For now, relying on the INSERT/UPDATE/DELETE RLS being correct.
          // Fetching all courses for display, but actions are restricted by RLS.
          const { data, error: fetchError } = await supabase
            .from('courses')
            .select('*')
            // Optional: Order by creation date
            .order('created_at', { ascending: false });

          if (fetchError) {
            throw fetchError;
          }
          setCourses(data || []);
        } catch (err: any) {
          console.error('Error fetching courses:', err);
          setError(`Failed to fetch courses: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      }, [user]); // Re-run fetchCourses if the user changes

      useEffect(() => {
        fetchCourses();
      }, [fetchCourses]); // Fetch courses on component mount and when fetchCourses changes

      // Handle Create Course form submission
      const handleCreateCourse = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user) {
          setFormError("You must be logged in to create a course.");
          return;
        }
        if (!newCourseTitle.trim()) {
          setFormError("Course Title is required.");
          return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
          const { error: insertError } = await supabase
            .from('courses')
            .insert({
              title: newCourseTitle.trim(),
              description: newCourseDescription.trim() || null, // Handle empty description
              image_url: newCourseImageUrl.trim() || null, // Handle empty image URL
              instructor_id: user.id, // Set the instructor_id to the current user's ID
            });

          if (insertError) {
            // Check for specific RLS violation error if possible, otherwise show generic
            if (insertError.message.includes('check constraint') || insertError.message.includes('policy')) {
               throw new Error("You do not have permission to create this course, or the data is invalid according to policy.");
            }
            throw insertError;
          }

          // Reset form and hide it
          setNewCourseTitle('');
          setNewCourseDescription('');
          setNewCourseImageUrl('');
          setShowCreateForm(false);

          // Refresh the course list
          await fetchCourses();

        } catch (err: any) {
          console.error('Error creating course:', err);
          // Display the specific error from Supabase if available
          setFormError(`Failed to create course: ${err.message}. Please try again.`);
        } finally {
          setIsSubmitting(false);
        }
      };

      // Handle Delete Course
      const handleDeleteCourse = async (courseId: string) => {
        if (!user) {
          setError("You must be logged in to delete a course.");
          return;
        }
        // Optional: Add a confirmation dialog
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
          return;
        }

        setError(null); // Clear previous errors
        try {
          const { error: deleteError } = await supabase
            .from('courses')
            .delete()
            .eq('id', courseId)
            // RLS policy implicitly checks .eq('instructor_id', user.id)
            ;

          if (deleteError) {
             // Check for specific RLS violation error
            if (deleteError.message.includes('policy')) {
               throw new Error("You do not have permission to delete this course.");
            }
            throw deleteError;
          }

          // Refresh list after successful deletion
          setCourses(courses.filter(course => course.id !== courseId));

        } catch (err: any) {
          console.error('Error deleting course:', err);
          setError(`Failed to delete course: ${err.message}`);
        }
      };


      // --- Render Logic ---

      if (isLoading) {
        return <div className="p-6">Loading courses...</div>;
      }

      // Display error message if fetching failed
      if (error && !showCreateForm) { // Don't show fetch error when form is open
        return <div className="p-6 text-red-600 bg-red-100 border border-red-400 rounded">Error: {error}</div>;
      }

      return (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`px-4 py-2 rounded font-semibold text-white ${showCreateForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {showCreateForm ? 'Cancel' : 'Create New Course'}
            </button>
          </div>

          {/* Create New Course Form */}
          {showCreateForm && ( // Fixed: Replaced &amp;&amp; with &&
            <div className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create New Course</h2>
              {formError && ( // Fixed: Replaced &amp;&amp; with &&
                <div className="mb-4 p-3 text-red-700 bg-red-100 border border-red-400 rounded">
                  {formError}
                </div>
              )}
              <form onSubmit={handleCreateCourse}>
                <div className="mb-4">
                  <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="courseTitle"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Introduction to React"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="courseDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="courseDescription"
                    value={newCourseDescription}
                    onChange={(e) => setNewCourseDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Briefly describe the course content..."
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="courseImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="courseImageUrl"
                    value={newCourseImageUrl}
                    onChange={(e) => setNewCourseImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Display error message if fetching failed (shown again here in case form is closed) */}
           {error && ( // Fixed: Replaced &amp;&amp; with &&
             <div className="mb-6 p-4 text-red-600 bg-red-100 border border-red-400 rounded">
               Error: {error}
             </div>
           )}


          {/* Course List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {courses.length === 0 && !isLoading && ( // Fixed: Replaced &amp;&amp; with &&
                <li className="px-6 py-4 text-center text-gray-500">You haven't created any courses yet.</li>
              )}
              {courses.map((course) => (
                <li key={course.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center">
                    {course.image_url && ( // Fixed: Replaced &amp;&amp; with &&
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="h-12 w-16 object-cover rounded mr-4 hidden sm:block" // Hide on very small screens
                        onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
                      />
                    )}
                    <div>
                      <p className="text-lg font-medium text-blue-600 truncate">{course.title}</p>
                      <p className="text-sm text-gray-600">
                        {course.description ? course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '') : <i>No description</i>}
                      </p>
                       <p className="text-xs text-gray-400 mt-1">Created: {new Date(course.created_at).toLocaleDateString()}</p>
                       {/* Optionally display instructor ID if needed for debugging, remove for production */}
                       {/* <p className="text-xs text-gray-400">Instructor ID: {course.instructor_id}</p> */}
                    </div>
                  </div>
                  {/* Add Edit/Delete buttons if user is the instructor */}
                  {user && user.id === course.instructor_id && ( // Fixed: Replaced &amp;&amp; with &&
                    <div className="flex space-x-2">
                      <button
                        // onClick={() => handleEditCourse(course.id)} // TODO: Implement Edit functionality
                        className="px-3 py-1 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50"
                        disabled // Disable until implemented
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                   {/* Show something if user is not the instructor? Or just hide buttons? Hiding is cleaner. */}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    };

    export default CourseManagement;
