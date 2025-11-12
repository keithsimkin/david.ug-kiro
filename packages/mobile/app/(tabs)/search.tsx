import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryFilter } from '../../components/categories';
import { ListingGrid } from '../../components/listings/ListingGrid';
import { useCategories } from '../../hooks/useCategories';
import { Listing } from '@shared/types';
import { ListingService } from '@shared/services/listing.service';
import { supabase } from '../../lib/supabase';

const listingService = new ListingService(supabase);

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const { categories, loading: categoriesLoading } = useCategories();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
    if (params.q && typeof params.q === 'string') {
      setSearchQuery(params.q);
    }
    if (params.category && typeof params.category === 'string') {
      setSelectedCategoryId(params.category);
    }
  }, [params]);

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
        setListings((prev) => [...prev, ...result.result!.listings]);
      }
      setHasMore(result.result.hasMore);
      setTotal(result.result.total);
      setPage(pageNum);
    }

    setLoading(false);
  };

  const handleSearch = () => {
    searchListings(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await searchListings(1);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      searchListings(page + 1);
    }
  };

  const handleCategoryChange = (categoryId: string | undefined) => {
    setSelectedCategoryId(categoryId);
  };

  const clearFilters = () => {
    setSelectedCategoryId(undefined);
    setMinPrice('');
    setMaxPrice('');
    setLocation('');
    setCondition(undefined);
    setSortBy('newest');
  };

  const activeFiltersCount = [
    selectedCategoryId,
    minPrice,
    maxPrice,
    location,
    condition,
  ].filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for items, services..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={24} color="#2563eb" />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {total > 0 ? `Found ${total} listing${total !== 1 ? 's' : ''}` : 'No listings found'}
        </Text>
      </View>

      {/* Listings */}
      <ListingGrid
        listings={listings}
        isLoading={loading && page === 1}
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        emptyMessage="No listings found"
        emptyDescription="Try adjusting your search or filters"
      />

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <CategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={handleCategoryChange}
                loading={categoriesLoading}
              />
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter location"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            {/* Condition */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Condition</Text>
              <View style={styles.conditionButtons}>
                {['any', 'new', 'used', 'refurbished'].map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.conditionButton,
                      (cond === 'any' ? !condition : condition === cond) &&
                        styles.conditionButtonActive,
                    ]}
                    onPress={() => setCondition(cond === 'any' ? undefined : cond)}
                  >
                    <Text
                      style={[
                        styles.conditionButtonText,
                        (cond === 'any' ? !condition : condition === cond) &&
                          styles.conditionButtonTextActive,
                      ]}
                    >
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              {[
                { value: 'newest', label: 'Newest First' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                ...(searchQuery ? [{ value: 'relevance', label: 'Most Relevant' }] : []),
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.sortOption}
                  onPress={() => setSortBy(option.value as any)}
                >
                  <Text style={styles.sortOptionText}>{option.label}</Text>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={24} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setShowFilters(false);
                searchListings(1);
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
  },
  priceSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#666',
  },
  conditionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  conditionButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  conditionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  conditionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
