import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, ListingService, Listing } from '@classified/shared';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function MyListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = async () => {
    try {
      const supabase = getSupabase();
      const listingService = new ListingService(supabase);
      const { listings: userListings, error } = await listingService.getUserListings();

      if (error) {
        alert('Failed to load listings: ' + error.message);
        return;
      }

      setListings(userListings);
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleDelete = async (listing: Listing) => {
    if (!confirm(`Are you sure you want to delete "${listing.title}"?`)) {
      return;
    }

    try {
      const supabase = getSupabase();
      const listingService = new ListingService(supabase);
      const { error } = await listingService.deleteListing(listing.id);

      if (error) {
        alert('Failed to delete listing: ' + error.message);
        return;
      }

      alert('Listing deleted successfully');
      loadListings();
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const handleToggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === 'active' ? 'sold' : 'active';
    const statusLabel = newStatus === 'sold' ? 'Mark as Sold' : 'Mark as Active';

    if (!confirm(`${statusLabel}?`)) {
      return;
    }

    try {
      const supabase = getSupabase();
      const listingService = new ListingService(supabase);
      const { error } = await listingService.updateListingStatus(
        listing.id,
        newStatus
      );

      if (error) {
        alert('Failed to update status: ' + error.message);
        return;
      }

      alert('Status updated successfully');
      loadListings();
    } catch (error) {
      alert('An unexpected error occurred');
    }
  };

  const handleEdit = (listing: Listing) => {
    navigate(`/edit-listing/${listing.id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Listings</h1>
        <Button onClick={() => navigate('/create-listing')}>+ New Listing</Button>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-gray-500 text-lg mb-4">No listings yet</p>
            <Button onClick={() => navigate('/create-listing')}>
              Create Your First Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {listing.images.length > 0 && (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">{listing.title}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {listing.currency} {listing.price.toLocaleString()}
                    </p>
                    <p className="text-gray-600 mb-2">{listing.location}</p>
                    <div className="flex items-center gap-4 mb-3">
                      <span
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          listing.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : listing.status === 'sold'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {listing.status.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        👁 {listing.viewCount} views
                      </span>
                      <span className="text-sm text-gray-500">
                        📞 {listing.contactCount} contacts
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(listing)}
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(listing)}
                      >
                        {listing.status === 'active' ? '✓ Mark Sold' : '↻ Mark Active'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(listing)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑 Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
