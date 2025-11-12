import { getSupabase } from '../lib/supabase';
import type { SavedListing, Listing } from '../types';

export class SavedListingService {
  /**
   * Save a listing for the current user
   */
  static async saveListing(listingId: string): Promise<SavedListing> {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to save listings');
    }

    const { data, error } = await supabase
      .from('saved_listings')
      .insert({
        user_id: user.id,
        listing_id: listingId,
      })
      .select('*')
      .single();

    if (error) {
      // Handle duplicate save gracefully
      if (error.code === '23505') {
        throw new Error('Listing already saved');
      }
      throw new Error(`Failed to save listing: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      listingId: data.listing_id,
      createdAt: data.created_at,
    };
  }

  /**
   * Remove a saved listing for the current user
   */
  static async unsaveListing(listingId: string): Promise<void> {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to unsave listings');
    }

    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);

    if (error) {
      throw new Error(`Failed to unsave listing: ${error.message}`);
    }
  }

  /**
   * Get all saved listings for the current user
   */
  static async getSavedListings(): Promise<Listing[]> {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to view saved listings');
    }

    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        id,
        created_at,
        listing:listings (
          id,
          user_id,
          category_id,
          title,
          description,
          price,
          currency,
          location,
          condition,
          status,
          moderation_status,
          images,
          contact_phone,
          contact_email,
          view_count,
          contact_count,
          created_at,
          updated_at,
          expires_at,
          user:profiles (
            id,
            username,
            full_name,
            avatar_url
          ),
          category:categories (
            id,
            name,
            slug,
            icon
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch saved listings: ${error.message}`);
    }

    // Filter out any saved listings where the listing has been deleted
    const listings = data
      .filter(item => item.listing !== null)
      .map(item => {
        const listing = item.listing as any;
        return {
          id: listing.id,
          userId: listing.user_id,
          categoryId: listing.category_id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          currency: listing.currency,
          location: listing.location,
          condition: listing.condition,
          status: listing.status,
          moderationStatus: listing.moderation_status,
          images: listing.images || [],
          contactPhone: listing.contact_phone,
          contactEmail: listing.contact_email,
          viewCount: listing.view_count,
          contactCount: listing.contact_count,
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
          expiresAt: listing.expires_at,
          user: listing.user ? {
            id: listing.user.id,
            username: listing.user.username,
            fullName: listing.user.full_name,
            avatarUrl: listing.user.avatar_url,
          } : undefined,
          category: listing.category ? {
            id: listing.category.id,
            name: listing.category.name,
            slug: listing.category.slug,
            icon: listing.category.icon,
          } : undefined,
        } as Listing;
      });

    return listings;
  }

  /**
   * Check if a listing is saved by the current user
   */
  static async isListingSaved(listingId: string): Promise<boolean> {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle();

    if (error) {
      console.error('Error checking saved status:', error);
      return false;
    }

    return data !== null;
  }

  /**
   * Get saved listing IDs for the current user (for bulk checking)
   */
  static async getSavedListingIds(): Promise<string[]> {
    const supabase = getSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved listing IDs:', error);
      return [];
    }

    return data.map(item => item.listing_id);
  }
}
