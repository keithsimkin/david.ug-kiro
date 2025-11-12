# Services

This directory contains shared service classes that interact with the Supabase backend.

## CategoryService

The `CategoryService` provides methods for fetching and managing categories.

### Methods

- `getCategories(parentId?)` - Get all categories, optionally filtered by parent
- `getTopLevelCategories()` - Get only top-level categories (no parent)
- `getSubcategories(parentId)` - Get subcategories for a specific parent
- `getCategoryById(id)` - Get a single category by ID
- `getCategoryBySlug(slug)` - Get a single category by slug
- `getCategoriesWithSubcategories()` - Get categories with nested subcategories

### Usage Example

```typescript
import { CategoryService } from '@shared/services/category.service';
import { supabase } from './lib/supabase';

const categoryService = new CategoryService(supabase);

// Get all top-level categories
const { categories, error } = await categoryService.getTopLevelCategories();

// Get subcategories
const { categories: subs } = await categoryService.getSubcategories(parentId);
```

## AuthService

Handles user authentication operations including sign up, sign in, and session management.

## ProfileService

Manages user profile data and updates.
