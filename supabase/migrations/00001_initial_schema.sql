-- Initial Database Schema for Classified Marketplace Platform
-- This migration creates all core tables, indexes, and relationships

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- PROFILES TABLE
-- Extended user information beyond auth.users
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX idx_profiles_is_suspended ON profiles(is_suspended) WHERE is_suspended = true;

-- =====================================================
-- CATEGORIES TABLE
-- Hierarchical category structure for listings
-- =====================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes for category queries
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_display_order ON categories(display_order);
CREATE INDEX idx_categories_slug ON categories(slug);

-- =====================================================
-- LISTINGS TABLE
-- Core table for classified advertisements
-- =====================================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'UGX' NOT NULL,
  location TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('draft', 'active', 'sold', 'expired', 'deleted')),
  moderation_status TEXT DEFAULT 'pending' NOT NULL CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  images TEXT[] DEFAULT '{}',
  contact_phone TEXT,
  contact_email TEXT,
  view_count INTEGER DEFAULT 0,
  contact_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  
  CONSTRAINT title_length CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  CONSTRAINT description_length CHECK (char_length(description) >= 20 AND char_length(description) <= 5000),
  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT max_images CHECK (array_length(images, 1) <= 10)
);

-- Indexes for listing queries and search
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_moderation_status ON listings(moderation_status);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_location ON listings(location);
CREATE INDEX idx_listings_expires_at ON listings(expires_at);

-- Composite indexes for common queries
CREATE INDEX idx_listings_active_approved ON listings(status, moderation_status) 
  WHERE status = 'active' AND moderation_status = 'approved';
CREATE INDEX idx_listings_category_active ON listings(category_id, created_at DESC) 
  WHERE status = 'active' AND moderation_status = 'approved';

-- Full-text search index
CREATE INDEX idx_listings_search ON listings 
  USING GIN (to_tsvector('english', title || ' ' || description));

-- Trigram index for fuzzy search
CREATE INDEX idx_listings_title_trgm ON listings USING GIN (title gin_trgm_ops);

-- =====================================================
-- SAVED_LISTINGS TABLE
-- User's saved/bookmarked listings
-- =====================================================
CREATE TABLE saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id)
);

-- Indexes for saved listings queries
CREATE INDEX idx_saved_listings_user_id ON saved_listings(user_id);
CREATE INDEX idx_saved_listings_listing_id ON saved_listings(listing_id);
CREATE INDEX idx_saved_listings_created_at ON saved_listings(created_at DESC);

-- =====================================================
-- CONVERSATIONS TABLE
-- Message threads between buyers and sellers
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(listing_id, buyer_id),
  CONSTRAINT different_users CHECK (buyer_id != seller_id)
);

-- Indexes for conversation queries
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- =====================================================
-- MESSAGES TABLE
-- Individual messages within conversations
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 2000)
);

-- Indexes for message queries
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = false;
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- =====================================================
-- ANALYTICS_EVENTS TABLE
-- Track user interactions with listings
-- =====================================================
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'contact', 'save', 'share', 'unsave')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_analytics_listing_id ON analytics_events(listing_id);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Composite index for listing analytics
CREATE INDEX idx_analytics_listing_type_date ON analytics_events(listing_id, event_type, created_at DESC);

-- =====================================================
-- MODERATION_QUEUE TABLE
-- Track listings requiring moderation review
-- =====================================================
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  flagged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT CHECK (action_taken IN ('approved', 'rejected', 'deleted')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT reason_length CHECK (char_length(reason) >= 10 AND char_length(reason) <= 500)
);

-- Indexes for moderation queue queries
CREATE INDEX idx_moderation_listing_id ON moderation_queue(listing_id);
CREATE INDEX idx_moderation_reviewed_by ON moderation_queue(reviewed_by);
CREATE INDEX idx_moderation_created_at ON moderation_queue(created_at DESC);
CREATE INDEX idx_moderation_pending ON moderation_queue(created_at DESC) 
  WHERE reviewed_at IS NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'Extended user profile information';
COMMENT ON TABLE categories IS 'Hierarchical category structure for organizing listings';
COMMENT ON TABLE listings IS 'Core classified advertisement listings';
COMMENT ON TABLE saved_listings IS 'User bookmarked listings';
COMMENT ON TABLE conversations IS 'Message threads between buyers and sellers';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE analytics_events IS 'User interaction tracking for analytics';
COMMENT ON TABLE moderation_queue IS 'Listings flagged for admin review';
