-- Row Level Security (RLS) Policies
-- This migration configures security policies for all tables

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view public profiles
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile (triggered on signup)
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "profiles_update_admin"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Users cannot delete their own profile (handled by auth.users cascade)
-- Admins can delete profiles through user management

-- =====================================================
-- CATEGORIES TABLE POLICIES
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "categories_select_all"
  ON categories FOR SELECT
  USING (true);

-- Only admins can insert categories
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can update categories
CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can delete categories
CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- LISTINGS TABLE POLICIES
-- =====================================================

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active and approved listings
CREATE POLICY "listings_select_public"
  ON listings FOR SELECT
  USING (
    status = 'active' 
    AND moderation_status = 'approved'
  );

-- Users can view their own listings regardless of status
CREATE POLICY "listings_select_own"
  ON listings FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all listings
CREATE POLICY "listings_select_admin"
  ON listings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Authenticated non-suspended users can insert listings
CREATE POLICY "listings_insert_authenticated"
  ON listings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_suspended = false
    )
  );

-- Users can update their own listings
CREATE POLICY "listings_update_own"
  ON listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update any listing (for moderation)
CREATE POLICY "listings_update_admin"
  ON listings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Users can delete their own listings
CREATE POLICY "listings_delete_own"
  ON listings FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete any listing
CREATE POLICY "listings_delete_admin"
  ON listings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- SAVED_LISTINGS TABLE POLICIES
-- =====================================================

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved listings
CREATE POLICY "saved_listings_select_own"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved listings
CREATE POLICY "saved_listings_insert_own"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved listings
CREATE POLICY "saved_listings_delete_own"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they're part of
CREATE POLICY "conversations_select_participant"
  ON conversations FOR SELECT
  USING (
    auth.uid() = buyer_id 
    OR auth.uid() = seller_id
  );

-- Buyers can create conversations
CREATE POLICY "conversations_insert_buyer"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Participants can update conversations (for last_message_at)
CREATE POLICY "conversations_update_participant"
  ON conversations FOR UPDATE
  USING (
    auth.uid() = buyer_id 
    OR auth.uid() = seller_id
  );

-- Admins can view all conversations
CREATE POLICY "conversations_select_admin"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "messages_select_participant"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "messages_insert_participant"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Users can update their own messages (for read status)
CREATE POLICY "messages_update_own"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Admins can view all messages
CREATE POLICY "messages_select_admin"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- ANALYTICS_EVENTS TABLE POLICIES
-- =====================================================

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (including anonymous users)
CREATE POLICY "analytics_insert_all"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Users can view analytics for their own listings
CREATE POLICY "analytics_select_own_listings"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = analytics_events.listing_id
      AND listings.user_id = auth.uid()
    )
  );

-- Admins can view all analytics
CREATE POLICY "analytics_select_admin"
  ON analytics_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- MODERATION_QUEUE TABLE POLICIES
-- =====================================================

ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation queue
CREATE POLICY "moderation_select_admin"
  ON moderation_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Authenticated users can flag listings
CREATE POLICY "moderation_insert_authenticated"
  ON moderation_queue FOR INSERT
  WITH CHECK (
    auth.uid() = flagged_by
    OR flagged_by IS NULL -- System-generated flags
  );

-- Only admins can update moderation queue
CREATE POLICY "moderation_update_admin"
  ON moderation_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Only admins can delete from moderation queue
CREATE POLICY "moderation_delete_admin"
  ON moderation_queue FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
