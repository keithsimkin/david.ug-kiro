import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Listing } from '@shared/types';
import { ListingService } from '@shared/services/listing.service';
import { MessagingService } from '@shared/services/messaging.service';
import { AnalyticsService } from '@shared/services/analytics.service';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  MapPin,
  Calendar,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { SaveButton } from '../components/listings/SaveButton';

const listingService = new ListingService(supabase);
const analyticsService = new AnalyticsService(supabase);

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadListing(id);
      trackView(id);
    }
  }, [id]);

  const loadListing = async (listingId: string) => {
    setLoading(true);
    const { listing: data, error: err } = await listingService.getListingById(listingId);
    
    if (err || !data) {
      setError('Failed to load listing');
    } else {
      setListing(data);
    }
    
    setLoading(false);
  };

  const trackView = async (listingId: string) => {
    await listingService.incrementViewCount(listingId);
    // Track analytics event
    await analyticsService.trackView(listingId, user?.id);
  };

  const handleContactClick = async () => {
    if (listing) {
      await listingService.incrementContactCount(listing.id);
      // Track analytics event
      await analyticsService.trackContact(listing.id, user?.id);
    }
  };

  const handlePhoneClick = () => {
    if (listing?.contactPhone) {
      window.location.href = `tel:${listing.contactPhone}`;
      handleContactClick();
    }
  };

  const handleEmailClick = () => {
    if (listing?.contactEmail) {
      window.location.href = `mailto:${listing.contactEmail}`;
      handleContactClick();
    }
  };

  const handleMessageClick = async () => {
    if (!listing || !user) {
      alert('Please log in to message the seller');
      return;
    }

    if (listing.userId === user.id) {
      alert('You cannot message yourself');
      return;
    }

    handleContactClick();

    try {
      // Get or create conversation
      const conversation = await MessagingService.getOrCreateConversation({
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.userId,
      });

      // Navigate to conversation
      navigate(`/conversation/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };



  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing?.title,
          text: listing?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const nextImage = () => {
    if (listing && currentImageIndex < listing.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Listing not found'}</p>
          <Button onClick={() => navigate('/search')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="mb-6 overflow-hidden">
              <div className="relative aspect-[16/10] bg-gray-100">
                {listing.images.length > 0 ? (
                  <>
                    <img
                      src={listing.images[currentImageIndex]}
                      alt={listing.title}
                      className="w-full h-full object-contain"
                    />
                    {listing.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          disabled={currentImageIndex === 0}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={nextImage}
                          disabled={currentImageIndex === listing.images.length - 1}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {listing.images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>
              
              {/* Thumbnail Strip */}
              {listing.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex ? 'border-primary' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Listing Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                    <p className="text-4xl font-bold text-primary">
                      {formatPrice(listing.price, listing.currency)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <SaveButton 
                      listingId={listing.id} 
                      variant="outline" 
                      size="sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareClick}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(listing.createdAt)}
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {listing.viewCount} views
                  </div>
                  {listing.condition && (
                    <div className="px-3 py-1 bg-gray-100 rounded-full capitalize">
                      {listing.condition}
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                </div>

                {listing.category && (
                  <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold mb-3">Category</h2>
                    <p className="text-gray-700">{listing.category.name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Seller Info */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Seller Information</h2>
                {listing.user && (
                  <div className="flex items-center mb-4">
                    {listing.user.avatarUrl ? (
                      <img
                        src={listing.user.avatarUrl}
                        alt={listing.user.fullName}
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <span className="text-xl font-semibold text-gray-600">
                          {listing.user.fullName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{listing.user.fullName}</p>
                      <p className="text-sm text-gray-600">@{listing.user.username}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {listing.contactPhone && (
                    <Button
                      className="w-full"
                      onClick={handlePhoneClick}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Seller
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleMessageClick}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>

                  {listing.contactEmail && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleEmailClick}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Seller
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Safety Tips</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Meet in a public place</li>
                  <li>• Check the item before you buy</li>
                  <li>• Pay only after collecting the item</li>
                  <li>• Don't share personal information</li>
                  <li>• Report suspicious listings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
