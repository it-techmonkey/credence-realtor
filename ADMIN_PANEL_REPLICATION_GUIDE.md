# Admin Panel Replication Guide

Use this guide to copy the exact admin panel from this project to another Next.js project. It covers structure, auth, APIs, DB schema, and components.

---

## 1. Stack & Dependencies

- **Framework:** Next.js (Pages Router)
- **DB:** Neon (Postgres) via `@neondatabase/serverless`
- **Auth:** JWT in cookie `admin_token`, bcrypt for passwords
- **UI:** Tailwind CSS, no separate UI library

**NPM packages to add in the other project:**

```json
"@neondatabase/serverless": "^1.0.2",
"bcryptjs": "^3.0.3",
"dotenv": "^17.2.3",
"js-cookie": "^3.0.5",
"jsonwebtoken": "^9.0.3"
```

---

## 2. File & Folder Structure

Copy or recreate these paths relative to the Next.js app root:

```
context/
  AuthContext.js

components/
  AdminHeader.jsx
  ManageDataModal.jsx
  SuccessPopup.jsx

lib/
  auth.js
  db.js

pages/
  _app.js                    # wrap with AuthProvider (see below)
  admin/
    index.jsx                # redirects to /admin/login
    login.jsx
    dashboard.jsx
    enquiries.jsx
    leads.jsx
  api/
    auth/
      login.js
      me.js
    admin/
      stats.js
      leads.js
      enquiries.js
      move-to-leads.js
    migrations/
      init.js                # DB schema (users, leads, general_enquiries, etc.)

addAdmin.js                  # optional: script to create first admin user (root)
```

---

## 3. Environment Variables

In the other project’s `.env.local`:

- `DATABASE_URL` – Neon Postgres connection string (required for DB and admin APIs).
- `JWT_SECRET` – Secret for signing JWTs (required for auth; use a strong value in production).

---

## 4. App Setup (_app.js)

Wrap the app with `AuthProvider` so admin pages can use `useAuth()`:

```js
import { AuthProvider } from "../context/AuthContext";

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <>
      <Head>...</Head>
      <AuthProvider>{getLayout(<Component {...pageProps} />)}</AuthProvider>
    </>
  );
}
```

Admin pages use a custom layout that **does not** wrap with the main site layout:

```js
// On every admin page (dashboard, enquiries, leads, login):
AdminDashboard.getLayout = function getLayout(page) {
  return page;
};
```

So admin routes render without the main `Layout` (no main site header/footer).

---

## 5. Auth Flow

- **Login:** `POST /api/auth/login` with `{ email, password }`. Returns `{ token, user }`. Frontend stores token in cookie `admin_token` (7-day expiry) via `js-cookie`.
- **Session check:** On load, frontend calls `GET /api/auth/me` with `Authorization: Bearer <token>`. If valid and role is ADMIN, user is considered logged in.
- **Protected routes:** Every admin page (dashboard, enquiries, leads) checks `useAuth()`; if `!user` and `!authLoading`, redirect to `/admin/login`.
- **APIs:** All `/api/admin/*` and `/api/auth/me` expect `Authorization: Bearer <token>` and require `decoded.role === 'ADMIN'`.

**AuthContext** exposes: `user`, `loading`, `login(email, password)`, `logout`, `checkAuth`.

---

## 6. Routes Summary

| Route | Purpose |
|-------|--------|
| `/admin` | Redirects to `/admin/login` |
| `/admin/login` | Login form; no layout; redirect to `/admin/dashboard` if already logged in |
| `/admin/dashboard` | Stats cards (total/hot/warm/cold leads), lead table with filters, status/stage modals, ManageDataModal for lead |
| `/admin/enquiries` | Enquiries list, search, pagination, create/edit/delete, “Move to Lead” |
| `/admin/leads` | Leads list, search, status filter, ManageDataModal for lead |

---

## 7. API Reference

All admin APIs require header: `Authorization: Bearer <token>` and valid JWT with `role === 'ADMIN'`. Unauthorized → `401`.

### Auth

- **POST /api/auth/login**  
  Body: `{ email, password }`  
  Returns: `{ token, user }` (user without password).  
  Rejects non-ADMIN users with 403.

- **GET /api/auth/me**  
  Returns: `{ user }`.  
  Used to restore session from cookie.

### Admin

- **GET /api/admin/stats**  
  Returns: `{ stats: { total, hot, warm, lost, enquiries, conversionRate, lostRate }, recentLeads }`  
  Counts from `leads` and `general_enquiries`.

- **GET /api/admin/leads**  
  Query: `page`, `pageSize`, `status` (optional), `search` (optional).  
  Returns: `{ leads[], pagination: { page, pageSize, total, totalPages } }`.

- **PUT /api/admin/leads**  
  Body: `{ id, name?, phone?, email?, project_name?, type?, price?, status?, sales_stage?, job_title?, employer?, property_interests?, notes?, client_folder_link?, nationality?, date_of_birth?, home_address? }`  
  Updates lead by `id`.

- **DELETE /api/admin/leads**  
  Query: `id`.  
  Deletes lead.

- **GET /api/admin/enquiries**  
  Query: `search`, `page`, `pageSize`, `status` (optional).  
  Returns: `{ enquiries[], pagination }`.

- **POST /api/admin/enquiries**  
  Body: same shape as `general_enquiries` (first_name, last_name, email, phone, subject, message, event, job_title, employer, property_interests, notes, client_folder_link, nationality, date_of_birth, home_address).  
  Creates enquiry.

- **PUT /api/admin/enquiries**  
  Body: `{ id, ...fields }`.  
  Updates enquiry.

- **DELETE /api/admin/enquiries**  
  Body: `{ id }`.  
  Deletes enquiry.

- **POST /api/admin/move-to-leads**  
  Body: `{ sourceId, sourceType: 'enquiry'|'client', leadData }`.  
  Creates a lead from an enquiry (or client); `leadData` includes name, email, phone, projectName, price, type, intent, status, salesStage, and profile fields.

---

## 8. Database Schema (Relevant Tables)

Run the migration (e.g. `GET` or `POST` to your migration route that calls `initializeDatabase()`), or apply the following.

### users

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER',
  phone VARCHAR(50),
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Admin users have `role = 'ADMIN'`. Passwords are stored hashed with bcrypt (e.g. 12 rounds).

### general_enquiries

```sql
CREATE TABLE IF NOT EXISTS general_enquiries (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  event VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'HOT',
  job_title VARCHAR(255),
  employer VARCHAR(255),
  property_interests TEXT,
  notes TEXT,
  client_folder_link VARCHAR(500),
  nationality VARCHAR(255),
  date_of_birth DATE,
  home_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### leads

```sql
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  property_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'HOT',
  sales_stage VARCHAR(255) DEFAULT 'New Inquiry',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price FLOAT,
  project_name VARCHAR(255),
  type VARCHAR(100),
  intent VARCHAR(255),
  event VARCHAR(255),
  job_title VARCHAR(255),
  employer VARCHAR(255),
  property_interests TEXT,
  notes TEXT,
  client_folder_link VARCHAR(500),
  nationality VARCHAR(255),
  date_of_birth DATE,
  home_address TEXT
);
```

---

## 9. Auth Helper (lib/auth.js)

- `hashPassword(password)` – bcrypt hash (e.g. 12 rounds).
- `verifyPassword(password, hashedPassword)` – bcrypt compare.
- `generateToken(user)` – JWT with `{ userId, email, role }`, 7d expiry.
- `verifyToken(token)` – returns payload or null.
- `isAdmin(user)` – `user.role === 'ADMIN'`.

Use `JWT_SECRET` from env; fallback only for dev.

---

## 10. Admin API Auth Pattern

Every admin API uses the same pattern:

```js
function checkAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') return null;
  return decoded;
}

export default async function handler(req, res) {
  const user = checkAuth(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  // ... handle GET/POST/PUT/DELETE
}
```

---

## 11. Frontend: Sending the Token

All admin API calls from the frontend send the cookie token in the header:

```js
const token = Cookies.get('admin_token');
const res = await fetch('/api/admin/leads', {
  headers: { Authorization: `Bearer ${token}` },
});
```

Same for `/api/admin/stats`, `/api/admin/enquiries`, `/api/admin/move-to-leads`, etc.

---

## 12. Components Summary

### AdminHeader.jsx

- Logo + “Admin Panel” link to `/admin/dashboard`.
- Nav links: Dashboard, Enquiries.
- Logout button (calls `logout()` and redirects to `/admin/login`).
- Mobile hamburger menu for nav.

Used on dashboard, enquiries, and leads pages (not on login).

### SuccessPopup.jsx

- Props: `message`, `onClose`.
- Fixed bottom-right green toast with checkmark and close button.
- Used after save/delete/move-to-lead success; parent typically auto-hides after 3s.

### ManageDataModal.jsx

- **Props:**  
  `show`, `data` (enquiry or lead object or null), `type` ('enquiry' | 'lead'), `mode` ('create' | 'edit'), `onClose`, `onSave(enquiryIdOrNull, formData)`, `onDelete(id)` (edit only), `onMoveToLeads(enquiryId, { enquiryName, moveData, formDataSnapshot })` (enquiry edit only), `loading`, `salesStages` (for lead type).
- **Form fields:**  
  First/Last name, email, phone, job title, employer, property interests, nationality, DOB, home address, notes, client folder link, event. For leads: status, sales stage, project name, price (with K/M), type, intent.
- **Enquiry edit only:**  
  Expandable “Lead Conversion” section with project, intent, budget, unit type; “Move to Lead” calls `onMoveToLeads` then parent can delete the enquiry.
- **Actions:**  
  Delete (edit), Cancel, Save / Create, and “Move to Lead” when conversion section is open (enquiry).

Copy the full file from `components/ManageDataModal.jsx` (~750 lines) for identical behavior and UI.

---

## 13. Sales Stages (Lead Pipeline)

Used in dashboard and leads (filters and ManageDataModal):

```js
const salesStages = [
  'New Inquiry', 'Contacted', 'Requirements Captured', 'Qualified Lead',
  'Property Shared', 'Shortlisted', 'Site Visit Scheduled', 'Site Visit Done',
  'Negotiation', 'Offer Made', 'Offer Accepted', 'Booking / Reservation',
  'SPA Issued', 'SPA Signed', 'Mortgage Approved',
  'Oqood Registered / Title Deed Issued', 'Deal Closed – Won', 'Deal Lost',
  'Post-Sale Follow-up'
];
```

---

## 14. Creating the First Admin User

Use a script that:

1. Loads `DATABASE_URL` from `.env.local` (e.g. via `dotenv`).
2. Hashes password with bcrypt (12 rounds).
3. Inserts into `users` with `role = 'ADMIN'` (or updates existing user to ADMIN).

Example (from this project’s `addAdmin.js`):

- Config: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`.
- Check if user exists by email; if exists and already ADMIN, exit; else update role or insert.
- Insert: `(email, name, password, role) VALUES (..., 'ADMIN') RETURNING id, email, name, role`.

Run with: `node addAdmin.js` (from project root, with `.env.local` present).

---

## 15. Optional: Link from Main Site to Admin

In the main site footer (or anywhere):

```jsx
<Link href="/admin/login">Admin Login</Link>
```

---

## 16. Checklist for the Other Project

1. Install dependencies: `@neondatabase/serverless`, `bcryptjs`, `dotenv`, `js-cookie`, `jsonwebtoken`.
2. Add `DATABASE_URL` and `JWT_SECRET` to `.env.local`.
3. Copy `lib/db.js`, `lib/auth.js`, `context/AuthContext.js`.
4. Copy `pages/api/auth/login.js`, `pages/api/auth/me.js`.
5. Copy `pages/api/admin/stats.js`, `leads.js`, `enquiries.js`, `move-to-leads.js`.
6. Copy migration/init (e.g. `pages/api/migrations/init.js`) and run it to create tables.
7. Copy `components/AdminHeader.jsx`, `SuccessPopup.jsx`, `ManageDataModal.jsx`.
8. Copy `pages/admin/index.jsx`, `login.jsx`, `dashboard.jsx`, `enquiries.jsx`, `leads.jsx`.
9. Wrap app with `AuthProvider` in `_app.js`; keep admin pages using `getLayout = (page) => page`.
10. Create first admin user (e.g. `addAdmin.js` + `node addAdmin.js`).
11. Ensure Tailwind (and any globals) are set up so admin styles match (teal/gray, etc.).

After this, the other project will have the same admin panel behavior, auth, and data model as this one.
