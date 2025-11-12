import { useState, useEffect } from 'react';
import { AnalyticsService } from '@shared/services/analytics.service';
import { supabase } from '@shared/lib/supabase';
import type { UserAnalytics, ListingAnalytics } from '@shared/types/analytics';

const analyticsService = new AnalyticsService(supabase);

export function useUserAnalytics(userId: string | undefined, days: number = 30) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      const { analytics: data, error: err } = await analyticsService.getUserAnalytics(userId, days);

      if (err) {
        setError(err);
      } else {
        setAnalytics(data);
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [userId, days]);

  return { analytics, loading, error };
}

export function useListingAnalytics(listingId: string | undefined, days: number = 30) {
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!listingId) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);

      const { analytics: data, error: err } = await analyticsService.getListingAnalytics(listingId, days);

      if (err) {
        setError(err);
      } else {
        setAnalytics(data);
      }

      setLoading(false);
    };

    fetchAnalytics();
  }, [listingId, days]);

  return { analytics, loading, error };
}
