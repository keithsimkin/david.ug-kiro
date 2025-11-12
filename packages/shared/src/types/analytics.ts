// Analytics types

export interface AnalyticsEvent {
  id: string;
  listingId: string;
  userId?: string;
  eventType: 'view' | 'contact' | 'save' | 'share';
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DailyMetric {
  date: string;
  count: number;
}

export interface ListingAnalytics {
  listingId: string;
  views: number;
  contacts: number;
  saves: number;
  conversionRate: number;
  dailyViews: DailyMetric[];
  dailyContacts: DailyMetric[];
}

export interface UserAnalytics {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalContacts: number;
  totalSaves: number;
  averageViewsPerListing: number;
  averageContactsPerListing: number;
  conversionRate: number;
  topPerformingListings: ListingPerformance[];
  recentActivity: DailyMetric[];
}

export interface ListingPerformance {
  listingId: string;
  title: string;
  views: number;
  contacts: number;
  saves: number;
  conversionRate: number;
  createdAt: string;
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalContacts: number;
  dailyActiveUsers: DailyMetric[];
  dailyNewListings: DailyMetric[];
  dailyViews: DailyMetric[];
}

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
}
