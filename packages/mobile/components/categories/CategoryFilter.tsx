import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Category } from '@shared/types';

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Categories</Text>
        {selectedCategory && (
          <TouchableOpacity onPress={handleClearFilter}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedCategory && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>
            {selectedCategory.icon} {selectedCategory.name}
          </Text>
          <TouchableOpacity onPress={handleClearFilter} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategoryId === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => handleCategorySelect(category.id)}
            activeOpacity={0.7}
          >
            {category.icon && <Text style={styles.chipIcon}>{category.icon}</Text>}
            <Text
              style={[
                styles.chipText,
                selectedCategoryId === category.id && styles.chipTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  selectedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1e3a8a',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  chipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
});
