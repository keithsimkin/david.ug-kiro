import { SupabaseClient } from '@supabase/supabase-js';
import type { Listing } from '../types';

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  images: string[];
  contactPhone?: string;
  contactEmail?: string;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  location?: string;
  condition?: 'new' | 'used' | 'refurbished';
  images?: string[];
  contactPhone?: string;
  contactEmail?: string;
  status?: 'draft' | 'active' | 'sold' | 'expired' | 'deleted';
}

export interface ListingFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  condition?: string;
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'relevance';
  searchQuery?: string;
}

export interface PaginatedListings {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ListingService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Validate listing data
   */
  validateListing(data: CreateListingInput | UpdateListingInput): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // Title validation
    if ('title' in data && data.title !== undefined) {
      if (!data.title || data.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Title is required' });
      } else if (data.title.length < 5) {
        errors.push({ field: 'title', message: 'Title must be at least 5 characters' });
      } else if (data.title.length > 100) {
        errors.push({ field: 'title', message: 'Title must not exceed 100 characters' });
      }
    }

    // Description validation
    if ('description' in data && data.description !== undefined) {
      if (!data.description || data.description.trim().length === 0) {
        errors.push({ field: 'description', message: 'Description is required' });
      } else if (data.description.length < 20) {
        errors.push({ field: 'description', message: 'Description must be at least 20 characters' });
      } else if (data.description.length > 5000) {
        errors.push({ field: 'description', message: 'Description must not exceed 5000 characters' });
      }
    }

    // Price validation
    if ('price' in data && data.price !== undefined) {
      if (data.price < 0) {
        errors.push({ field: 'price', message: 'Price must be a positive number' });
      } else if (data.price > 999999999) {
        errors.push({ field: 'price', message: 'Price is too large' });
      }
    }

    // Category validation
    if ('categoryId' in data && data.categoryId !== undefined) {
      if (!data.categoryId || data.categoryId.trim().length === 0) {
        errors.push({ field: 'categoryId', message: 'Category is required' });
      }
    }

    // Location validation
    if ('location' in data && data.location !== undefined) {
      if (!data.location || data.location.trim().length === 0) {
        errors.push({ field: 'location', message: 'Location is required' });
      }
    }

    // Condition validation
    if ('condition' in data && data.condition !== undefined) {
      if (!['new', 'used', 'refurbished'].includes(data.condition)) {
        errors.push({ field: 'condition', message: 'Invalid condition value' });
      }
    }

    // Images validation
    if ('images' in data && data.images !== undefined) {
      if (!data.images || data.images.length === 0) {
        errors.push({ field: 'images', message: 'At least one image is required' });
      } else if (data.images.length > 10) {
        errors.push({ field: 'images', message: 'Maximum 10 images allowed' });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Create a new listing
   */
  async createListing(data: CreateListingInput): Promise<{ listing: Listing | null; error: Error | null }> {
    try {
      // Validate input
      const validation = this.validateListing(data);
      if (!validation.valid) {
        return {
          listing: null,
          error: new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`),
        };
      }

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { listing: null, error: new Error('User not authenticated') };
      }

      // Insert listing
      const { data: insertedData, error } = await this.supabase
        .from('listings')
        .insert({
          user_id: user.id,
          category_id: data.categoryId,
          title: data.title,
          description: data.description,
          price: data.price,
          currency: 'UGX',
          location: data.location,
          condition: data.condition,
          images: data.images,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          status: 'active',
          moderation_status: 'pending',
        })
        .select()
        .single();

      if (error) {
        return { listing: null, error };
      }

      const listing = this.mapDatabaseToListing(insertedData);
      return { listing, error: null };
    } catch (error) {
      return { listing: null, error: error as Error };
    }
  }

  /**
   * Get listing by ID
   */
  async getListingById(id: string): Promise<{ listing: Listing | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('listings')
        .select(`
          *,
          user:profiles!listings_user_id_fkey(id, username, full_name, avatar_url),
          category:categories!listings_category_id_fkey(id, name, slug, icon)
        `)
        .eq('id', id)
        .single();

      if (error) {
        return { listing: null, error };
      }

      const listing = this.mapDatabaseToListing(data);
      return { listing, error: null };
    } catch (error) {
      return { listing: null, error: error as Error };
    }
  }

  /**
   * Get listings with filters and pagination
   */
  async getListings(filters: ListingFilters = {}): Promise<{ result: PaginatedListings | null; error: Error | null }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('listings')
        .select(`
          *,
          user:profiles!listings_user_id_fkey(id, username, full_name, avatar_url),
          category:categories!listings_category_id_fkey(id, name, slug, icon)
        `, { count: 'exact' });

      // Apply filters
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'newest';
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'relevance':
          // For relevance, we'll use created_at as fallback
          // Full-text search relevance is handled in searchListings
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { result: null, error };
      }

      const listings = (data || []).map(this.mapDatabaseToListing);
      const total = count || 0;

      return {
        result: {
          listings,
          total,
          page,
          limit,
          hasMore: offset + limit < total,
        },
        error: null,
      };
    } catch (error) {
      return { result: null, error: error as Error };
    }
  }

  /**
   * Search listings with full-text search
   */
  async searchListings(
    searchQuery: string,
    filters: Omit<ListingFilters, 'searchQuery'> = {}
  ): Promise<{ result: PaginatedListings | null; error: Error | null }> {
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        // If no search query, return regular filtered listings
        return this.getListings(filters);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      // Use PostgreSQL full-text search
      let query = this.supabase
        .from('listings')
        .select(`
          *,
          user:profiles!listings_user_id_fkey(id, username, full_name, avatar_url),
          category:categories!listings_category_id_fkey(id, name, slug, icon)
        `, { count: 'exact' })
        .textSearch('title', searchQuery, {
          type: 'websearch',
          config: 'english',
        });

      // Apply additional filters
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        // Default to active listings for search
        query = query.eq('status', 'active');
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'relevance';
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'relevance':
          // For relevance, order by created_at (PostgreSQL text search ranking would require custom function)
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        return { result: null, error };
      }

      const listings = (data || []).map(this.mapDatabaseToListing);
      const total = count || 0;

      return {
        result: {
          listings,
          total,
          page,
          limit,
          hasMore: offset + limit < total,
        },
        error: null,
      };
    } catch (error) {
      return { result: null, error: error as Error };
    }
  }

  /**
   * Get featured listings (most viewed or recent)
   */
  async getFeaturedListings(limit: number = 10): Promise<{ listings: Listing[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('listings')
        .select(`
          *,
          user:profiles!listings_user_id_fkey(id, username, full_name, avatar_url),
          category:categories!listings_category_id_fkey(id, name, slug, icon)
        `)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { listings: [], error };
      }

      const listings = (data || []).map(this.mapDatabaseToListing);
      return { listings, error: null };
    } catch (error) {
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get recent listings
   */
  async getRecentListings(limit: number = 20): Promise<{ listings: Listing[]; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('listings')
        .select(`
          *,
          user:profiles!listings_user_id_fkey(id, username, full_name, avatar_url),
          category:categories!listings_category_id_fkey(id, name, slug, icon)
        `)
        .eq('status', 'active')
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { listings: [], error };
      }

      const listings = (data || []).map(this.mapDatabaseToListing);
      return { listings, error: null };
    } catch (error) {
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Get user's listings
   */
  async getUserListings(userId?: string): Promise<{ listings: Listing[]; error: Error | null }> {
    try {
      let targetUserId = userId;

      // If no userId provided, get current user
      if (!targetUserId) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) {
          return { listings: [], error: new Error('User not authenticated') };
        }
        targetUserId = user.id;
      }

      const { result, error } = await this.getListings({ userId: targetUserId, limit: 100 });

      if (error) {
        return { listings: [], error };
      }

      return { listings: result?.listings || [], error: null };
    } catch (error) {
      return { listings: [], error: error as Error };
    }
  }

  /**
   * Update listing
   */
  async updateListing(id: string, data: UpdateListingInput): Promise<{ listing: Listing | null; error: Error | null }> {
    try {
      // Validate input
      const validation = this.validateListing(data);
      if (!validation.valid) {
        return {
          listing: null,
          error: new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`),
        };
      }

      // Build update object
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.condition !== undefined) updateData.condition = data.condition;
      if (data.images !== undefined) updateData.images = data.images;
      if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
      if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
      if (data.status !== undefined) updateData.status = data.status;

      const { data: updatedData, error } = await this.supabase
        .from('listings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { listing: null, error };
      }

      const listing = this.mapDatabaseToListing(updatedData);
      return { listing, error: null };
    } catch (error) {
      return { listing: null, error: error as Error };
    }
  }

  /**
   * Delete listing
   */
  async deleteListing(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Update listing status
   */
  async updateListingStatus(
    id: string,
    status: 'draft' | 'active' | 'sold' | 'expired' | 'deleted'
  ): Promise<{ listing: Listing | null; error: Error | null }> {
    return this.updateListing(id, { status });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase.rpc('increment_view_count', { listing_id: id });

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Increment contact count
   */
  async incrementContactCount(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      const { error } = await this.supabase.rpc('increment_contact_count', { listing_id: id });

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Upload images to storage
   */
  async uploadImages(files: File[] | Blob[]): Promise<{ urls: string[]; error: Error | null }> {
    try {
      const urls: string[] = [];

      for (const file of files) {
        const { url, error } = await this.uploadImage(file);
        if (error) {
          return { urls: [], error };
        }
        if (url) {
          urls.push(url);
        }
      }

      return { urls, error: null };
    } catch (error) {
      return { urls: [], error: error as Error };
    }
  }

  /**
   * Upload single image with compression
   */
  async uploadImage(file: File | Blob): Promise<{ url: string | null; error: Error | null }> {
    try {
      // Generate unique filename
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      // Compress image if needed (basic implementation)
      let uploadFile = file;
      if (file.size > 1024 * 1024) { // If larger than 1MB
        uploadFile = await this.compressImage(file);
      }

      // Upload to Supabase Storage
      const { error: uploadError } = await this.supabase.storage
        .from('listing-images')
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      // Get public URL
      const { data } = this.supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      return { url: data.publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error as Error };
    }
  }

  /**
   * Compress image (basic implementation)
   */
  private async compressImage(file: File | Blob): Promise<Blob> {
    // This is a placeholder for image compression
    // In a real implementation, you would use a library like browser-image-compression
    // or canvas-based compression
    return file;
  }

  /**
   * Delete image from storage
   */
  async deleteImage(url: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Extract file path from URL
      const urlParts = url.split('/listing-images/');
      if (urlParts.length < 2) {
        return { success: false, error: new Error('Invalid image URL') };
      }

      const filePath = urlParts[1];

      const { error } = await this.supabase.storage
        .from('listing-images')
        .remove([filePath]);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  /**
   * Map database row to Listing type
   */
  private mapDatabaseToListing(data: any): Listing {
    return {
      id: data.id,
      userId: data.user_id,
      categoryId: data.category_id,
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      location: data.location,
      condition: data.condition,
      status: data.status,
      moderationStatus: data.moderation_status,
      images: data.images || [],
      contactPhone: data.contact_phone,
      contactEmail: data.contact_email,
      viewCount: data.view_count || 0,
      contactCount: data.contact_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      expiresAt: data.expires_at,
      user: data.user ? {
        id: data.user.id,
        username: data.user.username,
        fullName: data.user.full_name,
        email: '',
        avatarUrl: data.user.avatar_url,
        isAdmin: false,
        isSuspended: false,
        createdAt: '',
        updatedAt: '',
      } : undefined,
      category: data.category ? {
        id: data.category.id,
        name: data.category.name,
        slug: data.category.slug,
        icon: data.category.icon,
        displayOrder: 0,
        createdAt: '',
      } : undefined,
    };
  }
}
