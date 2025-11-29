# Supabase Database Setup Guide

## Issue: Tables Deleted After Project Pause

Yes, Supabase can delete tables/data when:
- A project is paused for an extended period (usually 7+ days on free tier)
- The project is manually paused
- Free tier limits are exceeded

## Solution: Recreate the Schema

### Step 1: Reactivate Your Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Find your paused project
3. Click "Restore project" or "Unpause"
4. Wait for the project to be restored (may take a few minutes)

### Step 2: Update Your Connection String

After reactivating, you'll need to update your `.env` file with the new connection strings:

1. In Supabase Dashboard → Settings → Database
2. Copy the **Connection string** (URI format)
3. Also copy the **Direct connection** string if available
4. Update your `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### Step 3: Recreate the Tables

You have **two options**:

#### Option A: Run SQL Script in Supabase SQL Editor (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Open the file `prisma/recreate-schema.sql`
3. Copy and paste the entire SQL script
4. Click "Run" to execute
5. Verify tables are created in the Table Editor

#### Option B: Use Prisma Commands

After updating your `.env` with the correct connection strings:

```bash
# Option 1: Push schema directly (fastest)
npx prisma db push

# Option 2: Create and apply migration
npx prisma migrate dev --name recreate_schema

# Option 3: Deploy existing migrations
npx prisma migrate deploy
```

After either option, run:

```bash
# Generate Prisma Client
npx prisma generate

# Apply the username cascade trigger (if using Option B)
npm run apply-cascade
```

### Step 4: Verify Tables

1. Go to Supabase Dashboard → Table Editor
2. You should see three tables:
   - `User`
   - `Play`
   - `Score`

### Step 5: Test the Connection

```bash
# Test database connection
npx prisma db pull
```

## Preventing Future Data Loss

1. **Regular Backups**: Export your data periodically
2. **Keep Project Active**: Use the project regularly to prevent auto-pause
3. **Upgrade Plan**: Consider upgrading if you need guaranteed uptime
4. **Local Development**: Use a local PostgreSQL database for development

## Troubleshooting

### "Tenant or user not found" Error
- Your project is still paused or connection string is incorrect
- Reactivate the project and update `.env` with new connection strings

### "Relation already exists" Error
- Tables already exist, you can skip recreation or drop them first
- Use `DROP TABLE IF EXISTS` in the SQL script

### Connection Timeout
- Check if your IP is allowed in Supabase Dashboard → Settings → Database → Connection Pooling
- Try using the direct connection string instead of the pooled one

