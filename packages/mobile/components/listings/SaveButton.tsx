import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSavedListings } from '../../hooks/useSavedListings';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';

interface SaveButtonProps {
  listingId: string;
  size?: number;
  color?: string;
}

export const SaveButton = ({ 
  listingId, 
  size = 24,
  color = '#000'
}: SaveButtonProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const { isListingSaved, toggleSave } = useSavedListings();
  const [isLoading, setIsLoading] = useState(false);
  const isSaved = isListingSaved(listingId);

  const handlePress = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      setIsLoading(true);
      await toggleSave(listingId);
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <TouchableOpacity style={styles.button} disabled>
        <ActivityIndicator size="small" color={color} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={isSaved ? 'heart' : 'heart-outline'}
        size={size}
        color={isSaved ? '#ef4444' : color}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
