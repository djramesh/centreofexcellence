# Railway Deployment Guide - Complete Setup 🚀

> **Status:** Feb 14, 2026 | For: COE Ecommerce Platform

---

## Overview

Railway hosting setup for:
- ✅ **Backend:** Node.js + Express (Railway Service)
- ✅ **Database:** MySQL (Railway MySQL Add-on)
- ✅ **Frontend:** Already on Netlify (no changes needed)
- ✅ **Domain:** Custom domain pointing to Railway backend + Netlify frontend

---

## PART 1: Railway Account Setup

### Step 1.1: Create Railway Account

1. Go to https://railway.app
2. Click **"Create Account"**
3. Sign up with GitHub (recommended - easier deployment)
4. Authorize Railway to access your GitHub account
5. Click **"Deploy Now"**

### Step 1.2: Create New Project

1. Dashboard → Click **"New Project"**
2. Select **"Create a new project"**
3. Name it: `coe-ecommerce` (optional, whatever you want)
4. Click **"Create"**

---

## PART 2: GitHub Configuration (for automatic deployment)

### Step 2.1: Connect GitHub Repository

1. In Railway Dashboard → **"Add Service"**
2. Select **"GitHub Repo"**
3. Select the repository where your code is
4. Choose branch: `main` (or your main branch)
5. Click **"Deploy"**

Railway will automatically detect the Node.js project and deploy it!

---

## PART 3: MySQL Database Setup

### Step 3.1: Add MySQL Database

1. In your Railway Project → **"Add Service"** → **"MySQL"**
2. Railway will create MySQL automatically
3. Click on **"MySQL"** service → **"Variables"** tab
4. You'll see:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

### Step 3.2: Initialize Database

You have TWO options:

#### **Option A: Using Railway Terminal (Recommended)**

1. In Railway MySQL service → Click **"Connect"** → **"Terminal"**
2. Paste your database schema from `backend/db/schema.sql`
3. Import it:

```bash
# Inside the Railway terminal
mysql -h MYSQL_HOST -u MYSQL_USER -p MYSQL_DATABASE < schema.sql
```

Or paste the SQL directly in the terminal:

```sql
-- Copy entire content of backend/db/schema.sql and paste here
```

#### **Option B: Using MySQL Client Locally**

```bash
# In your local terminal
# Export credentials from Railway Dashboard

export MYSQL_HOST="your-railway-mysql-host.railway.app"
export MYSQL_USER="root"
export MYSQL_PASSWORD="your_generated_password"
export MYSQL_DATABASE="railway"

# Import schema
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backend/db/schema.sql

# Verify
mysql -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "SHOW TABLES;"
```

**To get MySQL credentials from Railway:**
1. Click MySQL service → Variables tab
2. See all credentials there (hover to show values)

---

## PART 4: Environment Variables Configuration

### Step 4.1: Set Backend Environment Variables

1. In Railway Project → **"Node.js Service"** (or your backend service)
2. Click **"Variables"** tab
3. **"Raw Editor"** or **"Add Variable"**

**Add these variables:**

```env
NODE_ENV=production
PORT=4000

# Database (from Railway MySQL)
DB_HOST=${MYSQL_HOST}
DB_PORT=3306
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}

# Frontend URL (for CORS)
# This is your Netlify frontend URL
FRONTEND_ORIGIN=https://your-netlify-domain.netlify.app
ALLOWED_ORIGINS=https://your-netlify-domain.netlify.app,https://yourdomain.com

# JWT Secret (GENERATE NEW ONE!)
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your_strong_jwt_secret_here>
JWT_EXPIRES_IN=7d

# Razorpay (Keep TEST keys for now, switch to LIVE when ready)
RAZORPAY_KEY_ID=rzp_test_your_test_key
RAZORPAY_KEY_SECRET=your_test_secret

# ShipRocket (Optional - add only if using)
SHIPROCKET_EMAIL=your_email@example.com
SHIPROCKET_PASSWORD=your_password

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
```

### Step 4.2: Link MySQL Variables to Backend

Railway can automatically share variables between services:

1. Click on **Node.js Service**
2. Go to **"Variables"**
3. In the raw editor, at the top you should see references to MySQLconnection details
4. Simply use the suggested variables like: `${MYSQL_HOST}`, `${MYSQL_PORT}`, etc.

---

## PART 5: GitHub Automatic Deployment Setup

### Step 5.1: Connect GitHub for Auto-Deploy

1. In Railroad → Node.js Service → **"Deployments"** tab
2. Click **"Connect Repository"**
3. Select your GitHub account and repository
4. Select branch (e.g., `main`)
5. **"Automatic Deployment"** toggle ON

Now every push to `main` branch will auto-deploy!

### Step 5.2: Deployment Triggers

You can also manually trigger deployments:

1. **"Deployments"** tab
2. Find your latest deployment
3. Click **"Redeploy"** if needed

---

## PART 6: Get Your Railway Backend URL

### Step 6.1: Find Backend Public URL

1. Click on **Node.js Service**
2. Top-right corner, you'll see a **"URL"** (something like `https://coe-backend-production.up.railway.app`)
3. Copy this URL

### Step 6.2: Update Frontend API URL

Now you need to tell your Netlify frontend where the backend is:

#### **For Netlify Frontend:**

1. Go to **Netlify Dashboard** → Your site
2. **Site settings** → **Build & deploy** → **Environment**
3. Add environment variable:
   ```
   VITE_API_URL=https://your-railway-backend.up.railway.app
   ```
4. Trigger a new deploy (push to GitHub or manual trigger)

#### **Check Your Frontend .env.production:**

```env
# frontend/.env.production
VITE_API_URL=https://your-railway-backend.up.railway.app
```

---

## PART 7: Custom Domain Setup

### Step 7.1: Add Custom Domain to Railway Backend

1. Railway Project → **Node.js Service**
2. **"Settings"** → **"Domain"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `api.yourdomain.com`)
5. Railway gives you a CNAME record to add

### Step 7.2: Configure DNS (your domain registrar)

Where you bought your domain (`Godaddy`, `Namecheap`, etc.):

1. Go to **DNS Settings/Management**
2. Add CNAME record:
   ```
   Host: api
   Type: CNAME
   Value: cname.railway.app  (or whatever Railway gives you)
   ```
   OR:
   ```
   Host: api.yourdomain.com
   Type: CNAME
   Value: your-railway-app.up.railway.app
   ```

3. Wait for DNS to propagate (~5 minutes to 48 hours)
4. Test: `https://api.yourdomain.com/api/health`

### Step 7.3: Update Frontend to Use Custom Domain

Update Netlify environment:

```env
VITE_API_URL=https://api.yourdomain.com
```

Trigger redeploy.

### Step 7.4: Frontend Domain (Already on Netlify)

For the main site domain (e.g., `yourdomain.com`):

1. Netlify Dashboard → **Site settings** → **Domain management**
2. Add custom domain: `yourdomain.com` (or `www.yourdomain.com`)
3. Netlify gives you nameservers to configure
4. Update at your domain registrar's DNS settings
5. Wait for propagation

---

## PART 8: Database Backup Strategy

### Step 8.1: Regular Backups on Railway

Railway doesn't auto-backup MySQL, so:

#### **Option A: Use Railway's Data Export**
1. MySQL Service → **"Data"** tab
2. You can view/export your database

#### **Option B: Set Up Scheduled Backups (Recommended)**

Create a backup script locally:

```bash
#!/bin/bash
# backup.sh

MYSQL_HOST="your-railway-mysql-host.railway.app"
MYSQL_USER="root"
MYSQL_PASSWORD="your_password"
MYSQL_DATABASE="railway"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create backup
mysqldump -h $MYSQL_HOST -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 backups
ls -1t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs rm -f

echo "✅ Backup created: backup_$TIMESTAMP.sql"
```

Run weekly via cron:

```bash
# Add to crontab
0 2 * * 0 /path/to/backup.sh
# (Runs every Sunday at 2 AM)
```

---

## PART 9: Monitoring & Logs

### Step 9.1: View Logs

In Railway:

1. Click **Node.js Service**
2. **"Logs"** tab
3. Real-time logs showing all requests/errors
4. Filter by keyword if needed

### Step 9.2: Set Up Alerts

1. Railway → **"Settings"** → **"Alerts"**
2. Creates emails for deployment failures, errors, etc.

---

## PART 10: Troubleshooting

### 🔴 Backend shows error after deploy

**Check:**
1. Railway logs for actual error
2. Environment variables are set correctly
3. Database connection string is correct
4. Database schema was imported

**Common errors:**

```
Error: ER_BAD_DB_ERROR
→ Database not created
→ Import schema.sql again

Error: ER_ACCESS_DENIED_FOR_USER
→ Wrong password in env vars
→ Check MySQL variables in Railway

Application crashed
→ Check server logs
→ Verify all required env vars are set
```

### 🔴 Frontend can't reach backend

**Check:**
1. `VITE_API_URL` is set correctly in Netlify
2. CORS is configured correctly in backend
3. Test manually: `curl https://api.yourdomain.com/api/health`
4. Check browser console for CORS errors

### 🔴 Domain not working

**Wait for DNS propagation:**
```bash
# Check DNS
nslookup yourdomain.com
dig yourdomain.com
```

---

## COMPLETE CHECKLIST

- [ ] **Railway Account Created**
- [ ] **GitHub Connected to Railway**
- [ ] **MySQL Database Created on Railway**
- [ ] **Schema Imported** (verify with: `SHOW TABLES;`)
- [ ] **Environment Variables Set:**
  - [ ] DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
  - [ ] JWT_SECRET (strong random string)
  - [ ] RAZORPAY_KEY_ID & KEY_SECRET
  - [ ] SHIPROCKET credentials (if using)
  - [ ] FRONTEND_ORIGIN
- [ ] **Backend Deployed Successfully**
- [ ] **Health Check Passing:** `GET https://your-backend.up.railway.app/api/health`
- [ ] **Custom Domain Added:** `api.yourdomain.com`
- [ ] **DNS Records Configured** (CNAME records)
- [ ] **Frontend Environment Updated:** `VITE_API_URL=https://api.yourdomain.com`
- [ ] **Netlify Redeployed** (frontend picks up new env vars)
- [ ] **Test Payment Flow:** Create order, test Razorpay (test mode)
- [ ] **Database Backups Configured**
- [ ] **SSH Access** Optional - for manual operations

---

## PRODUCTION LAUNCH CHECKLIST

Before making your site public:

### Security
- [ ] Change all default passwords
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] CORS is configured for your domain only
- [ ] Rate limiting is active
- [ ] Environment variables are NOT in git

### Testing
- [ ] Test full user registration flow
- [ ] Test product listing/filtering
- [ ] Test add to cart
- [ ] Test checkout with Razorpay (TEST MODE)
- [ ] Test order history
- [ ] Test admin login (separate admin account)
- [ ] Test admin dashboard
- [ ] Load test with multiple users

### Monitoring
- [ ] Email alerts configured on Railway
- [ ] Logs accessible and readable
- [ ] Database backup running
- [ ] SSL certificate auto-renewed (Railway handles this)

### Razorpay
- [ ] Currently using TEST keys ✅ (good)
- [ ] When ready for real money:
  - Get LIVE keys from Razorpay
  - Update RAZORPAY_KEY_ID & KEY_SECRET
  - Test thoroughly
  - Switch in production

---

## Quick Commands Reference

```bash
# Test backend locally
cd backend
npm start

# Test frontend locally with correct API URL
cd frontend
VITE_API_URL=https://your-railway-backend.up.railway.app npm run build

# SSH into Railway (if needed)
railway connect mysql

# View Railway logs
railway logs

# Deploy from CLI
npm install -g @railway/cli
railway up
```

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Status:** https://railway.app/status
- **Contact Support:** support@railway.app

---

## NEXT STEPS

1. **Today:** Complete Railway setup (2-3 hours)
2. **Tomorrow:** Test full flow (1 hour)
3. **Day 3:** Enable Razorpay LIVE keys (when ready)
4. **Day 4:** Go public! 🎉

---

**Generated:** February 14, 2026  
**Platform:** Railway.app  
**Status:** Ready for Production  

Phir baas setup karte ho aur deploy! 🚀
