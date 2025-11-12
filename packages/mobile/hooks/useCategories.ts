import { useState, useEffect } from 'react';
import { Category } from '@shared/types';
import { CategoryService } from '@shared/services/category.service';
import { supabase } from '../lib/supabase';

const categoryService = new CategoryService(supabase);

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);

    const { categories: data, error: err } = await categoryService.getTopLevelCategories();

    if (err) {
      setError(err);
    } else {
      setCategories(data);
    }

    setLoading(false);
  };

  const getCategoryById = async (id: string) => {
    const { category, error: err } = await categoryService.getCategoryById(id);
    if (err) {
      setError(err);
      return null;
    }
    return category;
  };

  const getSubcategories = async (parentId: string) => {
    const { categories: data, error: err } = await categoryService.getSubcategories(parentId);
    if (err) {
      setError(err);
      return [];
    }
    return data;
  };

  return {
    categories,
    loading,
    error,
    refetch: loadCategories,
    getCategoryById,
    getSubcategories,
  };
}
