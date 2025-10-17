# Username Cascade Setup

This document explains how to set up automatic username updates in the scores table when users change their usernames.

## Overview

When a user updates their username, we want to automatically update all their existing scores in the leaderboard to reflect the new username. This is implemented in two ways:

1. **Database Trigger** (Primary) - PostgreSQL trigger that automatically updates scores
2. **Application Logic** (Backup) - Manual update in the API endpoints

## Setup Instructions

### 1. Apply Database Trigger

Run the following command to apply the database trigger:

```bash
npm run apply-cascade
```

This will:
- Create a PostgreSQL function `update_scores_username()`
- Create a trigger `trigger_update_scores_username` on the User table
- Automatically update all scores when a user's username changes

### 2. Verify Setup

After applying the cascade, you can test it by:

1. **Update a username** through the UI
2. **Check the database** to see if scores were updated
3. **View the leaderboard** to confirm the new username appears

## How It Works

### Database Trigger (Primary Method)

```sql
-- Function that updates all scores for a user
CREATE OR REPLACE FUNCTION update_scores_username()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Score" 
    SET username = NEW.username 
    WHERE "userId" = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that fires when username is updated
CREATE TRIGGER trigger_update_scores_username
    AFTER UPDATE OF username ON "User"
    FOR EACH ROW
    WHEN (OLD.username IS DISTINCT FROM NEW.username)
    EXECUTE FUNCTION update_scores_username();
```

### Application Logic (Backup Method)

The API endpoints also manually update scores:

- **`/api/users/update-username`** - Dedicated endpoint for username updates
- **`/api/users/upsert`** - General user upsert with cascade logic

## API Endpoints

### Update Username
```
POST /api/users/update-username
{
  "userId": "0x1234...",
  "username": "NewUsername"
}
```

**Response:**
```json
{
  "user": { "id": "0x1234...", "username": "NewUsername", ... },
  "updatedScoresCount": 5
}
```

## Leaderboard Changes

- **Top 20 players** - Limited to first 20 scores instead of 50
- **Automatic updates** - Username changes reflect immediately in leaderboard
- **User highlighting** - Current user's entries are highlighted

## Troubleshooting

### Trigger Not Working
If the database trigger doesn't work:
1. Check if the trigger was applied: `npm run apply-cascade`
2. Verify database permissions
3. Check PostgreSQL logs for errors

### Manual Update
If you need to manually update scores for a user:

```sql
UPDATE "Score" 
SET username = 'NewUsername' 
WHERE "userId" = '0x1234...';
```

### Reset Trigger
To reapply the trigger:

```bash
npm run apply-cascade
```

## Benefits

- ✅ **Automatic updates** - No manual intervention needed
- ✅ **Data consistency** - All scores always have current username
- ✅ **Performance** - Database-level updates are fast
- ✅ **Reliability** - Backup application logic ensures updates happen
- ✅ **User experience** - Username changes reflect immediately in leaderboard

## Files Modified

- `prisma/migrations/add_username_cascade.sql` - Database trigger
- `scripts/apply-username-cascade.js` - Setup script
- `src/app/api/users/update-username/route.ts` - Dedicated API endpoint
- `src/app/api/users/upsert/route.ts` - Enhanced with cascade logic
- `src/app/api/leaderboard/route.ts` - Limited to top 20
- `src/components/UsernameModal.tsx` - Uses new endpoint
- `package.json` - Added cascade script
