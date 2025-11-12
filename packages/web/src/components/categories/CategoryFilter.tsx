import { useState, useEffect } from 'react';
import { Category } from '@shared/types';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategoryId?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  loading?: boolean;
}

export function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  loading,
}: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find((cat) => cat.id === selectedCategoryId);
      setSelectedCategory(category);
    } else {
      setSelectedCategory(undefined);
    }
  }, [selectedCategoryId, categories]);

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const handleClearFilter = () => {
    onCategoryChange(undefined);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Categories</h3>
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            className="h-auto py-1 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {selectedCategory && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-200">
          <span className="text-sm font-medium text-blue-900">
            {selectedCategory.icon} {selectedCategory.name}
          </span>
          <button
            onClick={handleClearFilter}
            className="ml-auto text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategoryId === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategorySelect(category.id)}
            className="text-xs"
          >
            {category.icon && <span className="mr-1">{category.icon}</span>}
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
