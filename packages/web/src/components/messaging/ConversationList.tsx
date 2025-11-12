import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { ConversationWithDetails } from '@shared/services/messaging.service';

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  isLoading,
}) => {
  const navigate = useNavigate();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-600">Start a conversation by contacting a seller</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const otherUser =
          conversation.buyerId === currentUserId ? conversation.seller : conversation.buyer;
        const hasUnread = (conversation.unreadCount || 0) > 0;

        return (
          <div
            key={conversation.id}
            onClick={() => navigate(`/conversation/${conversation.id}`)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="relative flex-shrink-0">
                {otherUser?.avatarUrl ? (
                  <img
                    src={otherUser.avatarUrl}
                    alt={otherUser.fullName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-lg font-semibold">
                      {otherUser?.fullName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {hasUnread && (
                  <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3
                    className={`text-sm font-medium truncate ${
                      hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-900'
                    }`}
                  >
                    {otherUser?.fullName || 'Unknown User'}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-600 truncate mb-1">
                  {conversation.listing?.title || 'Listing'}
                </p>

                {conversation.lastMessage && (
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-sm truncate ${
                        hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                      {conversation.lastMessage.content}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
