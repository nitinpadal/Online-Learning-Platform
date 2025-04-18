import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Edit3, Code, UserCog, Settings } from 'lucide-react'; // Added Settings

const Sidebar = () => {
  const commonLinkClasses = "flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-200";
  const activeLinkClasses = "bg-indigo-100 text-indigo-700 font-semibold"; // Style for active link

  // Basic role check (replace with actual role logic later)
  const isInstructor = true; // Placeholder - integrate with user roles from AuthContext later

  return (
    <aside className="w-64 bg-white shadow-md h-screen sticky top-16 flex-shrink-0"> {/* Adjusted top margin */}
      <div className="p-4">
        <nav className="space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
            end // Use 'end' prop for the home route to avoid matching nested routes
          >
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </NavLink>
          <NavLink
            to="/courses"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <BookOpen className="h-5 w-5 mr-3" />
            My Courses
          </NavLink>
          <NavLink
            to="/assignments"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <Edit3 className="h-5 w-5 mr-3" />
            Assignments
          </NavLink>
          <NavLink
            to="/playground"
            className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <Code className="h-5 w-5 mr-3" />
            Code Playground
          </NavLink>

          {/* Instructor Section */}
          {isInstructor && (
            <>
              <hr className="my-4 border-gray-200" />
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Instructor Tools</h3>
              <NavLink
                to="/instructor"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                end
              >
                <UserCog className="h-5 w-5 mr-3" />
                Instructor Dashboard
              </NavLink>
              <NavLink
                to="/instructor/courses"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
              >
                <BookOpen className="h-5 w-5 mr-3" />
                Manage Courses
              </NavLink>
              <NavLink
                to="/instructor/assignments"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
              >
                <Edit3 className="h-5 w-5 mr-3" />
                Manage Assignments
              </NavLink>
               <NavLink
                to="/instructor/lectures"
                className={({ isActive }) => `${commonLinkClasses} ${isActive ? activeLinkClasses : ''}`}
              >
                <Settings className="h-5 w-5 mr-3" /> {/* Changed icon */}
                Manage Lectures
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
