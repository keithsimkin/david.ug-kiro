import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CategoryGrid } from '../components/categories';
import { ListingGrid } from '../components/listings/ListingGrid';
import { useCategories } from '../hooks/useCategories';
import { Category, Listing } from '@shared/types';
import { ListingService } from '@shared/services/listing.service';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';

const listingService = new ListingService(supabase);

export function HomePage() {
  const navigate = useNavigate();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFeaturedListings();
    loadRecentListings();
  }, []);

  const loadFeaturedListings = async () => {
    setLoadingFeatured(true);
    const { listings, error } = await listingService.getFeaturedListings(8);
    if (!error && listings) {
      setFeaturedListings(listings);
    }
    setLoadingFeatured(false);
  };

  const loadRecentListings = async () => {
    setLoadingRecent(true);
    const { listings, error } = await listingService.getRecentListings(12);
    if (!error && listings) {
      setRecentListings(listings);
    }
    setLoadingRecent(false);
  };

  const handleCategorySelect = (category: Category) => {
    navigate(`/search?category=${category.id}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">
              Find What You Need
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Browse thousands of listings in your area
            </p>
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                placeholder="Search for items, services, and more..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-lg text-gray-900"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Categories Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Browse by Category
            </h2>
            <p className="text-gray-600">
              Explore our wide range of categories
            </p>
          </div>

          {categoriesError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              <p>Failed to load categories: {categoriesError.message}</p>
            </div>
          )}

          <CategoryGrid
            categories={categories}
            onCategorySelect={handleCategorySelect}
            loading={categoriesLoading}
          />
        </section>

        {/* Featured Listings Section */}
        {featuredListings.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Featured Listings
              </h2>
              <p className="text-gray-600">
                Popular items in your area
              </p>
            </div>

            <ListingGrid
              listings={featuredListings}
              isLoading={loadingFeatured}
              emptyMessage="No featured listings available"
            />
          </section>
        )}

        {/* Recent Listings Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Recent Listings
            </h2>
            <p className="text-gray-600">
              Latest items posted
            </p>
          </div>

          <ListingGrid
            listings={recentListings}
            isLoading={loadingRecent}
            emptyMessage="No listings available"
            emptyDescription="Be the first to post a listing!"
          />
        </section>
      </div>
    </div>
  );
}
