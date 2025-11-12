import React, { useEffect, useState } from 'react';
import { ConversationList } from '../components/messaging/ConversationList';
import { MessagingService, ConversationWithDetails } from '@shared/services/messaging.service';
import { useAuth } from '../contexts/AuthContext';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const data = await MessagingService.getUserConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    // Subscribe to conversation updates
    if (user) {
      const subscription = MessagingService.subscribeToConversations(user.id, () => {
        loadConversations();
      });

      return () => {
        MessagingService.unsubscribe(subscription);
      };
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow">
          <ConversationList
            conversations={conversations}
            currentUserId={user.id}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
