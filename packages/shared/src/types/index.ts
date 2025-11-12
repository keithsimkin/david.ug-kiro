// Core domain types
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
}

// Re-export auth types
export * from './auth';

export interface Listing {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  condition: 'new' | 'used' | 'refurbished';
  status: 'draft' | 'active' | 'sold' | 'expired' | 'deleted';
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged';
  images: string[];
  contactPhone?: string;
  contactEmail?: string;
  viewCount: number;
  contactCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  user?: User;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string;
  displayOrder: number;
  createdAt: string;
  subcategories?: Category[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  listing?: Listing;
  buyer?: User;
  seller?: User;
  messages?: Message[];
  lastMessage?: Message;
}
