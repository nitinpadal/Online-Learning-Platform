import React from 'react';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const Home = () => {
  const { user } = useAuth(); // Get user info

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to CodeLearn LMS!</h1>
      {user ? (
        <p className="text-lg text-gray-600">
          Hello, {user.email}! Ready to start learning or teaching?
        </p>
      ) : (
        <p className="text-lg text-gray-600">
          Your learning journey starts here. Explore courses and practice coding.
        </p>
      )}
      {/* Add more dashboard elements here */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Example Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">My Courses</h2>
          <p className="text-gray-600">View your enrolled courses and track your progress.</p>
          {/* Link to courses page */}
        </div>
        {/* Example Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Assignments</h2>
          <p className="text-gray-600">Check upcoming deadlines and submit your work.</p>
          {/* Link to assignments page */}
        </div>
        {/* Example Card 3 */}
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Code Playground</h2>
          <p className="text-gray-600">Experiment with code snippets in various languages.</p>
          {/* Link to playground page */}
        </div>
      </div>
    </div>
  );
};

export default Home;
