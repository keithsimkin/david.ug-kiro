-- Storage Buckets and Policies
-- This migration sets up Supabase Storage for listing images

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- =====================================================
-- STORAGE POLICIES FOR LISTING IMAGES
-- =====================================================

-- Anyone can view listing images (public bucket)
CREATE POLICY "listing_images_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Authenticated users can upload listing images
CREATE POLICY "listing_images_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own listing images
CREATE POLICY "listing_images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own listing images
CREATE POLICY "listing_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can delete any listing images
CREATE POLICY "listing_images_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- STORAGE POLICIES FOR AVATARS
-- =====================================================

-- Anyone can view avatars (public bucket)
CREATE POLICY "avatars_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own avatar
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
