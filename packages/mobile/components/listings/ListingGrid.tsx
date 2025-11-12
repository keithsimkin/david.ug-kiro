import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import type { Listing } from '@shared/types';
import { ListingCard } from './ListingCard';
import { ListingCardSkeleton } from './ListingCardSkeleton';
import { EmptyState } from './EmptyState';

interface ListingGridProps {
  listings: Listing[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  emptyMessage?: string;
  emptyDescription?: string;
}

export function ListingGrid({
  listings,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  emptyMessage = 'No listings found',
  emptyDescription = 'Try adjusting your search or filters',
}: ListingGridProps) {
  if (isLoading && listings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <ListingCardSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (!isLoading && listings.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <FlatList
      data={listings}
      renderItem={({ item }) => <ListingCard listing={item} />}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  row: {
    justifyContent: 'space-between',
  },
});
