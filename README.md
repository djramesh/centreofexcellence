# COE Project (Assam Shilpa)

React + Vite frontend + Node.js backend.

## Folder structure

```
coe-project/
├── frontend/          # React (Vite) app
│   ├── public/       # Static assets
│   ├── src/
│   │   ├── api/      # API client & endpoints
│   │   ├── components/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/          # Node.js API
│   ├── src/
│   ├── db/
│   └── package.json
├── package.json      # Root scripts (dev, build, etc.)
└── .env.example
```

## Setup

1. **Install dependencies**
   ```bash
   npm run install:all
   ```
   Or separately:
   ```bash
   cd frontend && npm install
   cd backend && npm install
   ```

2. **Environment**
   - Frontend: copy `frontend/.env.example` to `frontend/.env`
   - Backend: copy `backend/.env.example` to `backend/.env`

## Run

- **Frontend (from project root):**
  ```bash
  npm run dev:frontend
  ```
  Or: `cd frontend && npm run dev`

- **Backend:**
  ```bash
  npm run dev:backend
  ```
  Or: `cd backend && npm run dev`

- **Default `npm run dev`** starts the frontend.

## Admin portal

- **URL:** `/admin` (e.g. `http://localhost:5173/admin`)
- **Login:** `admin@coe.com` / `admin123` (create admin via seed; change after first login)
- **Features:** Dashboard (stats, pie/bar/area charts), Orders (list, filter, detail, status update), Products (add, edit, delete, stock, active/inactive), low-stock alerts, revenue by month, orders by status.

**First-time admin:** Run the DB seed so the admin user exists:
```bash
cd backend
# Run schema + seed (e.g. mysql -u root -p coe_ecommerce < db/schema.sql; mysql -u root -p coe_ecommerce < db/seed.sql)
```

## Build

```bash
npm run build
```
Builds the frontend into `frontend/dist`.

## Scripts (root)

| Script           | Description                    |
|------------------|--------------------------------|
| `dev`            | Start frontend dev server      |
| `dev:frontend`   | Start frontend dev server      |
| `dev:backend`    | Start backend dev server       |
| `build`          | Build frontend for production  |
| `install:all`    | Install deps in root, frontend, backend |
