# Production Deployment Guide for Inventra SaaS

This guide covers deploying Inventra to production for large-scale usage.

## Prerequisites

- Node.js 20+ 
- PostgreSQL database (Neon recommended)
- Redis (Upstash recommended)
- Stripe account for payments
- Sentry account for error tracking
- Vercel account for hosting
- Domain name

## 1. Database Setup (Neon PostgreSQL)

### Create Neon Project
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string with `?sslmode=require&pgbouncer=true`
4. Enable read replicas for better performance

### Environment Variables
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/inventra?sslmode=require"
DATABASE_READ_REPLICA_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### Database Migrations
```bash
npm run db:push
npm run db:migrate
```

### Backup Strategy
- Neon provides automatic daily backups
- Enable point-in-time recovery (PITR) for 7-30 days
- Set up automated backup exports to S3

## 2. Redis Setup (Upstash)

### Create Upstash Redis
1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token

### Environment Variables
```bash
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx"
```

### Redis Usage
- Rate limiting (distributed)
- Caching layer
- Session storage
- Queue management

## 3. Authentication Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect: `https://yourdomain.com/api/auth/callback/google`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create OAuth App
3. Callback URL: `https://yourdomain.com/api/auth/callback/github`

### Environment Variables
```bash
AUTH_SECRET="run: openssl rand -base64 32"
AUTH_URL="https://yourdomain.com"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

## 4. Email Setup (Resend)

### Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Create API key
3. Verify your domain

### Environment Variables
```bash
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

## 5. File Uploads (Uploadthing)

### Create Uploadthing Account
1. Go to [uploadthing.com](https://uploadthing.com)
2. Create new app
3. Configure file types and limits

### Environment Variables
```bash
UPLOADTHING_SECRET="sk_live_xxxxxxxxxxxxxxxxxxxx"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
```

## 6. Stripe Payment Setup

### Create Stripe Account
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create products and prices
3. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`

### Create Products
- Basic: $9/month
- Pro: $29/month  
- Enterprise: $99/month

### Environment Variables
```bash
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxx"
STRIPE_PRICE_ID_BASIC="price_xxxxxxxxxxxxxxxx"
STRIPE_PRICE_ID_PRO="price_xxxxxxxxxxxxxxxx"
STRIPE_PRICE_ID_ENTERPRISE="price_xxxxxxxxxxxxxxxx"
```

## 7. Error Tracking (Sentry)

### Create Sentry Project
1. Go to [sentry.io](https://sentry.io)
2. Create new project
3. Copy DSN

### Environment Variables
```bash
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
SENTRY_AUTH_TOKEN="sntrys_xxxxxxxxxxxxxxxxxxxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

## 8. Vercel Deployment

### Deploy to Vercel
1. Connect GitHub repository to Vercel
2. Add all environment variables
3. Deploy from main branch

### Environment Variables in Vercel
Add all the above variables in Vercel dashboard settings.

### Domain Configuration
1. Add custom domain in Vercel
2. Update DNS records
3. Enable automatic HTTPS

## 9. CI/CD Pipeline

### GitHub Actions
The `.github/workflows/deploy.yml` file includes:
- Automated testing
- Type checking
- Building
- Deployment to Vercel
- Database migrations

### Required GitHub Secrets
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- All environment variables from above

## 10. Monitoring & Scaling

### Health Checks
- `/api/health` - Overall health status
- `/api/health/ready` - Readiness probe

### Monitoring
- Sentry for errors
- Vercel Analytics for performance
- Custom metrics in dashboard

### Scaling Strategy
- **Database**: Neon auto-scales, enable read replicas
- **Redis**: Upstash auto-scales
- **Application**: Vercel auto-scales with serverless
- **CDN**: Vercel Edge Network for static assets

### Rate Limiting
- API: 100 requests/minute per user
- Auth: 5 attempts/minute
- General: 10 requests/10 seconds

## 11. Security Checklist

- [ ] Enable HTTPS
- [ ] Set up CSP headers (already in middleware)
- [ ] Enable rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Enable audit logging
- [ ] Set up intrusion detection

## 12. Performance Optimization

### Database
- Use connection pooling (pgbouncer enabled)
- Enable read replicas for read-heavy queries
- Add indexes for frequently queried fields
- Use `dbRead` for read operations

### Caching
- Redis for session data
- Cache frequently accessed data
- Cache API responses
- Invalidate cache on data changes

### CDN
- Vercel Edge Network for static assets
- Image optimization
- Bundle splitting

## 13. Backup & Recovery

### Database Backups
- Neon provides automatic daily backups
- Enable PITR (Point-in-Time Recovery)
- Export backups to S3 weekly

### Recovery Procedure
1. Identify failure point
2. Restore from backup if needed
3. Replay transactions from PITR
4. Verify data integrity
5. Monitor system health

## 14. Load Testing

### Recommended Tools
- k6 for load testing
- Artillery for API testing
- Lighthouse for performance

### Test Scenarios
- 1000 concurrent users
- 10,000 requests/minute
- Database query performance
- Cache hit rate

## 15. Troubleshooting

### Common Issues

**Database Connection Issues**
- Check DATABASE_URL format
- Verify SSL certificates
- Check connection pool settings

**Redis Connection Issues**
- Verify UPSTASH_REDIS_REST_URL
- Check token validity
- Test with Redis CLI

**Stripe Webhook Failures**
- Verify webhook secret
- Check webhook URL accessibility
- Review Stripe dashboard logs

**High Memory Usage**
- Check for memory leaks
- Optimize caching strategy
- Review database queries

## 16. Maintenance

### Regular Tasks
- Weekly: Review error logs in Sentry
- Monthly: Update dependencies
- Quarterly: Security audit
- Annually: Disaster recovery drill

### Updates
```bash
# Update dependencies
npm update

# Database migrations
npm run db:migrate

# Clear cache
# (Redis auto-expires, but can manually flush if needed)
```

## Support

For issues or questions:
- Check Sentry error logs
- Review Vercel deployment logs
- Check database and Redis status
- Review Stripe dashboard for payment issues
