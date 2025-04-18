import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Assignments from './pages/Assignments';
import CodePlayground from './pages/CodePlayground';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CourseManagement from './pages/instructor/CourseManagement';
import AssignmentManagement from './pages/instructor/AssignmentManagement';
import LectureManagement from './pages/instructor/LectureManagement';
import Login from './pages/Login'; // Import Login page
import Signup from './pages/Signup'; // Import Signup page
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import { useAuth } from './context/AuthContext'; // Import useAuth

function App() {
  const { user, loading } = useAuth(); // Get auth state

  // Don't render routes until auth state is loaded to prevent flicker
  if (loading) {
    return <div>Loading application...</div>; // Or a proper loading spinner
  }

  return (
    <Router>
      {/* Conditionally render Navbar and Sidebar based on auth state if needed */}
      {/* For now, assume they are always visible, adjust as per design */}
      <div className="min-h-screen bg-gray-50">
        {/* Render Navbar only if not on login/signup pages? Or always? */}
        {/* Let's keep it simple for now and always show Navbar */}
        <Navbar />
        <div className="flex">
          {/* Conditionally render Sidebar based on auth state */}
          {user && <Sidebar />}
          <main className="flex-1 p-6"> {/* Added padding */}
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/playground" element={<CodePlayground />} />
                {/* Instructor routes are also protected */}
                <Route path="/instructor" element={<InstructorDashboard />} />
                <Route path="/instructor/courses" element={<CourseManagement />} />
                <Route path="/instructor/assignments" element={<AssignmentManagement />} />
                <Route path="/instructor/lectures" element={<LectureManagement />} />
              </Route>

              {/* Fallback for unknown routes */}
              <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
