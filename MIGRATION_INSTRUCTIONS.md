# Database Migration Instructions

## Adding Address, Phone, and Logo Fields

To apply the new database schema changes, run the following migration:

### Option 1: Using the migration script

```bash
cd backend
node scripts/run-migration.js scripts/add-address-phone-logo.sql
```

### Option 2: Manual SQL execution

Connect to your PostgreSQL database and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500);
```

## What Changed

### Database Schema

- Added `address` field to users table (VARCHAR 500)
- Added `phone` field to users table (VARCHAR 50)
- Added `logo_path` field to users table (VARCHAR 500)

### Backend Changes

1. Updated User model interface to include new fields
2. Updated settings controller to handle address, phone, and logoPath
3. Modified PDF service to:
   - Use user's address and phone in GHG reports
   - Display company logo if provided
   - Fixed reporting period to use full 12-month period (GHG Protocol standard)
   - Fixed checkbox display (showing only checked No or Yes, not both)

### Frontend Changes

1. Added address, phone, and logo fields to Settings page
2. Added validation warnings indicating these fields are required for complete reports
3. Added alert on Dashboard when profile is incomplete
4. Updated UserProfile interface to include new fields

### Carbon Calculation Changes

- Modified emission calculation to use 12-month reporting periods (Jan 1 - Dec 31) by default
- This aligns with GHG Protocol Corporate Standard requirements

## After Migration

1. Users should go to Settings and fill in:

   - Company Address
   - Phone Number
   - Company Logo URL (optional)

2. These fields will be automatically included in GHG Protocol reports

3. Dashboard will show a warning if these fields are not filled in
