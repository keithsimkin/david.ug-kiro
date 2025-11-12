# Production Deployment Checklist

Use this checklist when deploying the Supabase backend to production.

## Pre-Deployment

### 1. Supabase Project Setup

- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Choose appropriate region (closest to users)
- [ ] Save database password securely
- [ ] Note project reference ID
- [ ] Enable database backups (automatic in paid plans)

### 2. Database Configuration

- [ ] Link local project: `supabase link --project-ref your-ref`
- [ ] Review all migration files in `supabase/migrations/`
- [ ] Test migrations locally: `supabase db reset`
- [ ] Push migrations to production: `supabase db push`
- [ ] Verify all tables created in Supabase Studio
- [ ] Verify all indexes created
- [ ] Verify all RLS policies enabled

### 3. Storage Configuration

- [ ] Verify `listing-images` bucket created
- [ ] Verify `avatars` bucket created
- [ ] Check bucket size limits (50MB for listings, 5MB for avatars)
- [ ] Verify storage policies applied
- [ ] Test image upload from application
- [ ] Configure CDN caching headers

### 4. Authentication Setup

- [ ] Configure site URL in Auth settings
- [ ] Add redirect URLs for web and mobile
- [ ] Set JWT expiry (default: 30 days)
- [ ] Enable email confirmations (recommended for production)
- [ ] Configure email templates
- [ ] Set up Google OAuth (if using)
  - [ ] Create Google OAuth credentials
  - [ ] Add to Supabase Auth providers
- [ ] Set up Apple OAuth (if using)
  - [ ] Create Apple OAuth credentials
  - [ ] Add to Supabase Auth providers
- [ ] Test authentication flows

### 5. Security Configuration

- [ ] Review all RLS policies
- [ ] Test RLS policies with different user roles
- [ ] Verify admin-only operations are protected
- [ ] Enable rate limiting (if available)
- [ ] Configure CORS settings
- [ ] Review API key permissions
- [ ] Rotate service role key if exposed
- [ ] Set up IP allowlist (if needed)

### 6. Performance Optimization

- [ ] Verify all indexes are created
- [ ] Review query performance in Studio
- [ ] Enable connection pooling
- [ ] Configure statement timeout
- [ ] Set up database monitoring
- [ ] Review and optimize slow queries

### 7. Data Seeding

- [ ] Seed categories: Run `supabase/seed.sql`
- [ ] Verify categories in Studio
- [ ] Create initial admin user
- [ ] Test admin permissions

## Environment Variables

### Web Application

- [ ] Update production `.env` file:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-production-anon-key
  ```
- [ ] Verify environment variables in Vercel/hosting platform
- [ ] Test connection from deployed web app

### Mobile Application

- [ ] Update production `.env` file:
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
  ```
- [ ] Build new app version with production credentials
- [ ] Test connection from mobile app

## Post-Deployment

### 1. Verification

- [ ] Test user registration
- [ ] Test user login
- [ ] Test listing creation
- [ ] Test image upload
- [ ] Test search functionality
- [ ] Test messaging
- [ ] Test analytics tracking
- [ ] Test admin moderation
- [ ] Verify RLS policies working
- [ ] Check database logs for errors

### 2. Monitoring Setup

- [ ] Enable Supabase monitoring
- [ ] Set up error alerts
- [ ] Configure performance alerts
- [ ] Set up database backup verification
- [ ] Monitor API usage
- [ ] Monitor storage usage
- [ ] Set up uptime monitoring

### 3. Scheduled Tasks

- [ ] Set up cron job for `expire_old_listings()`
  - Recommended: Daily at midnight
  - Use Supabase Edge Functions or external cron service
- [ ] Set up analytics cleanup (optional)
  - Delete events older than 90 days
  - Recommended: Weekly

### 4. Documentation

- [ ] Document production database URL
- [ ] Document API keys (securely)
- [ ] Document admin user credentials
- [ ] Create runbook for common operations
- [ ] Document backup/restore procedures
- [ ] Document rollback procedures

## Maintenance

### Regular Tasks

- [ ] **Daily**: Monitor error logs
- [ ] **Daily**: Check API usage
- [ ] **Weekly**: Review slow queries
- [ ] **Weekly**: Check storage usage
- [ ] **Monthly**: Review and optimize indexes
- [ ] **Monthly**: Verify backups are working
- [ ] **Quarterly**: Review and update RLS policies
- [ ] **Quarterly**: Security audit

### Backup Strategy

- [ ] Verify automatic backups enabled
- [ ] Test backup restoration process
- [ ] Document backup retention policy
- [ ] Set up backup monitoring/alerts
- [ ] Create manual backup before major changes

### Scaling Considerations

- [ ] Monitor database size
- [ ] Monitor connection pool usage
- [ ] Review query performance regularly
- [ ] Plan for database upgrade if needed
- [ ] Consider read replicas for high traffic
- [ ] Plan migration to dedicated database if needed

## Rollback Plan

### If Deployment Fails

1. **Database Issues**
   ```bash
   # Rollback last migration
   supabase migration repair --status reverted <timestamp>
   
   # Or restore from backup
   # Use Supabase dashboard to restore
   ```

2. **Application Issues**
   - Revert to previous deployment
   - Check environment variables
   - Verify API keys are correct

3. **Data Issues**
   - Restore from latest backup
   - Verify data integrity
   - Re-run migrations if needed

## Emergency Contacts

- [ ] Document Supabase support contact
- [ ] Document team escalation path
- [ ] Document on-call rotation
- [ ] Create incident response plan

## Compliance

- [ ] Review data retention policies
- [ ] Verify GDPR compliance (if applicable)
- [ ] Document data deletion procedures
- [ ] Review privacy policy
- [ ] Verify terms of service compliance

## Cost Optimization

- [ ] Review Supabase plan limits
- [ ] Monitor database size vs plan
- [ ] Monitor bandwidth usage
- [ ] Optimize storage usage
- [ ] Review and clean up unused data
- [ ] Consider upgrading plan if needed

## Success Criteria

- [ ] All migrations applied successfully
- [ ] All tests passing
- [ ] Zero critical errors in logs
- [ ] Authentication working
- [ ] File uploads working
- [ ] Search functionality working
- [ ] Real-time features working
- [ ] Admin panel accessible
- [ ] Performance metrics acceptable
- [ ] Monitoring and alerts configured

## Sign-Off

- [ ] Technical lead approval
- [ ] QA testing complete
- [ ] Security review complete
- [ ] Documentation complete
- [ ] Team trained on production system
- [ ] Rollback plan tested
- [ ] Monitoring confirmed working

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Verified By:** _________________

**Notes:**
