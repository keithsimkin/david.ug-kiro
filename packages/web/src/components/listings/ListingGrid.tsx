import type { Listing } from '@shared/types';
import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { EmptyState } from './EmptyState';

interface ListingGridProps {
  listings: Listing[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function ListingGrid({ 
  listings, 
  isLoading = false,
  emptyMessage = 'No listings found',
  emptyDescription = 'Try adjusting your search or filters'
}: ListingGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
