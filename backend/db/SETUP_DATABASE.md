# Database Setup Instructions

## Prerequisites
- XAMPP running (MySQL service started)
- Database name: `coe_ecommerce`

## Method 1: MySQL Command Line (Recommended)

### Step 1: Open MySQL command line
1. Open **XAMPP Control Panel**
2. Click **Shell** button (or open Command Prompt/Terminal)
3. Navigate to MySQL:
   ```bash
   cd C:\xampp\mysql\bin
   mysql.exe -u root -p
   ```
   (Enter password if you set one, otherwise just press Enter)

### Step 2: Run schema.sql (creates database and tables)
```bash
source D:/Projects/COE\ -\ Copy/coe-project/backend/db/schema.sql
```
**OR** from project root:
```bash
source backend/db/schema.sql
```

### Step 3: Run seed.sql (inserts initial data)
```bash
source D:/Projects/COE\ -\ Copy/coe-project/backend/db/seed.sql
```
**OR**:
```bash
source backend/db/seed.sql
```

### Alternative: One-liner from Command Prompt
```bash
cd "D:\Projects\COE - Copy\coe-project\backend\db"
C:\xampp\mysql\bin\mysql.exe -u root -p < schema.sql
C:\xampp\mysql\bin\mysql.exe -u root -p < seed.sql
```

---

## Method 2: phpMyAdmin (GUI - Easier)

### Step 1: Open phpMyAdmin
1. Open browser: `http://localhost/phpmyadmin`
2. Login (default: username `root`, password empty)

### Step 2: Run schema.sql
1. Click **Import** tab (top menu)
2. Click **Choose File** → select `schema.sql` from:
   ```
   D:\Projects\COE - Copy\coe-project\backend\db\schema.sql
   ```
3. Click **Go** (bottom right)
4. Wait for success message

### Step 3: Run seed.sql
1. Click **Import** tab again
2. Click **Choose File** → select `seed.sql`
3. Click **Go**
4. Done! ✅

---

## Verify Setup

After running both files, verify in phpMyAdmin:
- Database `coe_ecommerce` exists
- Tables: `users`, `categories`, `products`, `orders`, `order_items`, `addresses`, `payments`, `admin_audit_logs`
- Check `users` table → should have admin user: `admin@coe.com`
- Check `categories` table → should have "Handicrafts" and "Handloom"
- Check `products` table → should have 2 products

---

## Troubleshooting

**Error: "Database already exists"**
- Schema uses `CREATE DATABASE IF NOT EXISTS` - safe to run again

**Error: "Table already exists"**
- Schema uses `CREATE TABLE IF NOT EXISTS` - safe to run again

**Error: "Access denied"**
- Check MySQL username/password in `backend/.env`
- Default XAMPP: username `root`, password empty (blank)

**Error: "Unknown database"**
- Make sure you ran `schema.sql` BEFORE `seed.sql`
- Schema creates the database, seed inserts data

---

## Quick Setup Script (Windows)

Create `setup-db.bat` in `backend/db/` folder:

```batch
@echo off
echo Setting up COE database...
cd /d "%~dp0"
C:\xampp\mysql\bin\mysql.exe -u root -p < schema.sql
C:\xampp\mysql\bin\mysql.exe -u root -p < seed.sql
echo Done! Check phpMyAdmin to verify.
pause
```

Run it: Double-click `setup-db.bat` (enter MySQL password when prompted)
