import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useUserAnalytics } from '../hooks/useAnalytics';
import {
  MetricCard,
  SimpleLineChart,
  ListingPerformanceTable,
  DateRangeSelector,
} from '../components/analytics';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState(30);
  const { analytics, loading, error } = useUserAnalytics(user?.id, dateRange);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load analytics</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analytics Dashboard</Text>
          <Text style={styles.subtitle}>Track your listing performance</Text>
        </View>
      </View>

      {/* Date Range Selector */}
      <View style={styles.section}>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </View>

      {/* Metrics Summary */}
      <View style={styles.section}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricRow}>
            <View style={styles.metricHalf}>
              <MetricCard
                title="Total Listings"
                value={analytics.totalListings}
                subtitle={`${analytics.activeListings} active`}
                icon={<Ionicons name="list" size={20} color="#666" />}
              />
            </View>
            <View style={styles.metricHalf}>
              <MetricCard
                title="Total Views"
                value={analytics.totalViews.toLocaleString()}
                subtitle={`${analytics.averageViewsPerListing.toFixed(1)} avg`}
                icon={<Ionicons name="eye" size={20} color="#666" />}
              />
            </View>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricHalf}>
              <MetricCard
                title="Total Contacts"
                value={analytics.totalContacts.toLocaleString()}
                subtitle={`${analytics.averageContactsPerListing.toFixed(1)} avg`}
                icon={<Ionicons name="chatbubble" size={20} color="#666" />}
              />
            </View>
            <View style={styles.metricHalf}>
              <MetricCard
                title="Conversion Rate"
                value={`${analytics.conversionRate.toFixed(1)}%`}
                subtitle="Views to contacts"
                icon={<Ionicons name="trending-up" size={20} color="#666" />}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Views Chart */}
      <View style={styles.section}>
        <Card style={styles.card}>
          <Card.Title title="Views Over Time" />
          <Card.Content>
            <SimpleLineChart data={analytics.recentActivity} color="#3b82f6" height={200} />
          </Card.Content>
        </Card>
      </View>

      {/* Engagement Summary */}
      <View style={styles.section}>
        <Card style={styles.card}>
          <Card.Title title="Engagement Summary" />
          <Card.Content>
            <View style={styles.engagementItem}>
              <Text style={styles.engagementLabel}>Total Views</Text>
              <Text style={styles.engagementValue}>{analytics.totalViews}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#3b82f6' }]} />
            </View>

            <View style={styles.engagementItem}>
              <Text style={styles.engagementLabel}>Total Contacts</Text>
              <Text style={styles.engagementValue}>{analytics.totalContacts}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      analytics.totalViews > 0 ? `${(analytics.totalContacts / analytics.totalViews) * 100}%` : '0%',
                    backgroundColor: '#10b981',
                  },
                ]}
              />
            </View>

            <View style={styles.engagementItem}>
              <Text style={styles.engagementLabel}>Total Saves</Text>
              <Text style={styles.engagementValue}>{analytics.totalSaves}</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: analytics.totalViews > 0 ? `${(analytics.totalSaves / analytics.totalViews) * 100}%` : '0%',
                    backgroundColor: '#8b5cf6',
                  },
                ]}
              />
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Top Performing Listings */}
      <View style={styles.section}>
        <ListingPerformanceTable listings={analytics.topPerformingListings} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  metricsGrid: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricHalf: {
    flex: 1,
  },
  card: {
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  engagementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  engagementLabel: {
    fontSize: 14,
    color: '#666',
  },
  engagementValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
