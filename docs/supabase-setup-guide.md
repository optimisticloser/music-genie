# Supabase Setup Guide for Music Genie

This guide will help you set up Supabase for the Music Genie application with proper authentication, database schema, and security policies.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Node.js and npm installed
- Basic understanding of PostgreSQL and SQL

## Step 1: Create Supabase Project

1. **Sign in to Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Sign in or create an account

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Enter project name: `music-genie`
   - Create a strong database password (save it securely!)
   - Select a region closest to your users
   - Click "Create new project"

3. **Wait for Setup**
   - Project creation takes 1-2 minutes
   - You'll see a progress indicator

## Step 2: Get API Keys

1. **Navigate to Project Settings**
   - In your project dashboard, click "Settings" in the sidebar
   - Go to "API" section

2. **Copy Required Keys**
   ```bash
   # Add these to your .env.local file
   NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

3. **Update Environment Variables**
   - Create `.env.local` in your project root
   - Add the keys above with your actual values
   - Never commit these keys to version control

## Step 3: Run Database Migration

1. **Open SQL Editor**
   - In Supabase dashboard, go to "SQL Editor"
   - Click "New query"

2. **Execute Schema Migration**
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see these tables:
     - `users`
     - `playlist_lineage`
     - `playlists`
     - `playlist_tracks`
     - `playlist_shares`
     - `user_preferences`

## Step 4: Configure Authentication

1. **Enable Email Authentication**
   - Go to "Authentication" → "Settings"
   - Ensure "Enable email confirmations" is checked
   - Set "Site URL" to `http://localhost:3000` (development)

2. **Configure Email Templates (Optional)**
   - Go to "Authentication" → "Email Templates"
   - Customize signup confirmation and password reset emails

3. **Set Up OAuth Providers (Optional)**
   - Go to "Authentication" → "Providers"
   - Enable Google, GitHub, or other providers as needed
   - Configure OAuth credentials

## Step 5: Configure Row Level Security (RLS)

The migration script automatically enables RLS and creates policies. Verify by:

1. **Check RLS Status**
   - Go to "Table Editor"
   - Click on any table (e.g., `playlists`)
   - Ensure "Enable RLS" is checked

2. **Review Policies**
   - Click "View Policies" for each table
   - Verify policies are created for SELECT, INSERT, UPDATE, DELETE

## Step 6: Test Database Connection

1. **Run the Application**
   ```bash
   npm run dev
   ```

2. **Check Console**
   - No Supabase connection errors should appear
   - Database queries should work properly

## Step 7: Production Configuration

When deploying to production:

1. **Update Environment Variables**
   - Add the same environment variables to Vercel/your hosting platform
   - Mark sensitive keys as "encrypted" in Vercel

2. **Update Site URL**
   - In Supabase dashboard, go to "Authentication" → "Settings"
   - Update "Site URL" to your production domain
   - Add production domain to "Additional Redirect URLs"

3. **Configure SMTP (Recommended)**
   - Go to "Settings" → "Auth"
   - Configure custom SMTP for production emails
   - This ensures reliable email delivery

## Security Best Practices

### 1. Environment Variables
- Never commit `.env.local` to version control
- Use different Supabase projects for development/production
- Rotate API keys regularly

### 2. Row Level Security
- Always enable RLS on tables with user data
- Test policies thoroughly with different user scenarios
- Use `auth.uid()` function to identify current user

### 3. Database Access
- Use service role key only on the server
- Never expose service role key to client-side code
- Implement proper error handling for database operations

### 4. Authentication
- Enable email confirmation for new users
- Set up proper password policies
- Consider implementing MFA for sensitive operations

## Troubleshooting

### Common Issues

1. **"Invalid API key" Error**
   - Verify environment variables are correct
   - Check if keys are properly loaded (restart dev server)

2. **RLS Policy Errors**
   - Check if user is authenticated
   - Verify policy conditions match your use case
   - Test policies in SQL editor with `auth.uid()`

3. **Migration Errors**
   - Ensure you have proper permissions
   - Check for syntax errors in SQL
   - Run migrations one section at a time if needed

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

## Next Steps

After completing this setup:

1. **Test Authentication Flow**
   - Implement signup/login pages
   - Test user creation and authentication

2. **Build Playlist Features**
   - Create playlist generation functionality
   - Implement CRUD operations for playlists

3. **Add Spotify Integration**
   - Set up Spotify OAuth
   - Implement track search and playlist creation

4. **Deploy to Production**
   - Configure production environment
   - Test all features in production environment 