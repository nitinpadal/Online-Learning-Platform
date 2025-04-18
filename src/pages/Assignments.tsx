import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Assignments = () => {
  const assignments = [
    {
      title: 'Build a Todo App',
      course: 'React Development',
      dueDate: '2024-03-25',
      status: 'completed',
      score: '95/100'
    },
    {
      title: 'JavaScript Array Methods',
      course: 'JavaScript Fundamentals',
      dueDate: '2024-03-28',
      status: 'pending',
    },
    {
      title: 'Python Data Structures',
      course: 'Python Programming',
      dueDate: '2024-03-22',
      status: 'overdue',
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700';
      case 'overdue':
        return 'bg-red-50 text-red-700';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Assignments</h1>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {assignments.map((assignment, index) => (
            <div key={index} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{assignment.title}</h2>
                  <p className="text-sm text-gray-500">{assignment.course}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(assignment.status)}`}>
                    {getStatusIcon(assignment.status)}
                    <span className="ml-2 capitalize">{assignment.status}</span>
                  </span>
                  {assignment.score && (
                    <span className="text-sm font-medium text-gray-600">{assignment.score}</span>
                  )}
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    View Details
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Assignments;
