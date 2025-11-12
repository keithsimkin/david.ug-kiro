import { getSupabase } from '../lib/supabase';
import type { Conversation, Message } from '../types';

export interface CreateConversationInput {
  listingId: string;
  buyerId: string;
  sellerId: string;
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  content: string;
}

export interface ConversationWithDetails extends Conversation {
  unreadCount?: number;
}

/**
 * Messaging Service
 * Handles all messaging-related operations including conversations and messages
 */
export class MessagingService {
  /**
   * Get or create a conversation between a buyer and seller for a specific listing
   */
  static async getOrCreateConversation(
    input: CreateConversationInput
  ): Promise<Conversation> {
    const supabase = getSupabase();

    // First, try to find existing conversation
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!conversations_buyer_id_fkey(*),
        seller:profiles!conversations_seller_id_fkey(*)
      `)
      .eq('listing_id', input.listingId)
      .eq('buyer_id', input.buyerId)
      .single();

    if (existing && !fetchError) {
      return this.mapConversation(existing);
    }

    // Create new conversation if it doesn't exist
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: input.listingId,
        buyer_id: input.buyerId,
        seller_id: input.sellerId,
      })
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!conversations_buyer_id_fkey(*),
        seller:profiles!conversations_seller_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return this.mapConversation(data);
  }

  /**
   * Get a conversation by ID with all details
   */
  static async getConversationById(conversationId: string): Promise<Conversation> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!conversations_buyer_id_fkey(*),
        seller:profiles!conversations_seller_id_fkey(*)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch conversation: ${error.message}`);
    }

    return this.mapConversation(data);
  }

  /**
   * Get all conversations for a user
   */
  static async getUserConversations(userId: string): Promise<ConversationWithDetails[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(*),
        buyer:profiles!conversations_buyer_id_fkey(*),
        seller:profiles!conversations_seller_id_fkey(*)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv) => {
        const conversation = this.mapConversation(conv);
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (lastMsg) {
          conversation.lastMessage = this.mapMessage(lastMsg);
        }

        // Get unread count (messages not sent by current user and not read)
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        return {
          ...conversation,
          unreadCount: count || 0,
        };
      })
    );

    return conversationsWithDetails;
  }

  /**
   * Send a message in a conversation
   */
  static async sendMessage(input: SendMessageInput): Promise<Message> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content: input.content,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', input.conversationId);

    return this.mapMessage(data);
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    return (data || []).map(this.mapMessage);
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<void> {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  }

  /**
   * Subscribe to new messages in a conversation
   */
  static subscribeToMessages(
    conversationId: string,
    onMessage: (message: Message) => void
  ) {
    const supabase = getSupabase();

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender details
          const newMessage = payload.new as any;
          if (!newMessage?.id) return;

          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles(*)
            `)
            .eq('id', newMessage.id)
            .single();

          if (data) {
            onMessage(this.mapMessage(data));
          }
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Subscribe to conversation updates (for conversation list)
   */
  static subscribeToConversations(
    userId: string,
    onUpdate: (conversation: Conversation) => void
  ) {
    const supabase = getSupabase();

    const subscription = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${userId}`,
        },
        async (payload) => {
          const newConv = payload.new as any;
          if (newConv?.id) {
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                listing:listings(*),
                buyer:profiles!conversations_buyer_id_fkey(*),
                seller:profiles!conversations_seller_id_fkey(*)
              `)
              .eq('id', newConv.id)
              .single();

            if (data) {
              onUpdate(this.mapConversation(data));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${userId}`,
        },
        async (payload) => {
          const newConv = payload.new as any;
          if (newConv?.id) {
            const { data } = await supabase
              .from('conversations')
              .select(`
                *,
                listing:listings(*),
                buyer:profiles!conversations_buyer_id_fkey(*),
                seller:profiles!conversations_seller_id_fkey(*)
              `)
              .eq('id', newConv.id)
              .single();

            if (data) {
              onUpdate(this.mapConversation(data));
            }
          }
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time updates
   */
  static unsubscribe(subscription: any) {
    const supabase = getSupabase();
    supabase.removeChannel(subscription);
  }

  /**
   * Map database conversation to domain model
   */
  private static mapConversation(data: any): Conversation {
    return {
      id: data.id,
      listingId: data.listing_id,
      buyerId: data.buyer_id,
      sellerId: data.seller_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      listing: data.listing ? {
        id: data.listing.id,
        userId: data.listing.user_id,
        categoryId: data.listing.category_id,
        title: data.listing.title,
        description: data.listing.description,
        price: parseFloat(data.listing.price),
        currency: data.listing.currency,
        location: data.listing.location,
        condition: data.listing.condition,
        status: data.listing.status,
        moderationStatus: data.listing.moderation_status,
        images: data.listing.images || [],
        contactPhone: data.listing.contact_phone,
        contactEmail: data.listing.contact_email,
        viewCount: data.listing.view_count,
        contactCount: data.listing.contact_count,
        createdAt: data.listing.created_at,
        updatedAt: data.listing.updated_at,
        expiresAt: data.listing.expires_at,
      } : undefined,
      buyer: data.buyer ? {
        id: data.buyer.id,
        username: data.buyer.username,
        fullName: data.buyer.full_name,
        email: data.buyer.email || '',
        phone: data.buyer.phone,
        location: data.buyer.location,
        avatarUrl: data.buyer.avatar_url,
        isAdmin: data.buyer.is_admin,
        isSuspended: data.buyer.is_suspended,
        createdAt: data.buyer.created_at,
        updatedAt: data.buyer.updated_at,
      } : undefined,
      seller: data.seller ? {
        id: data.seller.id,
        username: data.seller.username,
        fullName: data.seller.full_name,
        email: data.seller.email || '',
        phone: data.seller.phone,
        location: data.seller.location,
        avatarUrl: data.seller.avatar_url,
        isAdmin: data.seller.is_admin,
        isSuspended: data.seller.is_suspended,
        createdAt: data.seller.created_at,
        updatedAt: data.seller.updated_at,
      } : undefined,
    };
  }

  /**
   * Map database message to domain model
   */
  private static mapMessage(data: any): Message {
    return {
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content,
      isRead: data.is_read,
      createdAt: data.created_at,
      sender: data.sender ? {
        id: data.sender.id,
        username: data.sender.username,
        fullName: data.sender.full_name,
        email: data.sender.email || '',
        phone: data.sender.phone,
        location: data.sender.location,
        avatarUrl: data.sender.avatar_url,
        isAdmin: data.sender.is_admin,
        isSuspended: data.sender.is_suspended,
        createdAt: data.sender.created_at,
        updatedAt: data.sender.updated_at,
      } : undefined,
    };
  }
}
