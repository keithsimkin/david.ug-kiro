# Supabase Backend Setup Guide

This guide walks you through setting up the Supabase backend for the Classified Marketplace Platform.

## Quick Start (Local Development)

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\scripts\setup-supabase.ps1
```

**macOS/Linux:**
```bash
chmod +x scripts/setup-supabase.sh
./scripts/setup-supabase.sh
```

This script will:
- Check prerequisites
- Start Supabase locally
- Apply all migrations
- Seed the database
- Generate TypeScript types
- Display connection details

### Option 2: Manual Setup

1. **Install Supabase CLI**

   **macOS:**
   ```bash
   brew install supabase/tap/supabase
   ```

   **Windows:**
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   **Linux:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Start Supabase**
   ```bash
   supabase start
   ```

3. **Apply Migrations**
   ```bash
   supabase db reset
   ```

4. **Generate Types**
   ```bash
   supabase gen types typescript --local > packages/shared/src/types/database.ts
   ```

5. **Get Credentials**
   ```bash
   supabase status
   ```

## Configure Environment Variables

After starting Supabase, copy the credentials to your environment files:

### Web Application

1. Copy the example file:
   ```bash
   cp packages/web/.env.example packages/web/.env
   ```

2. Update with your local credentials:
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=eyJhbGc... (from supabase status)
   ```

### Mobile Application

1. Copy the example file:
   ```bash
   cp packages/mobile/.env.example packages/mobile/.env
   ```

2. Update with your local credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (from supabase status)
   ```

## Access Supabase Studio

Open http://localhost:54323 in your browser to access the Supabase Studio dashboard where you can:

- View and edit database tables
- Test SQL queries
- Manage storage buckets
- View authentication users
- Monitor logs and performance

## Database Schema

The setup creates the following tables:

### Core Tables
- **profiles** - User profiles and settings
- **categories** - Hierarchical category structure
- **listings** - Classified advertisements
- **saved_listings** - User bookmarked listings
- **conversations** - Message threads
- **messages** - Individual messages
- **analytics_events** - User interaction tracking
- **moderation_queue** - Admin moderation workflow

### Storage Buckets
- **listing-images** - Listing photos (50MB per file)
- **avatars** - User profile pictures (5MB per file)

## Create Test Admin User

1. Sign up through your application
2. Get your user ID from Supabase Studio (Authentication > Users)
3. Run this SQL in the SQL Editor:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
   ```

## Production Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for provisioning (~2 minutes)

### 2. Link Your Project

```bash
supabase login
supabase link --project-ref your-project-ref
```

### 3. Push Migrations

```bash
supabase db push
```

### 4. Update Environment Variables

Update your production environment files with your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## Useful Commands

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# View status and credentials
supabase status

# Reset database (reapply all migrations)
supabase db reset

# Create new migration
supabase migration new migration_name

# Generate TypeScript types
supabase gen types typescript --local > packages/shared/src/types/database.ts

# View logs
supabase logs

# Access PostgreSQL shell
supabase db psql
```

## Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:** Start Docker Desktop and try again

### Port Already in Use

**Error:** `Port 54321 is already allocated`

**Solution:** 
```bash
supabase stop
supabase start
```

### Migration Errors

**Error:** Migration fails to apply

**Solution:**
```bash
supabase db reset
```

### Can't Connect from App

**Error:** Network request failed

**Solution:**
- Check Supabase is running: `supabase status`
- Verify .env file has correct URL and key
- Restart your development server

## Next Steps

After setting up Supabase:

1. ✅ Supabase backend is running
2. ✅ Database schema is created
3. ✅ Environment variables are configured
4. 🔄 Start your development servers:
   - Web: `npm run dev:web`
   - Mobile: `npm run dev:mobile`

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Database Schema Details](./supabase/README.md)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## Support

For issues:
1. Check [supabase/README.md](./supabase/README.md) for detailed documentation
2. Review Supabase Studio for database state
3. Check application logs for errors
4. Consult Supabase documentation
