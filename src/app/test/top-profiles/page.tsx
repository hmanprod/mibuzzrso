import { getTopInteractingUsers } from '@/app/profile/actions/profile'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TopProfilesPage() {
  const { data: topUsers, error } = await getTopInteractingUsers()

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Top 10 Users by Interaction Score</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error loading top users: {error.message}</p>
        </div>
      )}

      {!topUsers || topUsers.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No users found with interactions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topUsers.map((user, index) => (
            <div 
              key={user.user_id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
            >
              <div className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.stage_name || 'User'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-500">
                        <span className="text-xl font-bold">
                          {(user.stage_name?.[0] || user.full_name?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="bg-indigo-500 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mr-2">
                        {index + 1}
                      </span>
                      <Link href={`/profile/${user.user_id}`} className="text-lg font-semibold hover:text-indigo-600">
                        {user.stage_name || 'Anonymous User'}
                      </Link>
                    </div>
                    
                    {user.full_name && (
                      <p className="text-gray-600">{user.full_name}</p>
                    )}
                    
                    {user.label && (
                      <p className="text-gray-500 text-sm italic">{user.label}</p>
                    )}
                    
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-medium bg-indigo-100 text-indigo-800 py-1 px-2 rounded">
                        Score: {user.interaction_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
