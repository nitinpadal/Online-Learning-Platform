import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Bell, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Navbar = () => {
  const { user, signOut, loading } = useAuth(); // Get user and signOut function

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigate to login or home page after logout if needed
      // navigate('/login'); // Requires importing useNavigate
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50"> {/* Make navbar sticky */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center"> {/* Link logo to home */}
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-800">CodeLearn LMS</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : user ? (
              <>
                <span className="text-sm text-gray-700 hidden sm:block"> {/* Hide email on small screens */}
                  {user.email}
                </span>
                <button className="p-2 rounded-full hover:bg-gray-100" title="Notifications">
                  <Bell className="h-6 w-6 text-gray-600" />
                </button>
                {/* Replace User icon with a dropdown later if needed */}
                <button className="p-2 rounded-full hover:bg-gray-100" title="Account">
                  <User className="h-6 w-6 text-gray-600" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full hover:bg-gray-100 text-red-600 hover:text-red-700"
                  title="Logout"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  <LogIn className="h-5 w-5 mr-1" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
