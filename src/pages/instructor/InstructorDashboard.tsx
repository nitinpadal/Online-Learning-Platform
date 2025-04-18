import React from 'react';
    import { Link } from 'react-router-dom';
    // Updated imports for Heroicons v2
    import { BookOpenIcon, ClipboardDocumentListIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';

    // Define the structure for dashboard items
    interface DashboardItem {
      title: string;
      description: string;
      link: string;
      icon: React.ElementType; // Use React.ElementType for component types
    }

    // Static data for dashboard items
    const dashboardItems: DashboardItem[] = [
      {
        title: 'Manage Courses',
        description: 'Create, edit, and organize your courses.',
        link: '/instructor/courses',
        icon: BookOpenIcon,
      },
      {
        title: 'Manage Assignments',
        description: 'Create, grade, and manage assignments for your courses.',
        link: '/instructor/assignments',
        // Note: Renamed ClipboardListIcon to ClipboardDocumentListIcon as per v2
        icon: ClipboardDocumentListIcon,
      },
      {
        title: 'Manage Lectures',
        description: 'Upload and manage lecture materials and videos.',
        link: '/instructor/lectures',
        icon: PresentationChartLineIcon,
      },
      // Add more items as needed, e.g., Student Management, Analytics
    ];

    const InstructorDashboard = () => {
      return (
        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
            {/* Add any relevant actions here, e.g., a "Create New Course" button */}
          </div>

          <p className="mb-6 text-lg text-gray-600">
            Welcome to your dashboard. From here, you can manage your courses, assignments, and lectures.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item) => (
              <Link
                key={item.title}
                to={item.link}
                className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-center mb-4">
                  <item.icon className="h-8 w-8 text-blue-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-800">{item.title}</h2>
                </div>
                <p className="text-gray-600">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    export default InstructorDashboard;
