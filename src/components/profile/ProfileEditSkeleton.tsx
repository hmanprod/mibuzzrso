export default function ProfileEditSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-200 rounded" />

        <div className="flex space-x-4">
          <div className="w-1/2 space-y-2">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
          <div className="w-1/2 space-y-2">
            <div className="h-5 w-20 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-200 rounded" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-5 w-20 bg-gray-200 rounded" />
          <div className="h-10 w-full bg-gray-200 rounded" />
        </div>

        <div className="space-y-2">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-32 w-full bg-gray-200 rounded" />
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4">
        <div className="h-6 w-24 bg-gray-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded" />
              <div className="h-10 flex-1 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Musical Interests */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
              ))}
              <div className="h-8 w-24 bg-gray-200 rounded-full" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
              ))}
              <div className="h-8 w-24 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4 pt-6">
        <div className="h-10 w-20 bg-gray-200 rounded" />
        <div className="h-10 w-32 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}
