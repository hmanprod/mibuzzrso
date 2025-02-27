import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Cover Image Skeleton */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg animate-pulse overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-200"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-8">
          {/* Left Column */}
          <div className="w-64 relative -mt-20">
            {/* Profile Photo Skeleton */}
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-gray-200 animate-pulse"></div>
            </div>

            {/* Profile Information Skeleton */}
            <div className="mt-4">
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              
              <div className="mt-2">
                <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              {/* Bio Skeleton */}
              <div className="mt-4 relative">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Separator */}
              <div className="h-[1px] bg-gray-100 mt-8"></div>

              {/* Stats Skeleton */}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="text-center">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="text-center">
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Talents Skeleton */}
              <div className="mt-6">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Genres Skeleton */}
              <div className="mt-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="flex flex-wrap gap-2">
                  <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column */}
          <div className="flex-1">
            {/* Tabs Skeleton */}
            <div className="mt-20 border-b border-gray-200">
              <div className="flex gap-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div 
                    key={i}
                    className="h-10 w-24 bg-gray-200 rounded animate-pulse mb-4"
                  ></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="mt-6">
              <div className="h-16 w-full bg-gray-200 rounded-lg animate-pulse mb-8"></div>
              
              <div className="mt-8 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 space-y-4 border border-gray-100">
                    {/* Header with avatar and name */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-200 rounded mt-2 animate-pulse" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    </div>

                    {/* Media placeholder */}
                    <div className="aspect-video w-full bg-gray-200 rounded-lg animate-pulse" />

                    {/* Actions */}
                    <div className="flex items-center space-x-4 pt-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-64">
            <div className="sticky top-4 space-y-4">
              <div className="mt-6">
                <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
