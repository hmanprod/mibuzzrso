export default function FeedPostSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 space-y-4 mb-4">
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
  );
}
