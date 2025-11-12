import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavedListings } from '../hooks/useSavedListings';
import { ListingCard } from '../components/listings/ListingCard';
import { EmptyState } from '../components/listings/EmptyState';
import type { Listing } from '@shared/types';

export default function SavedListingsScreen() {
  const { savedListings, isLoading, error, fetchSavedListings } = useSavedListings();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchSavedListings();
  }, [fetchSavedListings]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedListings();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Listing }) => (
    <View style={styles.cardWrapper}>
      <ListingCard listing={item} />
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading saved listings...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <EmptyState
        icon="heart-outline"
        message="No saved listings"
        description="Start saving listings you're interested in to view them here"
      />
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Saved Listings',
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <View style={styles.container}>
        {savedListings.length > 0 && (
          <View style={styles.header}>
            <View style={styles.countContainer}>
              <Ionicons name="heart" size={20} color="#ef4444" />
              <Text style={styles.countText}>{savedListings.length} saved</Text>
            </View>
          </View>
        )}

        <FlatList
          data={savedListings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            savedListings.length === 0 && styles.emptyContent,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2563eb']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  emptyContent: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    marginBottom: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
});
