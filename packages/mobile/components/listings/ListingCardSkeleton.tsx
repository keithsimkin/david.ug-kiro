import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export function ListingCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.imageSkeleton} />
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.priceSkeleton} />
        <View style={styles.locationSkeleton} />
        <View style={styles.footer}>
          <View style={styles.dateSkeleton} />
          <View style={styles.viewSkeleton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageSkeleton: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: 12,
  },
  titleSkeleton: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
  },
  priceSkeleton: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '60%',
    marginBottom: 8,
  },
  locationSkeleton: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: '50%',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateSkeleton: {
    height: 11,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: 60,
  },
  viewSkeleton: {
    height: 11,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    width: 40,
  },
});
