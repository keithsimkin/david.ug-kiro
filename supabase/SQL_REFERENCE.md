# SQL Reference Guide

This document provides common SQL queries and examples for working with the Classified Marketplace database.

## Table of Contents

- [User Management](#user-management)
- [Listings](#listings)
- [Categories](#categories)
- [Analytics](#analytics)
- [Messaging](#messaging)
- [Moderation](#moderation)
- [Search](#search)

## User Management

### Get User Profile

```sql
SELECT * FROM profiles WHERE id = 'user-uuid';
```

### Make User Admin

```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = 'user-uuid';
```

### Suspend User

```sql
UPDATE profiles 
SET is_suspended = true 
WHERE id = 'user-uuid';
```

### Get All Admins

```sql
SELECT * FROM profiles 
WHERE is_admin = true 
ORDER BY created_at DESC;
```

### Get User Statistics

```sql
SELECT 
  p.id,
  p.username,
  p.full_name,
  COUNT(DISTINCT l.id) as total_listings,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'active') as active_listings,
  SUM(l.view_count) as total_views,
  SUM(l.contact_count) as total_contacts
FROM profiles p
LEFT JOIN listings l ON l.user_id = p.id
WHERE p.id = 'user-uuid'
GROUP BY p.id;
```

## Listings

### Get Active Listings

```sql
SELECT * FROM listings 
WHERE status = 'active' 
  AND moderation_status = 'approved'
ORDER BY created_at DESC
LIMIT 20;
```

### Get User's Listings

```sql
SELECT * FROM listings 
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

### Get Listing with User and Category

```sql
SELECT 
  l.*,
  p.username,
  p.full_name,
  p.avatar_url,
  c.name as category_name,
  c.slug as category_slug
FROM listings l
JOIN profiles p ON p.id = l.user_id
JOIN categories c ON c.id = l.category_id
WHERE l.id = 'listing-uuid';
```

### Get Listings by Category

```sql
SELECT l.*, p.username, p.avatar_url
FROM listings l
JOIN profiles p ON p.id = l.user_id
WHERE l.category_id = 'category-uuid'
  AND l.status = 'active'
  AND l.moderation_status = 'approved'
ORDER BY l.created_at DESC
LIMIT 20;
```

### Get Listings by Price Range

```sql
SELECT * FROM listings 
WHERE status = 'active' 
  AND moderation_status = 'approved'
  AND price BETWEEN 100000 AND 500000
ORDER BY price ASC;
```

### Update Listing Status

```sql
UPDATE listings 
SET status = 'sold' 
WHERE id = 'listing-uuid' 
  AND user_id = 'user-uuid';
```

### Increment View Count

```sql
SELECT increment_listing_view('listing-uuid');
```

### Increment Contact Count

```sql
SELECT increment_listing_contact('listing-uuid');
```

## Categories

### Get All Top-Level Categories

```sql
SELECT * FROM categories 
WHERE parent_id IS NULL 
ORDER BY display_order;
```

### Get Category with Subcategories

```sql
SELECT 
  c.*,
  json_agg(
    json_build_object(
      'id', sc.id,
      'name', sc.name,
      'slug', sc.slug
    )
  ) FILTER (WHERE sc.id IS NOT NULL) as subcategories
FROM categories c
LEFT JOIN categories sc ON sc.parent_id = c.id
WHERE c.id = 'category-uuid'
GROUP BY c.id;
```

### Get Listing Count by Category

```sql
SELECT 
  c.id,
  c.name,
  c.slug,
  COUNT(l.id) as listing_count
FROM categories c
LEFT JOIN listings l ON l.category_id = c.id 
  AND l.status = 'active' 
  AND l.moderation_status = 'approved'
GROUP BY c.id
ORDER BY c.display_order;
```

## Analytics

### Get Listing Analytics

```sql
SELECT * FROM get_listing_analytics('listing-uuid', 30);
```

### Get User Analytics

```sql
SELECT * FROM get_user_analytics('user-uuid', 30);
```

### Get Platform Statistics

```sql
SELECT * FROM get_platform_stats();
```

### Get Daily Views for Listing

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as views
FROM analytics_events
WHERE listing_id = 'listing-uuid'
  AND event_type = 'view'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Get Top Performing Listings

```sql
SELECT 
  l.id,
  l.title,
  l.price,
  l.view_count,
  l.contact_count,
  l.save_count,
  CASE 
    WHEN l.view_count > 0 THEN 
      ROUND((l.contact_count::NUMERIC / l.view_count::NUMERIC) * 100, 2)
    ELSE 0 
  END as conversion_rate
FROM listings l
WHERE l.user_id = 'user-uuid'
  AND l.created_at >= NOW() - INTERVAL '30 days'
ORDER BY l.view_count DESC
LIMIT 10;
```

### Track Analytics Event

```sql
INSERT INTO analytics_events (listing_id, user_id, event_type, metadata)
VALUES ('listing-uuid', 'user-uuid', 'view', '{"source": "search"}');
```

## Messaging

### Get User's Conversations

```sql
SELECT 
  c.*,
  l.title as listing_title,
  l.images[1] as listing_image,
  CASE 
    WHEN c.buyer_id = 'user-uuid' THEN p_seller.username
    ELSE p_buyer.username
  END as other_user_username,
  CASE 
    WHEN c.buyer_id = 'user-uuid' THEN p_seller.avatar_url
    ELSE p_buyer.avatar_url
  END as other_user_avatar,
  m.content as last_message,
  m.created_at as last_message_time
FROM conversations c
JOIN listings l ON l.id = c.listing_id
JOIN profiles p_buyer ON p_buyer.id = c.buyer_id
JOIN profiles p_seller ON p_seller.id = c.seller_id
LEFT JOIN LATERAL (
  SELECT content, created_at 
  FROM messages 
  WHERE conversation_id = c.id 
  ORDER BY created_at DESC 
  LIMIT 1
) m ON true
WHERE c.buyer_id = 'user-uuid' OR c.seller_id = 'user-uuid'
ORDER BY c.last_message_at DESC;
```

### Get Messages in Conversation

```sql
SELECT 
  m.*,
  p.username,
  p.avatar_url
FROM messages m
JOIN profiles p ON p.id = m.sender_id
WHERE m.conversation_id = 'conversation-uuid'
ORDER BY m.created_at ASC;
```

### Send Message

```sql
INSERT INTO messages (conversation_id, sender_id, content)
VALUES ('conversation-uuid', 'user-uuid', 'Hello, is this still available?')
RETURNING *;
```

### Mark Messages as Read

```sql
UPDATE messages 
SET is_read = true 
WHERE conversation_id = 'conversation-uuid' 
  AND sender_id != 'user-uuid'
  AND is_read = false;
```

### Get Unread Message Count

```sql
SELECT COUNT(*) as unread_count
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE (c.buyer_id = 'user-uuid' OR c.seller_id = 'user-uuid')
  AND m.sender_id != 'user-uuid'
  AND m.is_read = false;
```

## Moderation

### Get Pending Moderation Queue

```sql
SELECT 
  mq.*,
  l.title as listing_title,
  l.description as listing_description,
  l.images as listing_images,
  p.username as listing_owner
FROM moderation_queue mq
JOIN listings l ON l.id = mq.listing_id
JOIN profiles p ON p.id = l.user_id
WHERE mq.reviewed_at IS NULL
ORDER BY mq.created_at ASC;
```

### Approve Listing

```sql
BEGIN;

UPDATE listings 
SET moderation_status = 'approved' 
WHERE id = 'listing-uuid';

UPDATE moderation_queue 
SET 
  reviewed_by = 'admin-uuid',
  reviewed_at = NOW(),
  action_taken = 'approved',
  admin_notes = 'Looks good'
WHERE listing_id = 'listing-uuid' 
  AND reviewed_at IS NULL;

COMMIT;
```

### Reject Listing

```sql
BEGIN;

UPDATE listings 
SET moderation_status = 'rejected' 
WHERE id = 'listing-uuid';

UPDATE moderation_queue 
SET 
  reviewed_by = 'admin-uuid',
  reviewed_at = NOW(),
  action_taken = 'rejected',
  admin_notes = 'Violates terms of service'
WHERE listing_id = 'listing-uuid' 
  AND reviewed_at IS NULL;

COMMIT;
```

### Flag Listing for Review

```sql
INSERT INTO moderation_queue (listing_id, reason, flagged_by)
VALUES ('listing-uuid', 'Inappropriate content', 'user-uuid');
```

## Search

### Full-Text Search

```sql
SELECT * FROM search_listings(
  p_search_query := 'iphone',
  p_category_id := NULL,
  p_min_price := NULL,
  p_max_price := NULL,
  p_location := NULL,
  p_condition := NULL,
  p_limit := 20,
  p_offset := 0
);
```

### Search with Filters

```sql
SELECT * FROM search_listings(
  p_search_query := 'laptop',
  p_category_id := 'electronics-uuid',
  p_min_price := 500000,
  p_max_price := 2000000,
  p_location := 'Kampala',
  p_condition := 'used',
  p_limit := 20,
  p_offset := 0
);
```

### Fuzzy Search by Title

```sql
SELECT 
  id,
  title,
  price,
  similarity(title, 'ipone') as similarity_score
FROM listings
WHERE status = 'active' 
  AND moderation_status = 'approved'
  AND title % 'ipone'  -- Trigram similarity operator
ORDER BY similarity_score DESC
LIMIT 10;
```

### Search by Location

```sql
SELECT * FROM listings 
WHERE status = 'active' 
  AND moderation_status = 'approved'
  AND location ILIKE '%kampala%'
ORDER BY created_at DESC;
```

## Saved Listings

### Save Listing

```sql
INSERT INTO saved_listings (user_id, listing_id)
VALUES ('user-uuid', 'listing-uuid')
ON CONFLICT (user_id, listing_id) DO NOTHING;
```

### Unsave Listing

```sql
DELETE FROM saved_listings 
WHERE user_id = 'user-uuid' 
  AND listing_id = 'listing-uuid';
```

### Get User's Saved Listings

```sql
SELECT 
  l.*,
  p.username,
  p.avatar_url,
  c.name as category_name,
  sl.created_at as saved_at
FROM saved_listings sl
JOIN listings l ON l.id = sl.listing_id
JOIN profiles p ON p.id = l.user_id
JOIN categories c ON c.id = l.category_id
WHERE sl.user_id = 'user-uuid'
ORDER BY sl.created_at DESC;
```

### Check if Listing is Saved

```sql
SELECT EXISTS(
  SELECT 1 FROM saved_listings 
  WHERE user_id = 'user-uuid' 
    AND listing_id = 'listing-uuid'
) as is_saved;
```

## Maintenance Queries

### Expire Old Listings

```sql
SELECT expire_old_listings();
```

### Delete Old Analytics Events (older than 90 days)

```sql
DELETE FROM analytics_events 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Get Database Size

```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as database_size;
```

### Get Table Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Performance Queries

### Find Slow Queries (requires pg_stat_statements)

```sql
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Check Index Usage

```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Backup and Restore

### Export Data

```bash
# Export entire database
pg_dump -h localhost -p 54322 -U postgres postgres > backup.sql

# Export specific table
pg_dump -h localhost -p 54322 -U postgres -t listings postgres > listings_backup.sql

# Export data only (no schema)
pg_dump -h localhost -p 54322 -U postgres -a postgres > data_backup.sql
```

### Import Data

```bash
# Import entire database
psql -h localhost -p 54322 -U postgres postgres < backup.sql

# Import specific table
psql -h localhost -p 54322 -U postgres postgres < listings_backup.sql
```
