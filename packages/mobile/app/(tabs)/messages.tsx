import React, { useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { ConversationList } from '../../components/messaging/ConversationList';
import { MessagingService, ConversationWithDetails } from '@shared/services/messaging.service';
import { useAuth } from '../../contexts/AuthContext';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const data = await MessagingService.getUserConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();

    // Subscribe to conversation updates
    if (user) {
      const subscription = MessagingService.subscribeToConversations(
        user.id,
        () => {
          loadConversations();
        }
      );

      return () => {
        MessagingService.unsubscribe(subscription);
      };
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Messages',
          headerLargeTitle: true,
        }}
      />
      <View style={styles.container}>
        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
