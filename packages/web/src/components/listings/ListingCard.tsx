import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/card';
import type { Listing } from '@shared/types';
import { MapPin, Eye } from 'lucide-react';
import { SaveButton } from './SaveButton';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const primaryImage = listing.images[0] || '/placeholder-image.jpg';

  return (
    <Link to={`/listings/${listing.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {listing.condition && (
            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium capitalize">
              {listing.condition}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <SaveButton listingId={listing.id} />
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>
          <p className="text-2xl font-bold text-primary mb-2">
            {formatPrice(listing.price, listing.currency)}
          </p>
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
          {listing.category && (
            <p className="text-sm text-gray-500 mb-2">{listing.category.name}</p>
          )}
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(listing.createdAt)}</span>
          <div className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            <span>{listing.viewCount}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
