import { useEffect } from 'react';
import { useSavedListings } from '../hooks/useSavedListings';
import { ListingGrid } from '../components/listings/ListingGrid';
import { EmptyState } from '../components/listings/EmptyState';
import { ListingCardSkeleton } from '../components/listings/ListingCardSkeleton';
import { Heart } from 'lucide-react';

export function SavedListingsPage() {
  const { savedListings, isLoading, error, fetchSavedListings } = useSavedListings();

  useEffect(() => {
    fetchSavedListings();
  }, [fetchSavedListings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Saved Listings</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Saved Listings</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Saved Listings</h1>
          <div className="flex items-center text-gray-600">
            <Heart className="w-5 h-5 mr-2" />
            <span>{savedListings.length} saved</span>
          </div>
        </div>

        {savedListings.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-8 h-8 text-gray-400" />}
            message="No saved listings"
            description="Start saving listings you're interested in to view them here"
          />
        ) : (
          <ListingGrid listings={savedListings} />
        )}
      </div>
    </div>
  );
}
