# Razorpay: Test Mode → Live Mode Migration Guide

> **Status:** For COE Ecommerce Platform  
> **Currently:** Using TEST keys ✅ (No real payments)  
> **When to switch:** After full testing and ready to accept real payments

---

## ✅ CURRENT STATUS (TEST MODE)

```
✅ TEST Keys are configured:
   RAZORPAY_KEY_ID=rzp_test_SAY5U3QnFI4oAn
   RAZORPAY_KEY_SECRET=Q3L2oqzl0SL3BexL8XSW86kX

✅ This means:
   - Can test full payment flow
   - No real money charged
   - Can use test cards: 4111 1111 1111 1111
   - Safe for development/staging

⚠️  DO NOT SWITCH TO LIVE KEYS UNTIL:
   - Full user testing completed
   - Admin dashboard verified
   - Order tracking working
   - Customer support ready
```

---

## Test Payment Cards

Use these test cards to test the full payment flow:

### ✅ Successful Payment
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
```

### ❌ Failed Payment
```
Card Number: 4000 0000 0000 0002
Expiry: 12/25
CVV: 123
```

### Other Test Cards
- **Visa Valid:** 4242 4242 4242 4242
- **Amex Valid:** 3782 822463 10005
- Any future expiry date works
- Any 3-4 digit CVV works

---

## Step 1: Testing in TEST Mode

### 1.1 Test Full Payment Flow

```bash
# In your application:
1. Register/Login as customer
2. Add products to cart
3. Go to checkout
4. Enter test card details (above)
5. Complete payment
6. Verify order appears in /api/orders
7. Check order in admin dashboard
8. Test order invoice/PDF generation
```

### 1.2 Verify Test Payments in Razorpay

1. Go to https://dashboard.razorpay.com
2. Make sure you're in **"Test Mode"** (toggle in top-right)
3. Go to **Payments** section
4. You should see your test payments
5. Click on a payment to see details

### 1.3 Test Webhook (Optional)

Razorpay can send real-time updates to your backend:

1. Razorpay Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-api.com/api/checkout/webhook`
3. Select events:
   - `payment.authorized`
   - `payment.failed`
   - `payment.captured`
4. Get webhook signing key from dashboard

---

## Step 2: Preparing for Live Mode

### 2.1 Complete Razorpay KYC/Activation

1. Razorpay Dashboard → **Account Settings**
2. Complete **Business Details**:
   - Business name
   - Business type
   - PAN, GSTIN (if applicable)
   - Bank details
3. Complete **Personal Details** (owner info)
4. Upload **Business documents**
5. Submit for verification (takes 2-3 business days)

### 2.2 Set Up Razorpay Settlement

1. **Settings** → **Banking & Settlements**
2. Add bank account where money will be deposited
3. Razorpay verifies with small test deposits
4. Confirm the amounts in your bank
5. Activate settlement schedule

### 2.3 Update Razorpay Support

1. **Settings** → **Email**
2. Set support email for customer inquiries
3. Set refund/dispute handling email

---

## Step 3: Get LIVE Keys

### 3.1 Generate Live API Keys

1. Razorpay Dashboard
2. **Settings** → **API Keys**
3. Make sure you're in **"Live Mode"** (toggle in top-right)
4. You'll see LIVE keys:
   - `Live Key ID: rzp_live_xxxxxxxxxxxxx`
   - `Live Key Secret: xxxxxxxxxxxxx`
5. **IMPORTANT:** These are different from TEST keys!

### 3.2 Secure Your Live Keys

```
🔴 CRITICAL SECURITY RULES:

✅ DO:
   - Store in secure env variables (Railway)
   - Change them immediately if compromised
   - Use different keys for different environments

❌ DO NOT:
   - Commit to GitHub
   - Share with team via email
   - Log or display in errors
   - Use in development locally
```

---

## Step 4: Update Backend to LIVE Keys

### 4.1 Update Railway Environment Variables

1. Railway Dashboard → Node.js Service → **Variables**

2. Update these two variables:
   ```
   RAZORPAY_KEY_ID=rzp_live_your_live_key_id
   RAZORPAY_KEY_SECRET=your_live_key_secret
   ```

3. Save and **Redeploy** the service

4. Test: `https://your-api.com/api/health`

### 4.2 Verify Live Mode Active

```bash
# Test endpoint to verify keys are loaded
curl https://your-api.com/api/health

# Should show status: ok
```

---

## Step 5: First Live Transactions

### 5.1 Test Live Mode

1. Use **real payment card** (yours or team's test card)
2. Make small test transaction (₹1) to verify
3. Check Razorpay Dashboard → **Payments**
4. Verify payment shows in LIVE mode
5. Check order in your admin dashboard

### 5.2 First Refund Test

1. Razorpay Dashboard → Payment details
2. Click **Refund**
3. Refund ₹1
4. Check refund processed within 5-7 business days

---

## Step 6: Production Alerts

### 6.1 Set Up Payment Alerts

1. Razorpay Dashboard → **Settings** → **Notifications**
2. Enable email notifications for:
   - Failed payments
   - High-value transactions
   - Refunds processed
   - Settlement updates

### 6.2 Monitor Transactions

```
Daily checks:
- Go to Razorpay Payments section
- Verify all transactions legitimate
- Check for any failed payments
- Review refunds/disputes
```

---

## Troubleshooting Live Payments

### ❌ Payment shows in Razorpay but not in your system

```
Possible causes:
1. Webhook not configured
2. Backend not processing payments
3. Database not recording order

Fix:
1. Check backend logs
2. Verify /api/checkout/verify-payment endpoint
3. Check database for order records
```

### ❌ Customer says payment was taken but order not created

```
This can happen due to network issues

Fix:
1. Check Razorpay Dashboard - payment exists?
2. Check your database - order exists?
3. Show customer the Razorpay transaction reference
4. If order missing, create it manually and keep record
```

### ❌ Payment failed with error "Invalid Signature"

```
This means Razorpay is rejecting your signature
(This should NOT happen if keys are correct)

Fix:
1. Verify RAZORPAY_KEY_SECRET is exactly correct
2. No extra spaces or quotes
3. Try refreshing from Razorpay Dashboard
4. Regenerate keys if needed
```

---

## Emergency: Revert to Test Mode

If something goes wrong:

```
1. Update Railway variables back to TEST keys:
   RAZORPAY_KEY_ID=rzp_test_SAY5U3QnFI4oAn
   RAZORPAY_KEY_SECRET=Q3L2oqzl0SL3BexL8XSW86kX

2. Redeploy

3. Notify customers of temporary service update

4. Investigate the issue

5. Re-switch to LIVE keys when ready
```

---

## Razorpay Fee Structure (India)

```
Standard Rates (as of Feb 2026 - verify current rates):

✅ Online Payments:
   - Credit Card: 2% + IST
   - Debit Card: 0.9% + IST (2.99% max per txn)
   - UPI: 1% + IST
   - Netbanking: 1% + IST
   - Wallets: 2% + IST

✅ Settlement:
   - Free (next business day)
   - Or 2-hour instant settlement (small fee)

Example:
   Customer pays: ₹1000
   Razorpay fee (2% + 18% IST): ₹23.60
   You receive: ₹976.40
```

---

## Razorpay Support & Resources

| Resource | Link |
|----------|------|
| **Dashboard** | https://dashboard.razorpay.com |
| **API Docs** | https://razorpay.com/docs |
| **Support** | support@razorpay.com |
| **Status** | https://status.razorpay.com |
| **Test Cards** | https://razorpay.com/docs/payments/payment-gateway/test-card-details |

---

## Switching Timeline

```
Phase 1: TESTING (Current - 2-3 weeks)
├── Use test keys
├── Test with team members
├── Test with test cards
└── Verify order flow

Phase 2: PREPARATION (1-2 weeks before launch)
├── Complete Razorpay KYC
├── Set up banking details
├── Get LIVE keys
└── Update Railway config

Phase 3: LIVE (Go-live day)
├── Switch to LIVE keys
├── First test transactions
├── Monitor closely
├── Customer notifications
└── Scale marketing

Phase 4: MONITORING (Post-launch)
├── Daily checks for 1 week
├── Monitor for chargebacks
├── Set up alerts
└── Regular reconciliation
```

---

## CHECKLIST: Ready for LIVE Keys?

- [ ] All user flows tested with test cards
- [ ] Order creation working
- [ ] Invoices generating
- [ ] Admin dashboard working
- [ ] Refund process tested
- [ ] Team fully trained
- [ ] Customer support ready
- [ ] Razorpay KYC completed
- [ ] Banking details configured
- [ ] Live keys generated
- [ ] Rails environment variables updated
- [ ] Backend redeployed
- [ ] SSL certificate active (https)
- [ ] Domain pointing correctly
- [ ] Monitoring alerts configured

---

## After Going LIVE

```
Daily (First week):
- Check Razorpay dashboard
- Review payments
- Monitor for issues

Weekly:
- Reconcile Razorpay with your records
- Review failed transactions
- Check settlement status

Monthly:
- Audit all transactions
- Verify refunds processed correctly
- Review patterns for fraud
- Optimize conversion rates
```

---

## Final Checklist

When you're 100% ready to switch from TEST to LIVE:

```bash
# 1. Take backup of database
mysqldump ... > production_backup.sql

# 2. Verify backend is accessible
curl https://api.yourdomain.com/api/health

# 3. Update Razorpay keys in Railway
# (See Step 4 above)

# 4. Verify deployment successful
railway logs

# 5. Test single ₹1 payment

# 6. Verify payment in Razorpay Dashboard (LIVE mode)

# 7. Verify order created in database

# 8. Monitor closely for next 24 hours

# 9. Scale marketing 🎉
```

---

**Remember:** Once you switch to LIVE, real money is at stake!  
Test thoroughly, secure your keys, and have backup plans ready.

Good luck! 🚀
