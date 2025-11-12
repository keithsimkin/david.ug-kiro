-- Database Functions and Triggers
-- This migration creates automated tasks and helper functions

-- =====================================================
-- FUNCTION: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- FUNCTION: Update conversation last_message_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- =====================================================
-- FUNCTION: Update listing save_count
-- =====================================================

CREATE OR REPLACE FUNCTION update_listing_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings
    SET save_count = save_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings
    SET save_count = save_count - 1
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_save_count_on_insert
  AFTER INSERT ON saved_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_save_count();

CREATE TRIGGER update_save_count_on_delete
  AFTER DELETE ON saved_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_save_count();

-- =====================================================
-- FUNCTION: Auto-flag listings with prohibited keywords
-- =====================================================

CREATE OR REPLACE FUNCTION check_prohibited_keywords()
RETURNS TRIGGER AS $$
DECLARE
  prohibited_keywords TEXT[] := ARRAY[
    'weapon', 'gun', 'drug', 'cocaine', 'heroin', 'marijuana',
    'counterfeit', 'fake', 'stolen', 'illegal', 'scam'
  ];
  keyword TEXT;
  content_lower TEXT;
BEGIN
  content_lower := LOWER(NEW.title || ' ' || NEW.description);
  
  FOREACH keyword IN ARRAY prohibited_keywords
  LOOP
    IF content_lower LIKE '%' || keyword || '%' THEN
      -- Flag the listing for moderation
      NEW.moderation_status := 'flagged';
      
      -- Add to moderation queue
      INSERT INTO moderation_queue (listing_id, reason)
      VALUES (NEW.id, 'Automatic flag: Contains prohibited keyword "' || keyword || '"');
      
      EXIT; -- Stop after first match
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_listing_keywords
  BEFORE INSERT OR UPDATE OF title, description ON listings
  FOR EACH ROW
  EXECUTE FUNCTION check_prohibited_keywords();

-- =====================================================
-- FUNCTION: Auto-expire old listings
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_listings()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Note: This function should be called by a scheduled job (cron)
-- In Supabase, use pg_cron or Edge Functions with scheduled triggers

-- =====================================================
-- FUNCTION: Get listing analytics summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_listing_analytics(
  p_listing_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_views BIGINT,
  total_contacts BIGINT,
  total_saves BIGINT,
  total_shares BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE event_type = 'view') AS total_views,
    COUNT(*) FILTER (WHERE event_type = 'contact') AS total_contacts,
    COUNT(*) FILTER (WHERE event_type = 'save') AS total_saves,
    COUNT(*) FILTER (WHERE event_type = 'share') AS total_shares,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'view') > 0 THEN
        ROUND(
          (COUNT(*) FILTER (WHERE event_type = 'contact')::NUMERIC / 
           COUNT(*) FILTER (WHERE event_type = 'view')::NUMERIC) * 100,
          2
        )
      ELSE 0
    END AS conversion_rate
  FROM analytics_events
  WHERE listing_id = p_listing_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get user analytics summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_analytics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_listings BIGINT,
  active_listings BIGINT,
  total_views BIGINT,
  total_contacts BIGINT,
  average_views_per_listing NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT l.id) AS total_listings,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') AS active_listings,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'view') AS total_views,
    COUNT(ae.id) FILTER (WHERE ae.event_type = 'contact') AS total_contacts,
    CASE 
      WHEN COUNT(DISTINCT l.id) > 0 THEN
        ROUND(
          COUNT(ae.id) FILTER (WHERE ae.event_type = 'view')::NUMERIC / 
          COUNT(DISTINCT l.id)::NUMERIC,
          2
        )
      ELSE 0
    END AS average_views_per_listing
  FROM listings l
  LEFT JOIN analytics_events ae ON ae.listing_id = l.id 
    AND ae.created_at >= NOW() - (p_days || ' days')::INTERVAL
  WHERE l.user_id = p_user_id
    AND l.created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Search listings with filters
-- =====================================================

CREATE OR REPLACE FUNCTION search_listings(
  p_search_query TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_min_price DECIMAL DEFAULT NULL,
  p_max_price DECIMAL DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  category_id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL,
  currency TEXT,
  location TEXT,
  condition TEXT,
  images TEXT[],
  view_count INTEGER,
  contact_count INTEGER,
  save_count INTEGER,
  created_at TIMESTAMPTZ,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.category_id,
    l.title,
    l.description,
    l.price,
    l.currency,
    l.location,
    l.condition,
    l.images,
    l.view_count,
    l.contact_count,
    l.save_count,
    l.created_at,
    CASE 
      WHEN p_search_query IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', l.title || ' ' || l.description),
          plainto_tsquery('english', p_search_query)
        )
      ELSE 0
    END AS relevance
  FROM listings l
  WHERE l.status = 'active'
    AND l.moderation_status = 'approved'
    AND (p_search_query IS NULL OR 
         to_tsvector('english', l.title || ' ' || l.description) @@ plainto_tsquery('english', p_search_query))
    AND (p_category_id IS NULL OR l.category_id = p_category_id)
    AND (p_min_price IS NULL OR l.price >= p_min_price)
    AND (p_max_price IS NULL OR l.price <= p_max_price)
    AND (p_location IS NULL OR l.location ILIKE '%' || p_location || '%')
    AND (p_condition IS NULL OR l.condition = p_condition)
  ORDER BY
    CASE WHEN p_search_query IS NOT NULL THEN relevance ELSE 0 END DESC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Get platform statistics
-- =====================================================

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_listings BIGINT,
  active_listings BIGINT,
  pending_moderation BIGINT,
  total_messages BIGINT,
  total_views_today BIGINT,
  total_contacts_today BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) AS total_users,
    (SELECT COUNT(*) FROM listings) AS total_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'active' AND moderation_status = 'approved') AS active_listings,
    (SELECT COUNT(*) FROM moderation_queue WHERE reviewed_at IS NULL) AS pending_moderation,
    (SELECT COUNT(*) FROM messages) AS total_messages,
    (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'view' AND created_at >= CURRENT_DATE) AS total_views_today,
    (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'contact' AND created_at >= CURRENT_DATE) AS total_contacts_today;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Increment listing view count (optimized)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_listing_view(p_listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET view_count = view_count + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Increment listing contact count (optimized)
-- =====================================================

CREATE OR REPLACE FUNCTION increment_listing_contact(p_listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET contact_count = contact_count + 1
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql;
