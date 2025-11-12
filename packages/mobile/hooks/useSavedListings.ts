import { useState, useEffect, useCallback } from 'react';
import { SavedListingService, Listing } from '@classified-marketplace/shared';

export const useSavedListings = () => {
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedListings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const listings = await SavedListingService.getSavedListings();
      setSavedListings(listings);
      setSavedListingIds(new Set(listings.map(l => l.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved listings');
      console.error('Error fetching saved listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSavedListingIds = useCallback(async () => {
    try {
      const ids = await SavedListingService.getSavedListingIds();
      setSavedListingIds(new Set(ids));
    } catch (err) {
      console.error('Error fetching saved listing IDs:', err);
    }
  }, []);

  const saveListing = useCallback(async (listingId: string) => {
    try {
      await SavedListingService.saveListing(listingId);
      setSavedListingIds(prev => new Set([...prev, listingId]));
      // Optionally refetch to get the full listing data
      await fetchSavedListings();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save listing';
      setError(message);
      throw err;
    }
  }, [fetchSavedListings]);

  const unsaveListing = useCallback(async (listingId: string) => {
    try {
      await SavedListingService.unsaveListing(listingId);
      setSavedListingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(listingId);
        return newSet;
      });
      setSavedListings(prev => prev.filter(l => l.id !== listingId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsave listing';
      setError(message);
      throw err;
    }
  }, []);

  const isListingSaved = useCallback((listingId: string) => {
    return savedListingIds.has(listingId);
  }, [savedListingIds]);

  const toggleSave = useCallback(async (listingId: string) => {
    if (isListingSaved(listingId)) {
      await unsaveListing(listingId);
    } else {
      await saveListing(listingId);
    }
  }, [isListingSaved, saveListing, unsaveListing]);

  useEffect(() => {
    fetchSavedListingIds();
  }, [fetchSavedListingIds]);

  return {
    savedListings,
    isLoading,
    error,
    saveListing,
    unsaveListing,
    isListingSaved,
    toggleSave,
    fetchSavedListings,
    refetch: fetchSavedListings,
  };
};
