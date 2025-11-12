import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MessageThread } from '../../components/messaging/MessageThread';
import { MessageInput } from '../../components/messaging/MessageInput';
import { MessagingService } from '@shared/services/messaging.service';
import { useAuth } from '../../contexts/AuthContext';
import type { Message, Conversation } from '@shared/types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    const loadData = async () => {
      try {
        // Load conversation details
        const convData = await MessagingService.getConversationById(id);
        setConversation(convData);

        // Load messages
        const messagesData = await MessagingService.getMessages(id);
        setMessages(messagesData);

        // Mark messages as read
        await MessagingService.markMessagesAsRead(id, user.id);
      } catch (error) {
        console.error('Failed to load conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to new messages
    const subscription = MessagingService.subscribeToMessages(id, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      
      // Mark as read if not sent by current user
      if (newMessage.senderId !== user.id) {
        MessagingService.markMessagesAsRead(id, user.id);
      }
    });

    return () => {
      MessagingService.unsubscribe(subscription);
    };
  }, [id, user]);

  const handleSendMessage = async (content: string) => {
    if (!id || !user || isSending) return;

    setIsSending(true);
    try {
      await MessagingService.sendMessage({
        conversationId: id,
        senderId: user.id,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const otherUser = conversation
    ? conversation.buyerId === user?.id
      ? conversation.seller
      : conversation.buyer
    : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: otherUser?.fullName || 'Conversation',
          headerBackTitle: 'Back',
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <>
            <MessageThread
              messages={messages}
              currentUserId={user?.id || ''}
            />
            <MessageInput onSend={handleSendMessage} disabled={isSending} />
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
