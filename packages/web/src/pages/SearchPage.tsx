import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CategoryFilter } from '../components/categories';
import { ListingGrid } from '../components/listings/ListingGrid';
import { useCategories } from '../hooks/useCategories';
import { Listing } from '@shared/types';
import { ListingService } from '@shared/services/listing.service';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const listingService = new ListingService(supabase);

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'relevance'>('newest');

  // Initialize from URL params
  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    const minPriceParam = searchParams.get('minPrice');
    const maxPriceParam = searchParams.get('maxPrice');
    const locationParam = searchParams.get('location');
    const conditionParam = searchParams.get('condition');
    const sortParam = searchParams.get('sort');

    if (q) setSearchQuery(q);
    if (category) setSelectedCategoryId(category);
    if (minPriceParam) setMinPrice(minPriceParam);
    if (maxPriceParam) setMaxPrice(maxPriceParam);
    if (locationParam) setLocation(locationParam);
    if (conditionParam) setCondition(conditionParam);
    if (sortParam && ['newest', 'price_asc', 'price_desc', 'relevance'].includes(sortParam)) {
      setSortBy(sortParam as any);
    }
  }, []);

  // Search listings when filters change
  useEffect(() => {
    searchListings(1);
  }, [selectedCategoryId, minPrice, maxPrice, location, condition, sortBy]);

  const searchListings = async (pageNum: number) => {
    setLoading(true);
    
    const filters = {
      categoryId: selectedCategoryId,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      location: location || undefined,
      condition: condition || undefined,
      sortBy,
      page: pageNum,
      limit: 20,
      status: 'active' as const,
    };

    let result;
    if (searchQuery.trim()) {
      result = await listingService.searchListings(searchQuery, filters);
    } else {
      result = await listingService.getListings(filters);
    }

    if (!result.error && result.result) {
      if (pageNum === 1) {
        setListings(result.result.listings);
      } else {
        setListings(prev => [...prev, ...result.result!.listings]);
      }
      setHasMore(result.result.hasMore);
      setTotal(result.result.total);
      setPage(pageNum);
    }
    
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLParams();
    searchListings(1);
  };

  const updateURLParams = () => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (selectedCategoryId) params.category = selectedCategoryId;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (location) params.location = location;
    if (condition) params.condition = condition;
    if (sortBy !== 'newest') params.sort = sortBy;
    setSearchParams(params);
  };

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      searchListings(page + 1);
    }
  };

  const clearFilters = () => {
    setSelectedCategoryId(undefined);
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setCondition(undefined);
    setSortBy('newest');
    setSearchParams({});
  };

  const activeFiltersCount = [
    selectedCategoryId,
    minPrice,
    maxPrice,
    location,
    condition,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search for items, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            <Button type="submit">Search</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <CategoryFilter
                  categories={categories}
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={handleCategoryChange}
                  loading={categoriesLoading}
                />
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Min Price</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Price</label>
                  <Input
                    type="number"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  type="text"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select
                  value={condition || ''}
                  onChange={(e) => setCondition(e.target.value || undefined)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Any</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  {searchQuery && <option value="relevance">Most Relevant</option>}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            {total > 0 ? `Found ${total} listing${total !== 1 ? 's' : ''}` : 'No listings found'}
          </p>
        </div>

        <ListingGrid
          listings={listings}
          isLoading={loading && page === 1}
          emptyMessage="No listings found"
          emptyDescription="Try adjusting your search or filters"
        />

        {/* Load More */}
        {hasMore && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleLoadMore}
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
