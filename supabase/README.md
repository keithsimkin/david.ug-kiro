# Supabase Backend Setup

This directory contains all the database migrations, configurations, and documentation for the Classified Marketplace Platform's Supabase backend.

## Directory Structure

```
supabase/
├── migrations/              # Database migration files
│   ├── 00001_initial_schema.sql
│   ├── 00002_rls_policies.sql
│   ├── 00003_functions_triggers.sql
│   └── 00004_storage_setup.sql
├── seed.sql                 # Seed data for development
├── config.toml              # Supabase local development config
└── README.md                # This file
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for local development)
- A Supabase account (for production)

## Local Development Setup

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Linux
brew install supabase/tap/supabase
```

### 2. Initialize Supabase Locally

```bash
# Start Supabase local instance
supabase start

# This will start:
# - PostgreSQL database
# - Supabase Studio (UI)
# - Auth server
# - Storage server
# - Realtime server
```

After starting, you'll see output like:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Anon key: eyJhbGc...
Service role key: eyJhbGc...
```

### 3. Apply Migrations

```bash
# Apply all migrations to local database
supabase db reset

# Or apply migrations incrementally
supabase migration up
```

### 4. Seed the Database

```bash
# Run seed file
supabase db seed
```

### 5. Access Supabase Studio

Open http://localhost:54323 in your browser to access the Supabase Studio UI where you can:
- View and edit tables
- Test queries
- Manage storage
- View logs
- Test authentication

## Production Setup

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - Name: `classified-marketplace`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users
5. Wait for project to be provisioned (~2 minutes)

### 2. Link Local Project to Production

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Get project ref from: Project Settings > General > Reference ID
```

### 3. Push Migrations to Production

```bash
# Push all migrations
supabase db push

# Or use the Supabase dashboard to run migrations manually
```

### 4. Seed Production Database

```bash
# Connect to production database
supabase db remote commit

# Run seed file through Studio or psql
```

### 5. Configure Storage Buckets

The storage buckets are created automatically by the migration, but verify in the Supabase dashboard:

1. Go to Storage section
2. Verify `listing-images` bucket exists (public, 50MB limit)
3. Verify `avatars` bucket exists (public, 5MB limit)

### 6. Get API Credentials

From your Supabase project dashboard:

1. Go to Project Settings > API
2. Copy the following:
   - Project URL: `https://your-project.supabase.co`
   - Anon/Public Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...` (keep secret!)

### 7. Configure Environment Variables

Update your application environment files:

**Web (.env):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Mobile (.env):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema Overview

### Core Tables

1. **profiles** - Extended user information
   - Links to `auth.users`
   - Stores username, full name, phone, location, avatar
   - Admin and suspension flags

2. **categories** - Hierarchical category structure
   - Supports parent-child relationships
   - Used for organizing listings

3. **listings** - Main classified advertisements
   - Links to user and category
   - Includes title, description, price, images
   - Status tracking (draft, active, sold, expired)
   - Moderation status (pending, approved, rejected, flagged)

4. **saved_listings** - User bookmarks
   - Many-to-many relationship between users and listings

5. **conversations** - Message threads
   - Links buyer, seller, and listing
   - Tracks last message timestamp

6. **messages** - Individual messages
   - Belongs to conversation
   - Read status tracking

7. **analytics_events** - User interaction tracking
   - Tracks views, contacts, saves, shares
   - Used for analytics dashboard

8. **moderation_queue** - Admin moderation workflow
   - Flagged listings for review
   - Admin actions and notes

### Storage Buckets

1. **listing-images** - Listing photos (50MB limit per file)
2. **avatars** - User profile pictures (5MB limit per file)

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Public read access for active/approved content
- User-specific write access for own content
- Admin access for moderation and management

### Storage Policies

- Public read access for all images
- Authenticated users can upload to their own folders
- Users can only modify/delete their own files
- Admins can delete any files

## Database Functions

### Analytics Functions

- `get_listing_analytics(listing_id, days)` - Get metrics for a listing
- `get_user_analytics(user_id, days)` - Get metrics for a user
- `get_platform_stats()` - Get platform-wide statistics

### Search Function

- `search_listings(...)` - Advanced search with filters and full-text search

### Utility Functions

- `increment_listing_view(listing_id)` - Increment view counter
- `increment_listing_contact(listing_id)` - Increment contact counter
- `expire_old_listings()` - Mark expired listings (run via cron)

## Automated Tasks

### Triggers

1. **Auto-create profile** - Creates profile when user signs up
2. **Update timestamps** - Auto-updates `updated_at` fields
3. **Update conversation** - Updates `last_message_at` on new messages
4. **Update save count** - Maintains listing save counter
5. **Check keywords** - Auto-flags listings with prohibited content

### Scheduled Jobs (TODO)

Set up pg_cron or Edge Functions for:
- Expire old listings daily
- Send notification emails
- Generate analytics reports

## Useful Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# View database status
supabase status

# Create new migration
supabase migration new migration_name

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > ../packages/shared/src/types/database.ts

# View logs
supabase logs

# Access PostgreSQL shell
supabase db psql
```

## Testing

### Test Data

Use the seed file to populate test data:
```bash
supabase db seed
```

### Create Test Admin User

1. Sign up through the app
2. Get user ID from Supabase Studio
3. Run in SQL Editor:
```sql
UPDATE profiles SET is_admin = true WHERE id = 'user-uuid';
```

### Test RLS Policies

Use the Supabase Studio SQL Editor with different user contexts:
```sql
-- Test as specific user
SET request.jwt.claim.sub = 'user-uuid';

-- Test queries
SELECT * FROM listings;
```

## Troubleshooting

### Migration Errors

If migrations fail:
```bash
# Reset and try again
supabase db reset

# Check migration status
supabase migration list
```

### Connection Issues

If can't connect to local database:
```bash
# Check Docker is running
docker ps

# Restart Supabase
supabase stop
supabase start
```

### RLS Policy Issues

If queries return no results:
1. Check RLS policies in Supabase Studio
2. Verify user authentication
3. Test with service role key (bypasses RLS)

## Migration to AWS

The database schema is designed to be portable. When migrating to AWS:

1. Export schema: `pg_dump -s`
2. Export data: `pg_dump -a`
3. Import to AWS RDS PostgreSQL
4. Update application connection strings
5. Migrate storage to S3
6. Implement equivalent auth with Cognito

See the design document for detailed migration plan.

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)

## Support

For issues or questions:
1. Check Supabase documentation
2. Review migration files for schema details
3. Check Supabase Studio for database state
4. Review application logs for errors
