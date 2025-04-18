import React, { useState } from 'react';
import { Plus, Search, Video, Clock, Upload } from 'lucide-react';

const LectureManagement = () => {
  const [showNewLectureModal, setShowNewLectureModal] = useState(false);
  const [lectures] = useState([
    {
      id: 1,
      title: 'Introduction to React Hooks',
      course: 'React Development',
      duration: '45 minutes',
      views: 28,
      uploadDate: '2024-03-20'
    },
    {
      id: 2,
      title: 'JavaScript Array Methods Deep Dive',
      course: 'JavaScript Fundamentals',
      duration: '55 minutes',
      views: 42,
      uploadDate: '2024-03-18'
    }
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lecture Management</h1>
        <button
          onClick={() => setShowNewLectureModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Lecture
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="relative flex-1 max-w-xl">
              <input
                type="text"
                placeholder="Search lectures..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {lectures.map((lecture) => (
            <div key={lecture.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-gray-100 rounded-lg p-3">
                  <Video className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{lecture.title}</h3>
                  <p className="text-sm text-gray-500">{lecture.course}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {lecture.duration}
                    </div>
                    <div>{lecture.views} views</div>
                    <div>Uploaded: {lecture.uploadDate}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNewLectureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Lecture</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter lecture title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a course</option>
                  <option value="react">React Development</option>
                  <option value="javascript">JavaScript Fundamentals</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Upload</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    Drag and drop your video file here, or click to browse
                  </p>
                  <input type="file" className="hidden" accept="video/*" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="Enter lecture description"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewLectureModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Upload Lecture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LectureManagement;
