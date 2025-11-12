import { SupabaseClient } from '@supabase/supabase-js';
import type { Category } from '../types';

export class CategoryService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all categories with optional parent filter
   */
  async getCategories(parentId?: string | null): Promise<{ categories: Category[]; error: Error | null }> {
    try {
      let query = this.supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      // Filter by parent_id if provided
      if (parentId !== undefined) {
        query = query.eq('parent_id', parentId);
      }

      const { data, error } = await query;

      if (error) {
        return { categories: [], error };
      }

      // Map database fields to Category type
      const categories: Category[] = (data || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        parentId: cat.parent_id,
        displayOrder: cat.display_order,
        createdAt: cat.created_at,
      }));

      return { categories, error: null };
    } catch (error) {
      return { categories: [], error: error as Error };
    }
  }

  /**
   * Get top-level categories (no parent)
   */
  async getTopLevelCategories(): Promise<{ categories: Category[]; error: Error | null }> {
    return this.getCategories(null);
  }

  /**
   * Get subcategories for a specific parent category
   */
  async getSubcategories(parentId: string): Promise<{ categories: Category[]; error: Error | null }> {
    return this.getCategories(parentId);
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: string): Promise<{ category: Category | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { category: null, error };
      }

      const category: Category = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        parentId: data.parent_id,
        displayOrder: data.display_order,
        createdAt: data.created_at,
      };

      return { category, error: null };
    } catch (error) {
      return { category: null, error: error as Error };
    }
  }

  /**
   * Get a single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<{ category: Category | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        return { category: null, error };
      }

      const category: Category = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        parentId: data.parent_id,
        displayOrder: data.display_order,
        createdAt: data.created_at,
      };

      return { category, error: null };
    } catch (error) {
      return { category: null, error: error as Error };
    }
  }

  /**
   * Get categories with their subcategories nested
   */
  async getCategoriesWithSubcategories(): Promise<{ categories: Category[]; error: Error | null }> {
    try {
      // Get all categories
      const { categories: allCategories, error } = await this.getCategories();

      if (error) {
        return { categories: [], error };
      }

      // Separate top-level and subcategories
      const topLevel = allCategories.filter((cat) => !cat.parentId);
      const subcategories = allCategories.filter((cat) => cat.parentId);

      // Nest subcategories under their parents
      const categoriesWithSubs = topLevel.map((parent) => ({
        ...parent,
        subcategories: subcategories.filter((sub) => sub.parentId === parent.id),
      }));

      return { categories: categoriesWithSubs, error: null };
    } catch (error) {
      return { categories: [], error: error as Error };
    }
  }
}
