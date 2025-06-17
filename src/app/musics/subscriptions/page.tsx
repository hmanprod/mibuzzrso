export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { getSubscriptionsMedia } from '../../../actions/subscription/subscriptions';
import { SubscriptionsList } from './components';

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

async function MediaList() {
  const result = await getSubscriptionsMedia(12, 1);

  if (result.error) {
    return (
      <div className="text-center py-8 text-red-500">
        {result.error}
      </div>
    );
  }

  if (!result.media?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucun média disponible des utilisateurs suivis
      </div>
    );
  }

  return (
    <SubscriptionsList 
      initialMedia={result.media}
      initialTotal={result.total}
      initialHasMore={result.hasMore}
    />
  );
}

export default async function SubscriptionsPage() {
  return (
 
      <div className="min-h-screen bg-background">
      
        <div className="flex">
          
          <div className="flex flex-1">
            <main className="flex-1 w-full mx-auto py-4 px-4 sm:px-0 max-w-7xl">
              <div className="container mx-auto py-8 px-4 space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">Médias des abonnements</h2>
                  </div>
                  <Suspense fallback={<LoadingSpinner />}>
                    <MediaList />
                  </Suspense>
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
  );
}
