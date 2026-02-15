# Railway Environment Variables Setup

After the build succeeds, you need to set these environment variables in Railway for the app to run properly.

## Steps to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your **Node.js** service
3. Go to the **Variables** tab
4. Add each of these environment variables:

## Required Environment Variables

```
NODE_ENV=production
DB_HOST=<your-mysql-host>
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=coe_ecommerce
DB_PORT=3306

JWT_SECRET=<generate-strong-32-char-string>
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=<your-razorpay-test-key>
RAZORPAY_KEY_SECRET=<your-razorpay-test-secret>

SHIPROCKET_EMAIL=<your-shiprocket-email>
SHIPROCKET_PASSWORD=<your-shiprocket-password>

PORT=4000
FRONTEND_ORIGIN=https://your-railway-domain.railway.app
```

## How to Generate JWT_SECRET

Run this command locally to generate a strong random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Connection

### Option 1: Use Railway's MySQL Plugin
1. In your Railway project, click **Create**
2. Add **MySQL** plugin
3. Railway will automatically provide `DB_HOST`, `DB_USER`, `DB_PASSWORD`
4. Use these values in your variables

### Option 2: Use External Database
If you're using an external MySQL database (like in your `.env.example`):
- Make sure the database is accessible from Railway
- Whitelist Railway's IP addresses if needed
- Use the correct connection string in `DB_HOST`

## Getting Razorpay Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Use the **Test Mode** keys for development/staging
4. Copy `Key ID` and `Key Secret`

## Getting ShipRocket Credentials

1. Log in to [ShipRocket Dashboard](https://www.shiprocket.in/)
2. Go to **Settings** → **API** or **Account Settings**
3. Find your email and API credentials
4. Add them to Railway variables

## After Setting All Variables

1. **Redeploy** your Railway service
2. Check the **Deployments** tab - it should deploy successfully now
3. Once deployed, click the **Public URL** to test your app

## Troubleshooting

If deployment still fails:
1. Check the **Build Logs** for errors
2. Check the **Runtime Logs** after deployment
3. Make sure all variables are set correctly
4. Ensure your MySQL database is running and accessible
5. Verify Razorpay keys are in Test mode (not Live mode for now)
