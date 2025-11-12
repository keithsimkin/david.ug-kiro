import { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '../types';

export interface UpdateProfileData {
  fullName?: string;
  username?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<{ profile: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { profile: null, error };
      }

      const profile: User = {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        email: '', // Will be populated from auth user
        phone: data.phone,
        location: data.location,
        avatarUrl: data.avatar_url,
        isAdmin: data.is_admin,
        isSuspended: data.is_suspended,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { profile, error: null };
    } catch (error) {
      return { profile: null, error: error as Error };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileData
  ): Promise<{ profile: User | null; error: Error | null }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.username !== undefined) updateData.username = data.username;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

      const { data: updatedData, error } = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { profile: null, error };
      }

      const profile: User = {
        id: updatedData.id,
        username: updatedData.username,
        fullName: updatedData.full_name,
        email: '', // Will be populated from auth user
        phone: updatedData.phone,
        location: updatedData.location,
        avatarUrl: updatedData.avatar_url,
        isAdmin: updatedData.is_admin,
        isSuspended: updatedData.is_suspended,
        createdAt: updatedData.created_at,
        updatedAt: updatedData.updated_at,
      };

      return { profile, error: null };
    } catch (error) {
      return { profile: null, error: error as Error };
    }
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(
    userId: string,
    file: File | Blob,
    fileName: string
  ): Promise<{ url: string | null; error: Error | null }> {
    try {
      const fileExt = fileName.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        return { url: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error as Error };
    }
  }

  /**
   * Delete avatar image
   */
  async deleteAvatar(userId: string): Promise<{ error: Error | null }> {
    try {
      // List all files in user's avatar folder
      const { data: files, error: listError } = await this.supabase.storage
        .from('avatars')
        .list(userId);

      if (listError) {
        return { error: listError };
      }

      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${userId}/${file.name}`);
        const { error: deleteError } = await this.supabase.storage
          .from('avatars')
          .remove(filePaths);

        if (deleteError) {
          return { error: deleteError };
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Validate username availability
   */
  async isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('profiles')
        .select('id')
        .eq('username', username);

      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }

      const { data, error } = await query.single();

      if (error && error.code === 'PGRST116') {
        // No rows returned, username is available
        return true;
      }

      return !data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate profile data
   */
  validateProfileData(data: UpdateProfileData, currentUserId?: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate full name
    if (data.fullName !== undefined) {
      if (!data.fullName || data.fullName.trim().length === 0) {
        errors.push({ field: 'fullName', message: 'Full name is required' });
      } else if (data.fullName.trim().length < 2) {
        errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' });
      } else if (data.fullName.trim().length > 100) {
        errors.push({ field: 'fullName', message: 'Full name must not exceed 100 characters' });
      }
    }

    // Validate username
    if (data.username !== undefined) {
      if (!data.username || data.username.trim().length === 0) {
        errors.push({ field: 'username', message: 'Username is required' });
      } else if (data.username.trim().length < 3) {
        errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
      } else if (data.username.trim().length > 30) {
        errors.push({ field: 'username', message: 'Username must not exceed 30 characters' });
      } else if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
        errors.push({ 
          field: 'username', 
          message: 'Username can only contain letters, numbers, hyphens, and underscores' 
        });
      }
    }

    // Validate phone
    if (data.phone !== undefined && data.phone.trim().length > 0) {
      // Basic phone validation - allows various formats
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push({ field: 'phone', message: 'Phone number contains invalid characters' });
      } else if (data.phone.replace(/\D/g, '').length < 7) {
        errors.push({ field: 'phone', message: 'Phone number is too short' });
      } else if (data.phone.length > 20) {
        errors.push({ field: 'phone', message: 'Phone number is too long' });
      }
    }

    // Validate location
    if (data.location !== undefined && data.location.trim().length > 0) {
      if (data.location.trim().length < 2) {
        errors.push({ field: 'location', message: 'Location must be at least 2 characters' });
      } else if (data.location.trim().length > 100) {
        errors.push({ field: 'location', message: 'Location must not exceed 100 characters' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate avatar file
   */
  validateAvatarFile(file: File | Blob, fileName: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      errors.push({ field: 'avatar', message: 'Avatar image must be less than 5MB' });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push({ 
        field: 'avatar', 
        message: 'Avatar must be a valid image file (JPEG, PNG, GIF, or WebP)' 
      });
    }

    // Check file extension
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      errors.push({ 
        field: 'avatar', 
        message: 'Avatar file must have a valid image extension' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
