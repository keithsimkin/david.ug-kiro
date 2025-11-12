import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageThread } from '../components/messaging/MessageThread';
import { MessageInput } from '../components/messaging/MessageInput';
import { MessagingService } from '@shared/services/messaging.service';
import { useAuth } from '../contexts/AuthContext';
import type { Message, Conversation } from '@shared/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export const ConversationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/messages')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3 flex-1">
              {otherUser?.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.fullName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {otherUser?.fullName?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {otherUser?.fullName || 'Unknown User'}
                </h2>
                {conversation?.listing && (
                  <p className="text-sm text-gray-600">{conversation.listing.title}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          <MessageThread messages={messages} currentUserId={user?.id || ''} />
          <MessageInput onSend={handleSendMessage} disabled={isSending} />
        </div>
      </div>
    </div>
  );
};
