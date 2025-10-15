# Environment Variables Setup

## Required Environment Variables

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Sentry Configuration
```bash
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

### Application Configuration
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Email Configuration (for future use)
```bash
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com
```

### Database Configuration
```bash
DATABASE_URL=your_database_url
```

## Setup Instructions

1. **Copy the environment variables** to your `.env.local` file
2. **Get Supabase credentials** from your Supabase dashboard
3. **Set up Sentry project** and get the DSN from Sentry dashboard
4. **Update the values** with your actual credentials

## Sentry Setup Steps

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project for "Next.js"
3. Copy the DSN from the project settings
4. Get your organization slug and project name
5. Generate an auth token for source map uploads

## Security Notes

- Never commit `.env.local` to version control
- Use different Sentry projects for development and production
- Rotate your Supabase service role key regularly
- Use environment-specific configurations for different deployments
