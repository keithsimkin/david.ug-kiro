import { Category } from '@shared/types';
import { Card, CardContent } from '../ui/card';

interface CategoryGridProps {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
  loading?: boolean;
}

export function CategoryGrid({ categories, onCategorySelect, loading }: CategoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No categories available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Card
          key={category.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => onCategorySelect(category)}
        >
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-3">{category.icon || '📦'}</div>
            <h3 className="font-semibold text-sm">{category.name}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
