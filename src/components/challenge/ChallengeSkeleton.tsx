import React from 'react';

const ChallengeSkeleton: React.FC = () => (
  <article className="bg-white rounded-[18px] shadow-sm overflow-hidden animate-pulse">
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
    <div className="p-4">
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
    </div>
    <div className="h-96 bg-gray-200"></div>
  </article>
);

export default ChallengeSkeleton;
