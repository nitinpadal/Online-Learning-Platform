import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Users, CheckCircle, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

// Define an interface for the Course object
interface Course {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  // Add other fields if needed, e.g., duration, student count (if stored in DB)
}

// Define an interface for the Enrollment object (optional, mainly for type safety)
interface Enrollment {
  course_id: string;
  user_id: string;
}

const Courses = () => {
  const { user } = useAuth(); // Get current user
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null); // Track which course is being enrolled

  // Fetch all available courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false }); // Order by creation date

        if (error) throw error;
        setCourses(data || []);
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        setError("Failed to load courses. Please try again.");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch user's enrollments
  useEffect(() => {
    // Only fetch enrollments if the user is logged in
    if (user) {
      const fetchEnrollments = async () => {
        setLoadingEnrollments(true);
        try {
          const { data, error } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', user.id);

          if (error) throw error;

          const enrolledIds = new Set(data?.map(e => e.course_id) || []);
          setEnrolledCourseIds(enrolledIds);
        } catch (err: any) {
          console.error("Error fetching enrollments:", err);
          // Don't necessarily block the page for enrollment errors, maybe just log
          // setError("Failed to load your enrollment status.");
        } finally {
          setLoadingEnrollments(false);
        }
      };
      fetchEnrollments();
    } else {
      // If user logs out, clear enrollments
      setEnrolledCourseIds(new Set());
      setLoadingEnrollments(false);
    }
  }, [user]); // Re-run when user changes

  // Handle course enrollment
  const handleEnroll = async (courseId: string) => {
    if (!user) {
      setError("You must be logged in to enroll.");
      // Consider redirecting to login: navigate('/login'); (needs useNavigate)
      return;
    }

    setEnrollingCourseId(courseId); // Set loading state for this specific button
    setError(null);

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({ user_id: user.id, course_id: courseId });

      if (error) {
        // Handle potential unique constraint violation (already enrolled) gracefully
        if (error.code === '23505') { // Postgres unique violation code
           console.warn(`User already enrolled in course ${courseId}`);
           // Optionally add the course ID to the set anyway, in case the initial fetch failed
           setEnrolledCourseIds(prev => new Set(prev).add(courseId));
        } else {
          throw error;
        }
      } else {
        // Update UI immediately on success
        setEnrolledCourseIds(prev => new Set(prev).add(courseId));
      }
    } catch (err: any) {
      console.error("Error enrolling in course:", err);
      setError(`Failed to enroll: ${err.message || 'Please try again.'}`);
    } finally {
      setEnrollingCourseId(null); // Clear loading state for the button
    }
  };

  // Combine loading states
  const isLoading = loadingCourses || loadingEnrollments;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Courses</h1>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {isLoading ? (
        <div className="text-center text-gray-500">Loading courses...</div>
      ) : courses.length === 0 ? (
         <div className="text-center text-gray-500">No courses available at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            const isEnrolling = enrollingCourseId === course.id;

            return (
              <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
                <img
                  src={course.image_url || 'https://via.placeholder.com/400x200?text=Course+Image'} // Placeholder image
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h2>
                  <p className="text-gray-600 mb-4 flex-grow">{course.description || 'No description available.'}</p>

                  {/* Placeholder for dynamic data - remove if not available */}
                  {/* <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.students || 0} students
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {course.duration || 'N/A'}
                    </div>
                  </div> */}

                  {user && ( // Only show buttons if user is logged in
                    <button
                      onClick={() => !isEnrolled && !isEnrolling && handleEnroll(course.id)}
                      disabled={isEnrolled || isEnrolling}
                      className={`w-full px-4 py-2 rounded-md text-white font-medium flex items-center justify-center transition-colors duration-200 ease-in-out ${
                        isEnrolled
                          ? 'bg-green-600 cursor-default'
                          : isEnrolling
                          ? 'bg-indigo-400 cursor-wait'
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {isEnrolled ? (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" /> Enrolled
                        </>
                      ) : isEnrolling ? (
                        'Enrolling...'
                      ) : (
                        <>
                          <PlusCircle className="h-5 w-5 mr-2" /> Enroll Now
                        </>
                      )}
                    </button>
                  )}
                   {!user && ( // Optional: Show login prompt if not logged in
                     <p className="text-sm text-center text-gray-500 mt-4">
                       <a href="/login" className="text-indigo-600 hover:underline">Login</a> to enroll.
                     </p>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses;
