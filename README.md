# COE Project (Assam Shilpa)

E-commerce storefront and admin panel for the Shristi Handicraft and Prerana
Handloom co-operative societies. React + Vite frontend, Node.js + Express +
MySQL backend, Razorpay payments.

## Folder structure

```
coe-project/
├── frontend/               # React (Vite) app
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── api/            # API client & endpoints
│   │   ├── components/
│   │   │   ├── admin/      # Admin panel
│   │   │   └── common/     # SmartImage, ImageLightbox
│   │   ├── context/        # Auth + Cart
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
├── backend/                # Node.js API
│   ├── src/
│   │   ├── config/         # DB pool
│   │   ├── middleware/     # auth, error handling
│   │   ├── routes/         # auth, products, categories, orders, checkout, admin, shipping
│   │   ├── services/       # payments, carriers, uploads, shiprocket, orders
│   │   └── utils/          # jwt, logger, http helpers
│   ├── db/                 # schema.sql, seeds, migrate.js
│   └── public/uploads/     # Admin-uploaded images (local storage fallback)
└── package.json            # Root scripts
```

## Setup

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Environment**
   - Backend: copy `backend/.env.example` → `backend/.env` and fill it in.
     `JWT_SECRET`, `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are required.
   - Frontend: copy `frontend/.env.example` → `frontend/.env`.

3. **Database**
   ```bash
   cd backend
   npm run setup-db     # creates the database, schema and seed data
   npm run migrate      # applies schema migrations (safe to re-run)
   ```

   `npm run migrate` is idempotent — every step checks `information_schema`
   first, so running it repeatedly is harmless. Run it after every deploy.

## Run

| Command                | What it does                |
|------------------------|-----------------------------|
| `npm run dev:frontend` | Frontend dev server (:5173) |
| `npm run dev:backend`  | Backend dev server (:4000)  |
| `npm run dev`          | Frontend only               |
| `npm run build`        | Build frontend to `frontend/dist` |

## Backend scripts

| Command             | What it does                                   |
|---------------------|------------------------------------------------|
| `npm run dev`       | Start with nodemon                             |
| `npm start`         | Start for production                           |
| `npm run setup-db`  | Create database + load schema and seeds        |
| `npm run migrate`   | Apply pending schema migrations (idempotent)   |

## Admin portal

**URL:** `/admin` (e.g. `http://localhost:5173/admin`)

- **Dashboard** — revenue, order counts, low stock, pending shipments, charts.
- **Orders** — search by order number, customer, email or tracking number;
  filter by status; update status; download invoices.
- **Products** — add/edit/delete, stock and visibility, dimensions, and a
  **multi-photo gallery** (upload several images, reorder them, choose the main
  one shown on the product card).
- **Shipping** — either book through ShipRocket, or record a tracking number
  from any other courier by hand. Either way the customer sees the courier,
  the consignment number, and a direct link to that courier's tracking page.

## Payments

Razorpay, with three confirmation paths that all funnel through one routine
(`services/payments.js → markOrderPaid`):

1. Browser confirmation after checkout.
2. Browser confirmation on the "Pay Now" retry for a pending order.
3. The Razorpay **webhook** — the authoritative server-to-server confirmation.

Set `RAZORPAY_WEBHOOK_SECRET` and point Razorpay at
`https://<your-api-domain>/api/checkout/webhook` (events: `payment.captured`,
`order.paid`). Without it, an order is only ever confirmed by the browser, so a
customer who closes the tab immediately after paying leaves a paid order stuck
as `PENDING`.

Stock is deducted only on **confirmed payment**, never at order creation, so
abandoned checkouts cannot drain inventory.

## Image storage

If `CLOUDINARY_*` is configured, uploads go to Cloudinary. Otherwise they are
written to `backend/public/uploads/` and served by the API.

> On an ephemeral host (Railway, Heroku) local files are **lost on every
> redeploy** — configure Cloudinary before going to production.

Note the two separate image paths:
- `/assets/*` — seeded artwork shipped in the frontend's `public/` folder.
- `/uploads/*` — images uploaded through the admin panel, served by the API.

## Deployment checklist

- [ ] `JWT_SECRET` set to a 32+ character random string
      (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `ALLOWED_ORIGINS` set to your real frontend domain
- [ ] `RAZORPAY_WEBHOOK_SECRET` set and the webhook registered
- [ ] `CLOUDINARY_*` configured so uploads survive redeploys
- [ ] `NODE_ENV=production` (enables strict startup checks and hides error internals)
- [ ] `npm run migrate` run against the production database
- [ ] `TRUST_PROXY_HOPS` matches your proxy setup (1 for Railway/Netlify/nginx)
