import React from 'react';

export default function UserSkeleton() {
    return (
      <div className="flex items-center p-4 bg-white rounded-lg shadow-sm animate-pulse">
        <div className="h-12 w-12 rounded-full bg-gray-200"></div>
        <div className="ml-4 flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
          <div className="flex gap-1 mt-1">
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="ml-2">
          <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    );
  };