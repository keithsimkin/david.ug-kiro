-- Seed Data for Development and Testing
-- This file populates the database with initial data

-- =====================================================
-- SEED CATEGORIES
-- =====================================================

-- Main categories
INSERT INTO categories (id, name, slug, icon, display_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Electronics', 'electronics', '📱', 1),
  ('22222222-2222-2222-2222-222222222222', 'Vehicles', 'vehicles', '🚗', 2),
  ('33333333-3333-3333-3333-333333333333', 'Property', 'property', '🏠', 3),
  ('44444444-4444-4444-4444-444444444444', 'Home & Garden', 'home-garden', '🛋️', 4),
  ('55555555-5555-5555-5555-555555555555', 'Fashion', 'fashion', '👗', 5),
  ('66666666-6666-6666-6666-666666666666', 'Jobs', 'jobs', '💼', 6),
  ('77777777-7777-7777-7777-777777777777', 'Services', 'services', '🔧', 7),
  ('88888888-8888-8888-8888-888888888888', 'Sports & Hobbies', 'sports-hobbies', '⚽', 8);

-- Electronics subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Mobile Phones', 'mobile-phones', '11111111-1111-1111-1111-111111111111', 1),
  ('Computers & Laptops', 'computers-laptops', '11111111-1111-1111-1111-111111111111', 2),
  ('TVs & Audio', 'tvs-audio', '11111111-1111-1111-1111-111111111111', 3),
  ('Cameras & Photography', 'cameras-photography', '11111111-1111-1111-1111-111111111111', 4),
  ('Video Games & Consoles', 'video-games-consoles', '11111111-1111-1111-1111-111111111111', 5);

-- Vehicles subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Cars', 'cars', '22222222-2222-2222-2222-222222222222', 1),
  ('Motorcycles', 'motorcycles', '22222222-2222-2222-2222-222222222222', 2),
  ('Trucks & Vans', 'trucks-vans', '22222222-2222-2222-2222-222222222222', 3),
  ('Auto Parts & Accessories', 'auto-parts-accessories', '22222222-2222-2222-2222-222222222222', 4);

-- Property subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Houses & Apartments for Sale', 'houses-apartments-sale', '33333333-3333-3333-3333-333333333333', 1),
  ('Houses & Apartments for Rent', 'houses-apartments-rent', '33333333-3333-3333-3333-333333333333', 2),
  ('Land & Plots', 'land-plots', '33333333-3333-3333-3333-333333333333', 3),
  ('Commercial Property', 'commercial-property', '33333333-3333-3333-3333-333333333333', 4);

-- Home & Garden subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Furniture', 'furniture', '44444444-4444-4444-4444-444444444444', 1),
  ('Home Appliances', 'home-appliances', '44444444-4444-4444-4444-444444444444', 2),
  ('Garden & Outdoor', 'garden-outdoor', '44444444-4444-4444-4444-444444444444', 3),
  ('Home Decor', 'home-decor', '44444444-4444-4444-4444-444444444444', 4);

-- Fashion subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Clothing', 'clothing', '55555555-5555-5555-5555-555555555555', 1),
  ('Shoes', 'shoes', '55555555-5555-5555-5555-555555555555', 2),
  ('Bags & Accessories', 'bags-accessories', '55555555-5555-5555-5555-555555555555', 3),
  ('Watches & Jewelry', 'watches-jewelry', '55555555-5555-5555-5555-555555555555', 4);

-- Jobs subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Full Time Jobs', 'full-time-jobs', '66666666-6666-6666-6666-666666666666', 1),
  ('Part Time Jobs', 'part-time-jobs', '66666666-6666-6666-6666-666666666666', 2),
  ('Internships', 'internships', '66666666-6666-6666-6666-666666666666', 3),
  ('Remote Jobs', 'remote-jobs', '66666666-6666-6666-6666-666666666666', 4);

-- Services subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Repair & Maintenance', 'repair-maintenance', '77777777-7777-7777-7777-777777777777', 1),
  ('Cleaning Services', 'cleaning-services', '77777777-7777-7777-7777-777777777777', 2),
  ('Event Services', 'event-services', '77777777-7777-7777-7777-777777777777', 3),
  ('Professional Services', 'professional-services', '77777777-7777-7777-7777-777777777777', 4);

-- Sports & Hobbies subcategories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
  ('Sports Equipment', 'sports-equipment', '88888888-8888-8888-8888-888888888888', 1),
  ('Bicycles', 'bicycles', '88888888-8888-8888-8888-888888888888', 2),
  ('Musical Instruments', 'musical-instruments', '88888888-8888-8888-8888-888888888888', 3),
  ('Books & Media', 'books-media', '88888888-8888-8888-8888-888888888888', 4);

-- =====================================================
-- NOTES FOR DEVELOPMENT
-- =====================================================

-- To create test users and listings, use the Supabase dashboard or API
-- Test users should be created through the auth.users table
-- Sample listings can be added after users are created

-- Example: Create an admin user
-- 1. Sign up through the app or Supabase dashboard
-- 2. Update the profile to set is_admin = true:
--    UPDATE profiles SET is_admin = true WHERE id = 'user-uuid';

-- Example: Create test listings
-- Use the application UI or insert directly:
-- INSERT INTO listings (user_id, category_id, title, description, price, location, condition, status, moderation_status)
-- VALUES ('user-uuid', 'category-uuid', 'Test Listing', 'Description here', 100000, 'Kampala', 'new', 'active', 'approved');
