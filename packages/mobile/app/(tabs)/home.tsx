import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CategoryGrid } from '../../components/categories';
import { ListingGrid } from '../../components/listings/ListingGrid';
import { useCategories } from '../../hooks/useCategories';
import { Category, Listing } from '@shared/types';
import { ListingService } from '@shared/services/listing.service';
import { supabase } from '../../lib/supabase';

const listingService = new ListingService(supabase);

export default function HomeScreen() {
  const router = useRouter();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadFeaturedListings(),
      loadRecentListings(),
    ]);
  };

  const loadFeaturedListings = async () => {
    setLoadingFeatured(true);
    const { listings, error } = await listingService.getFeaturedListings(6);
    if (!error && listings) {
      setFeaturedListings(listings);
    }
    setLoadingFeatured(false);
  };

  const loadRecentListings = async () => {
    setLoadingRecent(true);
    const { listings, error } = await listingService.getRecentListings(10);
    if (!error && listings) {
      setRecentListings(listings);
    }
    setLoadingRecent(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCategorySelect = (category: Category) => {
    router.push(`/search?category=${category.id}`);
  };

  const handleSearchPress = () => {
    router.push('/search');
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section with Search */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find What You Need</Text>
        <Text style={styles.heroSubtitle}>
          Browse thousands of listings in your area
        </Text>
        <TouchableOpacity 
          style={styles.searchBar}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color="#666" />
          <Text style={styles.searchPlaceholder}>
            Search for items, services...
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <Text style={styles.sectionSubtitle}>
            Explore our wide range of categories
          </Text>
        </View>

        {categoriesError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Failed to load categories: {categoriesError.message}
            </Text>
          </View>
        )}

        <CategoryGrid
          categories={categories}
          onCategorySelect={handleCategorySelect}
          loading={categoriesLoading}
        />
      </View>

      {/* Featured Listings Section */}
      {featuredListings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Listings</Text>
            <Text style={styles.sectionSubtitle}>
              Popular items in your area
            </Text>
          </View>

          <ListingGrid
            listings={featuredListings}
            isLoading={loadingFeatured}
            isRefreshing={refreshing}
            onRefresh={handleRefresh}
            emptyMessage="No featured listings available"
          />
        </View>
      )}

      {/* Recent Listings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <Text style={styles.sectionSubtitle}>
            Latest items posted
          </Text>
        </View>

        <ListingGrid
          listings={recentListings}
          isLoading={loadingRecent}
          isRefreshing={refreshing}
          onRefresh={handleRefresh}
          emptyMessage="No listings available"
          emptyDescription="Be the first to post a listing!"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  hero: {
    backgroundColor: '#2563eb',
    padding: 24,
    paddingTop: 32,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#dbeafe',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
});
