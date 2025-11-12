import { SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalyticsEvent,
  ListingAnalytics,
  UserAnalytics,
  PlatformAnalytics,
  DailyMetric,
  ListingPerformance,
} from '../types/analytics';

export class AnalyticsService {
  private eventQueue: Omit<AnalyticsEvent, 'id' | 'createdAt'>[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 5000; // 5 seconds

  constructor(private supabase: SupabaseClient) {}

  /**
   * Track a view event
   */
  async trackView(listingId: string, userId?: string): Promise<{ success: boolean; error: Error | null }> {
    return this.trackEvent(listingId, 'view', userId);
  }

  /**
   * Track a contact event
   */
  async trackContact(listingId: string, userId?: string): Promise<{ success: boolean; error: Error | null }> {
    return this.trackEvent(listingId, 'contact', userId);
  }

  /**
   * Track a save event
   */
  async trackSave(listingId: string, userId: string): Promise<{ success: boolean; error: Error | null }> {
    return this.trackEvent(listingId, 'save', userId);
  }

  /**
   * Track a share event
   */
  async trackShare(listingId: string, userId?: string): Promise<{ success: boolean; error: Error | null }> {
    return this.trackEvent(listingId, 'share', userId);
  }

  /**
   * Track an analytics event with batching
   */
  private async trackEvent(
    listingId: string,
    eventType: 'view' | 'contact' | 'save' | 'share',
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Add event to queue
      this.eventQueue.push({
        listingId,
        userId,
        eventType,
        metadata,
      });

      // If queue is full, flush immediately
      if (this.eventQueue.length >= this.BATCH_SIZE) {
        await this.flushEventQueue();
      } else {
        // Otherwise, schedule a flush
        this.scheduleBatchFlush();
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Schedule a batch flush
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimeout) {
      return; // Already scheduled
    }

    this.batchTimeout = setTimeout(() => {
      this.flushEventQueue();
    }, this.BATCH_DELAY);
  }

  /**
   * Flush the event queue to the database
   */
  private async flushEventQueue(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await this.supabase.from('analytics_events').insert(
        eventsToFlush.map((event) => ({
          listing_id: event.listingId,
          user_id: event.userId,
          event_type: event.eventType,
          metadata: event.metadata,
        }))
      );

      if (error) {
        console.error('Failed to flush analytics events:', error);
        // Re-add events to queue on failure
        this.eventQueue.push(...eventsToFlush);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events to queue on failure
      this.eventQueue.push(...eventsToFlush);
    }
  }

  /**
   * Get analytics for a specific listing
   */
  async getListingAnalytics(
    listingId: string,
    days: number = 30
  ): Promise<{ analytics: ListingAnalytics | null; error: Error | null }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total counts
      const { data: events, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('listing_id', listingId)
        .gte('created_at', startDate.toISOString());

      if (eventsError) {
        return { analytics: null, error: eventsError };
      }

      // Calculate metrics
      const views = events?.filter((e) => e.event_type === 'view').length || 0;
      const contacts = events?.filter((e) => e.event_type === 'contact').length || 0;
      const saves = events?.filter((e) => e.event_type === 'save').length || 0;
      const conversionRate = views > 0 ? (contacts / views) * 100 : 0;

      // Calculate daily views
      const dailyViews = this.aggregateDailyMetrics(
        events?.filter((e) => e.event_type === 'view') || [],
        days
      );

      // Calculate daily contacts
      const dailyContacts = this.aggregateDailyMetrics(
        events?.filter((e) => e.event_type === 'contact') || [],
        days
      );

      const analytics: ListingAnalytics = {
        listingId,
        views,
        contacts,
        saves,
        conversionRate: Math.round(conversionRate * 100) / 100,
        dailyViews,
        dailyContacts,
      };

      return { analytics, error: null };
    } catch (error) {
      return { analytics: null, error: error as Error };
    }
  }

  /**
   * Get analytics for a user's listings
   */
  async getUserAnalytics(
    userId: string,
    days: number = 30
  ): Promise<{ analytics: UserAnalytics | null; error: Error | null }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's listings
      const { data: listings, error: listingsError } = await this.supabase
        .from('listings')
        .select('id, title, status, created_at')
        .eq('user_id', userId);

      if (listingsError) {
        return { analytics: null, error: listingsError };
      }

      const totalListings = listings?.length || 0;
      const activeListings = listings?.filter((l) => l.status === 'active').length || 0;

      if (totalListings === 0) {
        return {
          analytics: {
            totalListings: 0,
            activeListings: 0,
            totalViews: 0,
            totalContacts: 0,
            totalSaves: 0,
            averageViewsPerListing: 0,
            averageContactsPerListing: 0,
            conversionRate: 0,
            topPerformingListings: [],
            recentActivity: [],
          },
          error: null,
        };
      }

      const listingIds = listings?.map((l) => l.id) || [];

      // Get analytics events for all user's listings
      const { data: events, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('listing_id, event_type, created_at')
        .in('listing_id', listingIds)
        .gte('created_at', startDate.toISOString());

      if (eventsError) {
        return { analytics: null, error: eventsError };
      }

      // Calculate total metrics
      const totalViews = events?.filter((e) => e.event_type === 'view').length || 0;
      const totalContacts = events?.filter((e) => e.event_type === 'contact').length || 0;
      const totalSaves = events?.filter((e) => e.event_type === 'save').length || 0;

      const averageViewsPerListing = totalListings > 0 ? totalViews / totalListings : 0;
      const averageContactsPerListing = totalListings > 0 ? totalContacts / totalListings : 0;
      const conversionRate = totalViews > 0 ? (totalContacts / totalViews) * 100 : 0;

      // Calculate per-listing performance
      const listingPerformance: Map<string, { views: number; contacts: number; saves: number }> = new Map();

      events?.forEach((event) => {
        const current = listingPerformance.get(event.listing_id) || { views: 0, contacts: 0, saves: 0 };
        if (event.event_type === 'view') current.views++;
        if (event.event_type === 'contact') current.contacts++;
        if (event.event_type === 'save') current.saves++;
        listingPerformance.set(event.listing_id, current);
      });

      // Build top performing listings
      const topPerformingListings: ListingPerformance[] = listings
        ?.map((listing) => {
          const perf = listingPerformance.get(listing.id) || { views: 0, contacts: 0, saves: 0 };
          return {
            listingId: listing.id,
            title: listing.title,
            views: perf.views,
            contacts: perf.contacts,
            saves: perf.saves,
            conversionRate: perf.views > 0 ? (perf.contacts / perf.views) * 100 : 0,
            createdAt: listing.created_at,
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 5) || [];

      // Calculate recent activity (daily views)
      const recentActivity = this.aggregateDailyMetrics(
        events?.filter((e) => e.event_type === 'view') || [],
        days
      );

      const analytics: UserAnalytics = {
        totalListings,
        activeListings,
        totalViews,
        totalContacts,
        totalSaves,
        averageViewsPerListing: Math.round(averageViewsPerListing * 100) / 100,
        averageContactsPerListing: Math.round(averageContactsPerListing * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topPerformingListings,
        recentActivity,
      };

      return { analytics, error: null };
    } catch (error) {
      return { analytics: null, error: error as Error };
    }
  }

  /**
   * Get platform-wide analytics (admin only)
   */
  async getPlatformAnalytics(
    days: number = 30
  ): Promise<{ analytics: PlatformAnalytics | null; error: Error | null }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total users
      const { count: totalUsers, error: usersError } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        return { analytics: null, error: usersError };
      }

      // Get active users (users who created events in the period)
      const { data: activeUserEvents, error: activeUsersError } = await this.supabase
        .from('analytics_events')
        .select('user_id')
        .gte('created_at', startDate.toISOString())
        .not('user_id', 'is', null);

      if (activeUsersError) {
        return { analytics: null, error: activeUsersError };
      }

      const activeUsers = new Set(activeUserEvents?.map((e) => e.user_id)).size;

      // Get total listings
      const { count: totalListings, error: listingsError } = await this.supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      if (listingsError) {
        return { analytics: null, error: listingsError };
      }

      // Get active listings
      const { count: activeListings, error: activeListingsError } = await this.supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (activeListingsError) {
        return { analytics: null, error: activeListingsError };
      }

      // Get all events in the period
      const { data: events, error: eventsError } = await this.supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .gte('created_at', startDate.toISOString());

      if (eventsError) {
        return { analytics: null, error: eventsError };
      }

      const totalViews = events?.filter((e) => e.event_type === 'view').length || 0;
      const totalContacts = events?.filter((e) => e.event_type === 'contact').length || 0;

      // Get daily active users
      const { data: dailyUserEvents, error: dailyUsersError } = await this.supabase
        .from('analytics_events')
        .select('user_id, created_at')
        .gte('created_at', startDate.toISOString())
        .not('user_id', 'is', null);

      if (dailyUsersError) {
        return { analytics: null, error: dailyUsersError };
      }

      const dailyActiveUsers = this.aggregateDailyUniqueUsers(dailyUserEvents || [], days);

      // Get daily new listings
      const { data: newListings, error: newListingsError } = await this.supabase
        .from('listings')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      if (newListingsError) {
        return { analytics: null, error: newListingsError };
      }

      const dailyNewListings = this.aggregateDailyMetrics(newListings || [], days);

      // Get daily views
      const dailyViews = this.aggregateDailyMetrics(
        events?.filter((e) => e.event_type === 'view') || [],
        days
      );

      const analytics: PlatformAnalytics = {
        totalUsers: totalUsers || 0,
        activeUsers,
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        totalViews,
        totalContacts,
        dailyActiveUsers,
        dailyNewListings,
        dailyViews,
      };

      return { analytics, error: null };
    } catch (error) {
      return { analytics: null, error: error as Error };
    }
  }

  /**
   * Aggregate events into daily metrics
   */
  private aggregateDailyMetrics(events: Array<{ created_at: string }>, days: number): DailyMetric[] {
    const dailyMap = new Map<string, number>();

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, 0);
    }

    // Count events per day
    events.forEach((event) => {
      const dateStr = event.created_at.split('T')[0];
      if (dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
      }
    });

    // Convert to array and sort by date
    return Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregate unique users per day
   */
  private aggregateDailyUniqueUsers(
    events: Array<{ user_id: string; created_at: string }>,
    days: number
  ): DailyMetric[] {
    const dailyMap = new Map<string, Set<string>>();

    // Initialize all days with empty sets
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap.set(dateStr, new Set());
    }

    // Add unique users per day
    events.forEach((event) => {
      const dateStr = event.created_at.split('T')[0];
      if (dailyMap.has(dateStr)) {
        dailyMap.get(dateStr)?.add(event.user_id);
      }
    });

    // Convert to array and sort by date
    return Array.from(dailyMap.entries())
      .map(([date, userSet]) => ({ date, count: userSet.size }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Force flush any pending events (useful for cleanup)
   */
  async flush(): Promise<void> {
    await this.flushEventQueue();
  }
}
