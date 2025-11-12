import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { ListingPerformance } from '@shared/types/analytics';

interface ListingPerformanceTableProps {
  listings: ListingPerformance[];
}

export function ListingPerformanceTable({ listings }: ListingPerformanceTableProps) {
  if (!listings || listings.length === 0) {
    return (
      <Card style={styles.card}>
        <Card.Title title="Top Performing Listings" />
        <Card.Content>
          <Text style={styles.emptyText}>No listings data available</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="Top Performing Listings" />
      <Card.Content>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header */}
            <View style={styles.row}>
              <Text style={[styles.cell, styles.headerCell, styles.titleCell]}>Listing</Text>
              <Text style={[styles.cell, styles.headerCell, styles.numberCell]}>Views</Text>
              <Text style={[styles.cell, styles.headerCell, styles.numberCell]}>Contacts</Text>
              <Text style={[styles.cell, styles.headerCell, styles.numberCell]}>Saves</Text>
              <Text style={[styles.cell, styles.headerCell, styles.numberCell]}>Conv. Rate</Text>
            </View>

            {/* Data rows */}
            {listings.map((listing, index) => (
              <View key={listing.listingId} style={[styles.row, styles.dataRow]}>
                <View style={[styles.cell, styles.titleCell]}>
                  <Text style={styles.titleText} numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <Text style={styles.dateText}>{new Date(listing.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.cell, styles.numberCell, styles.dataText]}>{listing.views}</Text>
                <Text style={[styles.cell, styles.numberCell, styles.dataText]}>{listing.contacts}</Text>
                <Text style={[styles.cell, styles.numberCell, styles.dataText]}>{listing.saves}</Text>
                <Text style={[styles.cell, styles.numberCell, styles.dataText, styles.boldText]}>
                  {listing.conversionRate.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 32,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dataRow: {
    minHeight: 60,
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerCell: {
    backgroundColor: '#f9fafb',
  },
  titleCell: {
    width: 200,
  },
  numberCell: {
    width: 80,
    textAlign: 'right',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  dataText: {
    fontSize: 14,
  },
  boldText: {
    fontWeight: '600',
  },
});
