# Prisma Migration Guide

## Migration Order

Based on your migration files, here's the chronological order:

1. **20251016163209_init** - Creates base tables (User, Play, Score)
2. **20251016165310_init** - Adds `peekCount` and `autoMatchCount` to User table
3. **20251016195015_init** - Adds `inventoryAutoUsed` and `inventoryPeekUsed` to Play table
4. **add_username_cascade.sql** - Creates trigger function (NOT a Prisma migration - run separately)

## Recommended Approach: Use `db push` (Fastest for Fresh Database)

Since your database was deleted and is now empty, the **simplest approach** is to use `prisma db push`:

```bash
# 1. Make sure your .env has the correct DATABASE_URL
# 2. Push the schema directly (creates everything from schema.prisma)
npx prisma db push

# 3. Generate Prisma Client
npx prisma generate

# 4. Run the username cascade trigger (separate SQL file)
#    Copy the contents of prisma/migrations/add_username_cascade.sql
#    and run it in Supabase SQL Editor
```

**Why `db push`?**
- Your `schema.prisma` already contains the final state (all columns from all migrations)
- `db push` will create everything in one go
- No need to run migrations individually
- Faster and simpler for a fresh database

## Alternative: Use Migrations (If You Want to Track History)

If you prefer to use the migration system:

```bash
# 1. Make sure your .env has the correct DATABASE_URL
# 2. Deploy all migrations in order
npx prisma migrate deploy

# 3. Generate Prisma Client
npx prisma generate

# 4. Run the username cascade trigger
#    Copy the contents of prisma/migrations/add_username_cascade.sql
#    and run it in Supabase SQL Editor
```

**Note:** `migrate deploy` will apply migrations in chronological order automatically.

## Important: Username Cascade Trigger

The `add_username_cascade.sql` file is **NOT a Prisma migration** - it's a standalone SQL file that needs to be run separately:

1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `prisma/migrations/add_username_cascade.sql`
3. Paste and run it

This creates a trigger that automatically updates usernames in the Score table when a User's username changes.

## Verification

After running either approach, verify your tables:

```bash
# Check database connection
npx prisma db pull

# Or check in Supabase Dashboard → Table Editor
```

You should see:
- ✅ `User` table with: id, username, peekCount, autoMatchCount, createdAt
- ✅ `Play` table with: id, userId, startTime, endTime, finalTimeMs, penaltiesMs, powerupsPeek, powerupsAuto, inventoryPeekUsed, inventoryAutoUsed, createdAt, updatedAt
- ✅ `Score` table with: id, userId, username, finalTimeMs, createdAt
- ✅ Indexes on Score table
- ✅ Foreign key constraints
- ✅ Username cascade trigger function

## Troubleshooting

### If `db push` fails:
- Check your DATABASE_URL in `.env`
- Make sure Supabase project is active (not paused)
- Try `npx prisma migrate deploy` instead

### If migrations are out of sync:
- You can reset: `npx prisma migrate reset` (⚠️ deletes all data)
- Or use `db push` to sync directly

