# Kere — Custom Clothing Marketplace

**Source of Truth Document. Read this before touching any code.**

Kere connects customers with local Georgian tailors for bespoke clothing. Customers browse a marketplace, customize products, or design garments from scratch using an interactive tool. Tailors receive orders, manage them through a dashboard, and update statuses that feed back to customers via an in-app notification system.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [File Map](#2-file-map)
3. [Database Schema](#3-database-schema)
4. [API Reference](#4-api-reference)
5. [User Roles & Flows](#5-user-roles--flows)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Deployment](#7-deployment)
8. [Design System Rules](#8-design-system-rules)
9. [Project Evolution & Logic Log](#9-project-evolution--logic-log)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Laravel | ^12.0 |
| PHP | PHP | ^8.2 |
| Frontend Framework | React | ^19.0.0 |
| Routing (frontend) | React Router | ^7.14.0 |
| Language | TypeScript | ^5.7 |
| Styling | Tailwind CSS | ^4.0.0 |
| Animations | Motion (Framer Motion) | ^12.38.0 |
| Icons | Lucide React | ^0.475.0 |
| UI Primitives | Radix UI | Various |
| Build Tool | Vite | ^6.0 |
| Database | SQLite (dev) / configurable | — |
| Deployment | Railway via Nixpacks | — |
| Currency | Georgian Lari (₾) | — |

**Critical import rules:**
- React Router: `import { ... } from 'react-router'` — NOT `react-router-dom`
- Motion: `import { motion } from 'motion/react'` — NOT `framer-motion`

---

## 2. File Map

### Backend

```
app/
├── Http/Controllers/Api/
│   ├── AuthController.php          # Register, login, token issuance; sets approval_status for tailors
│   ├── OrderController.php         # Order creation, tailor order mgmt, status updates
│   ├── CustomerOrderController.php # Customer fetches own orders
│   ├── NotificationController.php  # Fetch, mark-read, mark-all-read
│   ├── UploadController.php        # Product image uploads
│   ├── AdminController.php         # Admin orders, users, tailor approval (pendingTailors/approveTailor/rejectTailor)
│   ├── MessageController.php       # Order-scoped chat: index, store, counts
│   ├── TailorController.php        # Tailor public profiles + updateProfile (with approval guard)
│   ├── ReviewController.php        # Product reviews + landing carousel
│   └── SupportEmailController.php  # FAQ email support form
├── Mail/
│   ├── OrderConfirmation.php
│   ├── NewOrderAlert.php
│   ├── OrderStatusUpdated.php
│   ├── TailorApproved.php          # Sent when admin approves a tailor
│   └── TailorRejected.php          # Sent when admin rejects a tailor (with optional reason)
├── Models/
│   ├── User.php                    # Customer & Tailor unified model (role + approval_status fields)
│   ├── Product.php                 # Marketplace products, tailor-owned
│   ├── Order.php                   # Both marketplace & custom orders
│   ├── OrderItem.php               # Line items inside an Order
│   ├── CartItem.php                # Persisted cart items per user
│   ├── Category.php                # Product categories
│   ├── Message.php                 # Order-scoped chat messages
│   └── KereNotification.php        # In-app notifications

database/migrations/
│   # Core tables
├── 0001_01_01_000000_create_users_table.php
├── 2026_04_05_131701_create_categories_table.php
├── 2026_04_05_131702_create_products_table.php
├── 2026_04_05_131702_create_orders_table.php
├── 2026_04_05_131703_create_order_items_table.php
├── 2026_04_05_131702_create_cart_items_table.php
│   # Extensions
├── 2026_04_05_193614_add_role_and_profile_to_users_table.php
├── 2026_04_06_000001_extend_orders_for_kere.php      # order_type, tailor_id, custom_design_data
├── 2026_04_06_000002_add_tailor_id_to_products.php
├── 2026_04_06_000003_add_specs_to_products.php       # fabric, texture, required_measurements
└── 2026_04_06_000004_create_notifications_table.php

routes/
├── api.php                         # All API routes (public + auth-gated)
└── web.php                         # Catch-all → serves React SPA
```

### Frontend

```
resources/js/
├── App.tsx                         # Root: wraps RouterProvider in CartProvider
├── routes.tsx                      # createBrowserRouter — single source of route truth
│
├── pages/
│   ├── Landing.tsx                 # / — marketing homepage
│   ├── Marketplace.tsx             # /marketplace — product grid + search/filter
│   ├── ProductCustomization.tsx    # /product/:id — product detail + customization form
│   ├── DesignerApp.tsx             # /design — 5-step custom garment design tool
│   ├── CartPage.tsx                # /cart — checkout page, places orders via API
│   ├── CustomerDashboard.tsx       # /customer-dashboard — order history + notifications
│   ├── TailorDashboard.tsx         # /tailor-dashboard — order & product management
│   ├── RoleSelection.tsx           # /signin — picks customer or tailor before login
│   ├── Login.tsx                   # /login/:role — role-specific login form
│   ├── RegisterCustomer.tsx        # /register/customer
│   ├── RegisterTailor.tsx          # /register/tailor
│   └── NotFound.tsx                # * — 404 page
│
├── components/
│   ├── NotificationBell.tsx        # Header dropdown — polls /api/notifications every 30s
│   ├── CartDrawer.tsx              # Slide-out cart sidebar — global, triggered by CartContext
│   ├── FinalPreview.tsx            # Final design review before submitting custom order
│   ├── CustomizationPanel.tsx      # Product option selectors (color, size, measurements)
│   ├── DesignCanvas.tsx            # Visual canvas for custom design tool
│   ├── ClothingTypeSelector.tsx    # Step 1 of design flow
│   ├── SubcategorySelector.tsx     # Step 2 of design flow
│   ├── landing/                    # All landing page section components
│   │   ├── Navigation.tsx          # Sticky header with auth-aware cart/notification icons
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── ProcessSection.tsx
│   │   ├── CategoriesSection.tsx
│   │   ├── GuaranteeSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── CTASection.tsx
│   ├── tailor/                     # Tailor dashboard subcomponents
│   │   ├── DashboardHeader.tsx
│   │   ├── StatsCards.tsx
│   │   ├── OrdersList.tsx
│   │   ├── ProductManager.tsx
│   │   └── AddProductModal.tsx
│   └── ui/                         # Radix UI / Shadcn primitives
│       ├── button.tsx              # Button with variant/size props — use exclusively
│       ├── card.tsx, dialog.tsx, input.tsx, select.tsx, sheet.tsx, ...
│
├── context/
│   └── CartContext.tsx             # Global cart state + drawer open/close
│
├── hooks/
│   ├── useAuth.ts                  # Token storage, AuthUser interface (incl. approval_status), sign out
│   ├── useCustomizer.ts            # Customizer state: selections, fabric, price
│   ├── useProductData.ts           # Fetch + shape customizer product data
│   └── useCustomOrderDraft.ts      # sessionStorage draft for custom order flow
└── locales/
    ├── en.json                     # English translations (fallback)
    └── ka.json                     # Georgian translations (default)
```

---

## 3. Database Schema

### Relationships Overview

```
users ──< orders (as customer via user_id)
users ──< orders (as tailor via tailor_id)
users ──< products (as tailor via tailor_id)
users ──< cart_items
users ──< kere_notifications

categories ──< products
products ──< order_items
orders ──< order_items
```

### `users`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | string | Full name (legacy) |
| first_name | string nullable | |
| last_name | string nullable | |
| email | string unique | |
| password | string | bcrypt hashed |
| phone | string nullable | |
| role | enum | `'customer'` \| `'tailor'` — default: `'customer'` |
| approval_status | enum nullable | `'pending'` \| `'approved'` \| `'rejected'` — set to `'pending'` on tailor registration, `null` for customers |
| api_token | string unique nullable | SHA256 hash of raw token |
| remember_token | string nullable | |
| email_verified_at | timestamp nullable | |

### `categories`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| name | string | |
| slug | string unique | |
| description | text nullable | |
| image | string nullable | |

### `products`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| category_id | FK → categories | |
| tailor_id | FK → users nullable | Owning tailor |
| name | string | |
| slug | string unique | |
| description | text nullable | |
| price | decimal(10,2) | In Georgian Lari (₾) |
| colors | JSON | Array of color strings |
| sizes | JSON | Array of size strings |
| images | JSON | Array of image URLs |
| is_customizable | boolean | default: true |
| is_featured | boolean | default: false |
| stock | integer | default: 100 |
| fabric | string nullable | e.g. "cotton", "silk" |
| texture | string nullable | |
| required_measurements | JSON nullable | e.g. `["chest","waist","hips"]` |

### `orders`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → users | Ordering customer |
| tailor_id | FK → users nullable | Assigned tailor (auto-assigned) |
| order_number | string unique | e.g. `ORD-1712345678` |
| order_type | enum | `'marketplace'` \| `'custom'` |
| status | enum | `'pending'` → `'processing'` → `'shipped'` → `'delivered'` \| `'cancelled'` |
| subtotal | decimal(10,2) | |
| shipping | decimal(10,2) | Flat ₾15 |
| total | decimal(10,2) | |
| custom_design_data | JSON nullable | Full design spec for custom orders |
| first_name, last_name | string | Customer shipping info |
| email, phone | string | |
| address, city, state, zip, country | string | |
| notes | text nullable | |

### `order_items`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| order_id | FK → orders | |
| product_id | FK → products | |
| product_name | string | Snapshot at time of order |
| color | string nullable | |
| size | string nullable | |
| quantity | integer | |
| price | decimal(10,2) | Price per unit at order time |
| custom_design | JSON nullable | |
| cm_measurements | JSON nullable | e.g. `{"chest":"100","waist":"80","hips":"95","length":"120"}` |

### `cart_items`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → users | |
| product_id | FK → products | |
| color | string nullable | |
| size | string nullable | |
| quantity | integer | default: 1 |
| custom_design | JSON nullable | |

### `kere_notifications`

| Column | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → users | Recipient |
| type | string | `'new_order'` \| `'order_status'` |
| title | string | Display title |
| body | string | Display body text |
| data | JSON nullable | `{order_id, product_name, clothing_type, status}` |
| is_read | boolean | default: false |

---

## 4. API Reference

Base URL: `/api`  
Auth: `Authorization: Bearer {raw_token}` (backend hashes with SHA256 for lookup)

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register new user. Body: `{name, email, password, role}`. Returns `{token, user}` |
| POST | `/login` | Login. Body: `{email, password}`. Returns `{token, user}` |
| GET | `/products` | List products. Query: `?search=&category=&min_price=&max_price=` |
| GET | `/products/{id}` | Single product detail |
| GET | `/categories` | All categories |

### Authenticated Endpoints

**Orders**

| Method | Path | Who | Description |
|---|---|---|---|
| POST | `/orders` | Customer | Create order. Body varies by `order_type` (see flows below) |
| GET | `/customer/orders` | Customer | List own orders with items and tailor info |
| GET | `/tailor/orders` | Tailor | List orders assigned to this tailor |
| PATCH | `/tailor/orders/{id}/status` | Tailor | Update order status. Body: `{status}` |

**Notifications**

| Method | Path | Description |
|---|---|---|
| GET | `/notifications` | Fetch up to 50 most recent notifications + unread_count |
| POST | `/notifications/read-all` | Mark all notifications as read |
| PATCH | `/notifications/{id}/read` | Mark single notification as read |

**Tailor Products**

| Method | Path | Description |
|---|---|---|
| GET | `/tailor/products` | List tailor's own products |
| POST | `/tailor/products` | Create new product listing |

**Upload**

| Method | Path | Description |
|---|---|---|
| POST | `/upload/image` | Upload image, returns URL |

**Chat (order-scoped messages)**

| Method | Path | Who | Description |
|---|---|---|---|
| GET | `/orders/{orderId}/messages` | Customer or Tailor on that order | Fetch all messages for an order, oldest first |
| POST | `/orders/{orderId}/messages` | Customer or Tailor on that order | Send a message. Body: `{message}`. Notifies the other party via KereNotification |
| GET | `/messages/counts` | Any auth | Returns per-order message count from the other party (used for unread badges) |

**Admin — Tailor Approval**

| Method | Path | Description |
|---|---|---|
| GET | `/admin/tailors/pending` | List all tailors with `approval_status = pending` |
| POST | `/admin/tailors/{id}/approve` | Set `approval_status = approved`, send `TailorApproved` email, create in-app notification |
| POST | `/admin/tailors/{id}/reject` | Set `approval_status = rejected`, send `TailorRejected` email. Body: `{reason?}` |

---

## 5. User Roles & Flows

### Role: Customer

**Registration/Login path:** `/signin` → `/register/customer` or `/login/customer`

**Primary flows:**

**A. Marketplace Order**
1. Browse `/marketplace` → product grid with search/filter
2. Click product → `/product/:id` → select color, size, qty, measurements
3. Add to cart (CartDrawer slides open) or "Buy Now"
4. `/cart` → review cart, click "Place Order"
5. `POST /api/orders` (one per cart item) with `order_type: 'marketplace'`
6. Backend: creates Order + OrderItem, auto-assigns tailor, notifies tailor (`new_order`)
7. Redirect to `/customer-dashboard`

**B. Custom Design Order**
1. `/design` → 5-step garment builder (type → subcategory → specs → colors → measurements)
2. FinalPreview → review full design spec
3. "Submit to Tailor" → `POST /api/orders` with `order_type: 'custom'` and full `custom_design_data`
4. Backend: creates Order, stores design JSON, auto-assigns tailor, notifies tailor
5. Redirect home

**C. Auth Interruption Handling**
- If customer tries to place order while logged out, `useAuth.savePendingOrder()` freezes the form state in localStorage
- After login, `useAuth.getPendingOrder()` restores state and resumes where they left off
- Implemented in `ProductCustomization.tsx` and `FinalPreview.tsx`

**Dashboard (`/customer-dashboard`):**
- Order history with status badges
- Modal detail: custom orders show full design spec; marketplace orders show product images + measurements
- NotificationBell polled every 30s

### Role: Tailor

**Registration/Login path:** `/signin` → `/register/tailor` or `/login/tailor`

**Approval gate:** New tailor registrations are set to `approval_status = 'pending'`. After registration, the tailor sees a "pending review" screen — they cannot access the dashboard. Admin must approve via the "pending tailors" tab in AdminDashboard. On approval/rejection the tailor receives an email and an in-app notification. The dashboard renders a gate screen for `pending` or `rejected` status — only `approved` (or `null`, for legacy accounts) reaches the real dashboard.

**Primary flows:**

**A. Order Management**
1. `/tailor-dashboard` → orders list from `GET /api/tailor/orders`
2. View order detail modal (customer info, items, custom design data if applicable)
3. Update status → `PATCH /api/tailor/orders/{id}/status`
4. Backend creates `order_status` notification for customer

**B. Product Management**
1. `/tailor-dashboard` → Products tab → `GET /api/tailor/products`
2. "Add Product" modal → `POST /api/tailor/products`
3. Upload images via `POST /api/upload/image`

### Authentication Internals

- Tokens: 60-char random string, stored raw in localStorage, stored SHA256-hashed in `users.api_token`
- Backend lookup: `User::where('api_token', hash('sha256', $rawToken))->first()`
- `useAuth` hook centralizes all localStorage key access (prevents key drift)
- Role guard: API endpoints check `$user->role !== 'tailor'` and return 403 if violated

---

## 6. Frontend Architecture

### State Management

| Concern | Mechanism | Persistence |
|---|---|---|
| Cart items | `CartContext` (React Context) | `localStorage` key: `kere_cart` |
| Auth token | `useAuth` hook | `localStorage` |
| User profile | `useAuth` hook | `localStorage` |
| Pending order (pre-login) | `useAuth.savePendingOrder()` | `localStorage` |
| Notifications | Local state in `NotificationBell` | Server (polled) |

### CartContext Interface

```ts
// Item shape stored in cart
interface CartItem {
  id: string;                // unique key for dedup
  type: 'marketplace' | 'custom';
  productId?: number;
  productName: string;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;             // per-unit, in ₾
  measurements?: Record<string, string>;
  customDesign?: object;     // full design spec for custom items
}

// Context provides:
addItem(item: CartItem): void
removeItem(id: string): void
updateQty(id: string, qty: number): void
clear(): void
total: number              // sum of price × qty
count: number              // sum of quantities
isOpen: boolean            // drawer open/close state
openCart(): void
closeCart(): void
```

### Route Table

| Path | Component | Auth Required | Role |
|---|---|---|---|
| `/` | Landing | No | Any |
| `/marketplace` | Marketplace | No | Any |
| `/product/:id` | ProductCustomization | No (order requires auth) | Any |
| `/design` | DesignerApp | No (submit requires auth) | Any |
| `/cart` | CartPage | Yes | Customer |
| `/customer-dashboard` | CustomerDashboard | Yes | Customer |
| `/tailor-dashboard` | TailorDashboard | Yes | Tailor |
| `/signin` | RoleSelection | No | Any |
| `/login/:role` | Login | No | Any |
| `/register/customer` | RegisterCustomer | No | Any |
| `/register/tailor` | RegisterTailor | No | Any |

### Key Component Responsibilities

**`NotificationBell.tsx`**
- Polls `GET /api/notifications` every 30 seconds
- Dropdown shows up to 50 notifications, unread count badge
- `new_order` type → scissors icon; others → package icon
- Opening dropdown auto-marks displayed notifications as read
- Only renders when authenticated

**`CartDrawer.tsx`**
- Fixed right-side slide-out, controlled by `CartContext.isOpen`
- Qty increment/decrement, remove button per item
- "Proceed to Checkout" → navigate to `/cart`
- Empty state with marketplace link

**`FinalPreview.tsx`** (custom design review)
- Color palette swatches (Base, Light, Dark, Accent)
- Design spec sheet: garment type, length, sleeves, neckline, fabric, texture, measurements
- "Submit to Tailor" → `POST /api/orders` or redirect to `/signin` if not authed
- "Download Design Specs" → generates `.txt` file download

---

## 7. Deployment

### External Services

| Service | Purpose | Account |
|---|---|---|
| **Railway** | App hosting — runs PHP server, PostgreSQL database, background queue worker | railway.com |
| **Cloudflare** | DNS management + proxy for `kereforyou.com` — connects domain to Railway, provides CDN and DDoS protection | cloudflare.com |
| **Resend** | Transactional email — sends OTP verification codes via HTTP API (not SMTP, which Railway blocks). Domain `kereforyou.com` is verified on Resend. | resend.com |

**Why Resend over Gmail SMTP:** Railway blocks all outbound SMTP ports (465 and 587). Resend uses HTTP (port 443) which is never blocked. The native `resend/resend-laravel` package is installed — set `MAIL_MAILER=resend` and `RESEND_API_KEY`.

**Domain setup:** `kereforyou.com` is registered on Cloudflare Registrar. DNS is managed in Cloudflare. Railway is connected via CNAME auto-configured through Railway's Cloudflare integration. Resend domain verification DNS records are also in Cloudflare.

### Railway via Nixpacks

**Files involved:**
- `nixpacks.toml` — PHP 8.3, Node.js 20, required extensions
- `Procfile` — `web: bash start.sh`
- `start.sh` — Clears config cache, runs migrations, starts server

**Required PHP extensions:** `pdo`, `pdo_pgsql`, `pgsql`, `mbstring`, `tokenizer`, `xml`, `ctype`, `fileinfo`, `openssl`, `curl`

**Build phases:**
1. `composer install --no-dev --optimize-autoloader`
2. `npm ci && npm run build`
3. `php artisan config:clear && php artisan migrate --force`

**Key env vars for Railway:**

| Variable | Purpose |
|---|---|
| `APP_KEY` | Laravel encryption key (required) |
| `APP_ENV` | Set to `production` |
| `APP_URL` | `https://kereforyou.com` |
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Railway Postgres addon) |
| `TRUSTED_PROXIES` | `*` — Railway terminates HTTPS at proxy layer |
| `MAIL_MAILER` | `resend` |
| `RESEND_API_KEY` | `re_MsfQBBRQ_4dwmJE3uDgnvXEEJ2p8S2HkU` |
| `MAIL_FROM_ADDRESS` | `noreply@kereforyou.com` |
| `MAIL_FROM_NAME` | `Kere` |
| `ADMIN_PASSWORD` | Admin panel password (synced on every deploy) |

**HTTPS Note:** Railway terminates SSL at the load balancer. The app must trust all proxies (`TRUSTED_PROXIES=*`) to correctly detect HTTPS and generate correct URLs.

---

## 8. Design System Rules

**These rules are non-negotiable. Do not deviate without explicit user instruction.**

### Colors
Slate palette: `slate-900 / 700 / 600 / 500 / 400 / 200 / 100 / 50`
Brand accent: wine/oxblood — `--color-brand: oklch(0.42 0.13 25)` → Tailwind: `bg-brand` / `text-brand` / `border-brand`
Brand hover: `--color-brand-dark: oklch(0.36 0.11 25)` → Tailwind: `bg-brand-dark`
`--primary` is aliased to `--color-brand` so `<Button variant="default">` auto-uses wine color.

**Use `bg-brand` for:** CTAs, active tab indicators, progress bars, icon accent circles, notification count badge, unread stripe.
**Keep `bg-slate-900` for:** large dark panels (OnboardingPanel, pricing summaries), image overlays, informational badges, navbar.
Never use: blue, purple, indigo, or any other color family.

### Typography
- Serif font: `Newsreader` (Google Fonts, loaded in `app.blade.php`) — CSS var: `--font-serif`
- All landing page `h2` headings: `font-serif font-semibold tracking-tight`
- Hero `h1`: `font-serif font-semibold` with scale-in animation
- Body text: Instrument Sans (also loaded in `app.blade.php`)

### Buttons
- Corner radius: `rounded-lg` (not `rounded-full`)
- Always use `<Button variant="default|outline|ghost|destructive" size="sm|default|lg">` from `components/ui/button.tsx`
- Never write custom button classes

### Class Patterns

```
Card:      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
Container: className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
Section:   className="py-16 md:py-24"
Grid:      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```


### Animations (5 patterns only)

```ts
// 1. Fade in from bottom (most common)
initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}

// 2. Fade in only
initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}

// 3. Scale in
initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}

// 4. Stagger children
variants with staggerChildren: 0.1

// 5. Hover scale
whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}
```

Duration: only `0.5` or `0.6`. Delays: increments of `0.1` or `0.2`. No spring or bounce.

### Logo (all pages)

```tsx
<Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">Kere</Link>
```

---

## 9. Project Evolution & Logic Log

All features and fixes are logged here in reverse chronological order.

---

### [2026-06-27] Tailor Approval Flow

**What was done:** New tailors cannot access the platform until manually approved by an admin.

**Registration:** `AuthController::register()` sets `approval_status = 'pending'` for all tailor registrations. After successful registration, `RegisterTailor.tsx` shows an in-page "Application Submitted" screen (no navigation to dashboard). `useAuth.ts` `AuthUser` interface includes `approval_status`.

**Dashboard gate:** `TailorDashboard.tsx` checks `user.approval_status` before rendering. `pending` → shows a "Under Review" screen. `rejected` → shows a "Not Approved" screen. `approved` (or `null` for legacy accounts) → normal dashboard.

**Admin UI:** `AdminDashboard.tsx` has a new "pending tailors" tab with a brand-colored count badge. Each pending tailor row has Approve and Reject buttons. Reject opens an optional reason textarea — the reason is included in the rejection email.

**Backend guards:** `TailorController::updateProfile()`, `OrderController::tailorOrders()`, and `OrderController::updateStatus()` all return `403 {code: 'pending_approval'}` if the tailor is not approved.

**Emails:** `TailorApproved` and `TailorRejected` mailables with blade views. Sent synchronously via `Mail::send()`. On approval, an in-app `KereNotification` is also created (`type: 'account_approved'`).

**Migration:** `database/migrations/2026_06_27_000001_add_approval_status_to_users_table.php`

**Where the logic is:**
- `app/Http/Controllers/Api/AdminController.php` — `pendingTailors()`, `approveTailor()`, `rejectTailor()`
- `app/Http/Controllers/Api/AuthController.php` — sets `approval_status` on register
- `app/Http/Controllers/Api/TailorController.php` — approval guard in `updateProfile`
- `app/Http/Controllers/Api/OrderController.php` — approval guard in `tailorOrders`, `updateStatus`
- `app/Mail/TailorApproved.php`, `app/Mail/TailorRejected.php`
- `resources/views/emails/tailor-approved.blade.php`, `tailor-rejected.blade.php`
- `resources/js/pages/RegisterTailor.tsx` — pending screen after registration
- `resources/js/pages/TailorDashboard.tsx` — approval gate
- `resources/js/pages/AdminDashboard.tsx` — pending tailors tab

---

### [2026-06-27] Brand Design System Overhaul

**What was done:** Replaced the all-slate visual identity with a wine/oxblood brand accent and Newsreader editorial serif typeface across the entire platform.

**Brand color:** `--color-brand: oklch(0.42 0.13 25)` (wine/oxblood), `--color-brand-dark: oklch(0.36 0.11 25)` (hover). Both defined in `resources/css/app.css` `@theme` block. `--primary` aliased to `--color-brand` so `<Button variant="default">` auto-applies the brand color.

**Typography:** Newsreader serif loaded via Google Fonts in `app.blade.php`. `--font-serif: 'Newsreader', Georgia, serif` in `@theme`. All landing `h2` headings use `font-serif font-semibold tracking-tight`. Hero `h1` uses a scale-in animation (`initial={{ opacity: 0, scale: 0.95 }}`) distinct from all other sections.

**Buttons:** Corner radius changed from `rounded-full` to `rounded-lg` sitewide.

**Notification bell:** Replaced dot with a count badge (`bg-brand`). Unread items get a 3px left border stripe (`bg-brand`). Fully i18n'd `formatTime`.

**Components updated:** Navigation.tsx, HeroSection.tsx, FeaturesSection.tsx, ProcessSection.tsx, CTASection.tsx, SizeFitSection.tsx, LocalTailorsSection.tsx, GuaranteeSection.tsx, FAQSection.tsx, NotificationBell.tsx, OrdersList.tsx (modal tab indicator), SetupChecklist.tsx (progress bar, icons, links).

---

### [2026-06-27] Live Chat Between Customers and Tailors

**What was done:** Order-scoped real-time-style messaging between customer and tailor, accessible from within the order detail modal on both dashboards.

**How it works:** Each order has a message thread. Either party (customer or tailor on that order) can send messages. Sending a message creates a `KereNotification` for the other party (`type: 'new_message'`). `GET /api/messages/counts` returns per-order message counts from the other party, used to render unread badges on order rows.

**Where the logic is:**
- `app/Http/Controllers/Api/MessageController.php` — `index`, `store`, `counts`
- `app/Models/Message.php`
- Routes: `GET/POST /api/orders/{orderId}/messages`, `GET /api/messages/counts` (all in `auth.bearer` middleware group)
- Frontend: chat UI wired into the order detail modal in `OrdersList.tsx` (tailor) and `CustomerDashboard.tsx` (customer)

---

### [2026-06-27] Layer-Based Customizer — Mobile Layout + i18n

**What was done:** Fixed `Customizer.tsx` for mobile viewports. Added full i18n to all customizer strings.

**Mobile sticky bar:** On `< lg` viewports a fixed bottom bar shows the running total, a Reset button, a Save Design button, and an Order button. Desktop CTAs remain in the sidebar. `pb-24 lg:pb-0` prevents content from hiding behind the bar.

**i18n:** `useTranslation` added to `Customizer.tsx`. All hardcoded strings (Total, Reset, Save Design, Order — ₾X, aria-labels) moved to `customizer.*` keys in `en.json` / `ka.json`. Desktop CTAs also converted for consistency.

**DesignerApp back-button fix:** When entering `/design?upload=1`, the back button on `UploadTypeStep` now calls `navigate(-1)` instead of going to `CategoryStep` (which the user never visited).

---

### [2026-06-27] i18n — Legal Pages (Privacy, Terms, Refund Policy)

**What was done:** Replaced placeholder text in `privacy`, `terms`, and `refund` sections of `en.json` and `ka.json` with proper Georgian-market legal content. `lastUpdated` set to June 2026.

---

### [2026-06-07] Production Email + Custom Domain Setup

**What was done:** Fixed email OTP delivery on Railway deployment. Purchased and connected `kereforyou.com` domain.

**Problem:** Railway blocks all outbound SMTP ports (465 and 587). Gmail and Resend SMTP both timed out. Silent catch block in `AuthController::registerInitiate()` was swallowing the exception and returning "code sent" even when email failed.

**Fix:** Installed `resend/resend-laravel` package which uses Resend's HTTP API (port 443, never blocked). Set `MAIL_MAILER=resend` and `RESEND_API_KEY` in Railway env vars.

**Domain:** `kereforyou.com` registered on Cloudflare Registrar. Connected to Railway via one-click Cloudflare DNS integration. Domain verified on Resend — `MAIL_FROM_ADDRESS=noreply@kereforyou.com`.

**Where the logic is:**
- `composer.json` / `composer.lock` — `resend/resend-laravel` package
- `config/mail.php` — `resend` mailer already defined (Laravel built-in)
- Railway env vars: `MAIL_MAILER=resend`, `RESEND_API_KEY`, `MAIL_FROM_ADDRESS=noreply@kereforyou.com`
- Cloudflare: DNS for `kereforyou.com` (CNAME → Railway, plus Resend DKIM/SPF/DMARC records)

**The Hook:** Resend free tier (3,000 emails/month) is sufficient for MVP. If volume grows, upgrade Resend plan. Do NOT switch back to SMTP — Railway permanently blocks those ports.

---

### [2026-06-03] Custom Order Flow — End-to-End

**What was done:** Implemented the full custom order flow from three entry points (Landing, Marketplace, /design) through tailor selection and order review to submission.

**New routes:** `/design/tailor-select` (TailorSelectStep.tsx), `/design/review` (OrderReview.tsx).

**Draft persistence:** `useCustomOrderDraft.ts` — sessionStorage-backed draft object survives page refresh and the auth gate redirect. Shape: `{ garment_type, customization, design_file_url, tailor_notes, tailor_id, assignment_mode, estimated_price }`.

**Upload path:** DesignerApp.tsx now has a two-tab toggle — "Use the designer" (existing product grid) and "Upload my own design" (file input, preview, notes). File upload hits `POST /api/uploads` (UploadController::design), returns `file_url`.

**Designer path:** CustomizePage.tsx `handleOrder` now saves the customization config to the draft and navigates to `/design/tailor-select` instead of the broken `/checkout/customizer` route.

**Tailor selection:** "Let Kere Choose" card + tailor grid. Grid dims when auto-match is selected. Unavailable tailors shown at reduced opacity with "Currently Busy" badge, not selectable. If no available tailors for the garment type, only "Let Kere Choose" is shown with an explanation.

**Random assignment (server-side):** `OrderController::matchTailorForGarment()` finds the least-busy available tailor whose specialty matches the garment type (LIKE match + fallback to specialty-null tailors). If none found, order is created with `status = pending_assignment`, `tailor_id = null`. Admin receives a KereNotification.

**Tailor availability check at submit:** If a manually chosen tailor's `is_available` flipped to false between selection and submit, the endpoint returns 409 and the frontend sends the user back to `/design/tailor-select` with an error message.

**Admin unassigned queue:** AdminDashboard has a new "Unassigned" tab showing `status = pending_assignment` orders. Assigning a tailor from the dropdown sets `status → pending` and notifies the customer. Tab shows a count badge when orders are waiting.

**DB migrations:**
- `2026_06_03_000001_extend_orders_custom_flow.php` — adds `tailor_assignment_mode` to orders, adds `pending_assignment` to status enum.
- `2026_06_03_000002_add_tailor_availability_fields.php` — adds `is_available` (bool, default true) and `turnaround_days` (varchar, nullable) to users.

**API changes:**
- `POST /api/uploads` — any authenticated user, accepts jpg/png/pdf/svg ≤10MB, returns `{ file_url }`.
- `GET /api/tailors` — now also accepts `?garment_type=` param (alias for `?category=`). Returns `is_available`, `turnaround_days`, `starting_price` in every tailor object.
- `POST /api/orders` — extended to accept `tailor_assignment_mode: 'manual'|'random'` and the new `custom_design_data` fields (`garment_type`, `design_file_url`, `tailor_notes`, `customization`). Old `clothingType` field still supported for backward compatibility.

**Entry points:**
- Landing HeroSection: "Design Your Own" renamed to "Start Your Design".
- Marketplace: dark banner above the product grid linking to `/design`.
- /design: already the flow entry point.

---

### [2026-04-10] Verified Review & Rating System

**What was done:** Implemented a full review system. Customers can leave one review per finished order from their dashboard. Reviews are linked to the order and optionally to a product. The product page shows reviews with an average star rating. The landing page carousel fetches real 5-star reviews and falls back to static testimonials when the database is empty.

**Verified Purchase logic:** A review can only be submitted when `order.status === 'finished'`. The `reviews` table enforces a unique constraint on `order_id` (one review per order). The `has_review` field is returned with every customer order to drive UI state without a separate request.

**Average rating calculation:** Computed server-side as `AVG(rating)` over all reviews for a given `product_id`, rounded to 1 decimal place. Returned alongside the review list from `GET /api/products/{id}/reviews`.

**Where the logic is:**
- Migration: `database/migrations/2026_04_10_000005_create_reviews_table.php`
- Model: `app/Models/Review.php`
- Controller: `app/Http/Controllers/Api/ReviewController.php`
  - `POST /api/reviews` — submit review (auth + finished order + not already reviewed)
  - `GET /api/products/{id}/reviews` — public product reviews + average rating
  - `GET /api/reviews/landing` — latest 5-star reviews for carousel
- Frontend modal: `resources/js/components/ReviewModal.tsx`
- Dashboard: `resources/js/pages/CustomerDashboard.tsx` — "★ Review" button on finished orders
- Product page: `resources/js/pages/ProductCustomization.tsx` — reviews section below product
- Landing carousel: `resources/js/components/landing/GuaranteeSection.tsx` — live data with static fallback

---

### [2026-04-10] Interactive Measurement Guide

**What was done:** Implemented a full interactive measurement guide system. "View Measurement Guide" button on the landing page now opens a step-by-step modal. Measurement input fields in DesignerApp and ProductCustomization have a `?` help icon that opens the modal at the relevant step. All inputs validate against sanity-check ranges and show a gentle amber warning for physically impossible values.

**Measurement standard:** All values are **centimetres (cm)**. Standard size chart (XS–XL) included in the modal's "Size Chart" tab.

**Sanity check ranges (cm):**
| Field  | Min | Max |
|--------|-----|-----|
| Chest  | 55  | 175 |
| Waist  | 45  | 165 |
| Hips   | 55  | 175 |
| Length | 25  | 155 |
| Inseam | 25  | 110 |

**Where the logic is:**
- Modal: `resources/js/components/MeasurementGuideModal.tsx` — accepts `initialStep` prop (`chest | waist | hips | length | chart`) to deep-link to a specific measurement
- Sanity check: `resources/js/utils/measurementSanity.ts` — `measurementWarning(key, value)` returns a warning string or `''`
- Wired in: `SizeFitSection.tsx` (landing), `CustomizationPanel.tsx` (designer), `ProductCustomization.tsx` (marketplace product)

---

### [2026-04-10] Navigation Refactor — Profile Name as Dashboard Link

**What was done:** Removed "My Orders" and "Sign Out" from the main navbar. The user's display name is now a clickable link navigating to `/customer-dashboard` (or `/tailor-dashboard` for tailors). Sign Out lives exclusively inside the Customer Dashboard navbar.

**Why it was done:** Cleaner top nav — fewer actions exposed at the top level. Customer Dashboard is now the central hub for profile management and order tracking.

**Where the logic is:**
- Nav: `resources/js/components/landing/Navigation.tsx` — user name wrapped in `<Link>` to dashboard route
- Sign Out: `resources/js/pages/CustomerDashboard.tsx` — top nav of the dashboard page

---

### [2026-04-10] Notifications System

**What was done:** Implemented full in-app notification system — backend model/migration/controller, and frontend NotificationBell component.

**Why it was done:** Tailors needed to know when orders arrived. Customers needed order status updates. Polling-based approach chosen over WebSockets to keep infrastructure simple.

**Where the logic is:**
- Model: `app/Models/KereNotification.php`
- Migration: `database/migrations/2026_04_06_000004_create_notifications_table.php`
- Controller: `app/Http/Controllers/Api/NotificationController.php`
- Notification creation: inside `OrderController.php` — `store()` (notifies tailor) and `updateStatus()` (notifies customer)
- Frontend: `resources/js/components/NotificationBell.tsx`
- Routes: `GET /api/notifications`, `POST /api/notifications/read-all`, `PATCH /api/notifications/{id}/read`

**The Hook:** Notifications are created inline within order controller methods — there is no separate event/listener system. If you add new order triggers, you must manually call `KereNotification::create()` in the relevant controller method.

---

### [2026-04-10] Customer Dashboard

**What was done:** Built `/customer-dashboard` page showing order history with status tracking and order detail modals.

**Why it was done:** Customers had no way to view their orders after placing them.

**Where the logic is:**
- Page: `resources/js/pages/CustomerDashboard.tsx`
- API: `app/Http/Controllers/Api/CustomerOrderController.php` → `GET /api/customer/orders`
- Route registered in: `routes/api.php`

**The Hook:** Custom orders display `custom_design_data` (clothing type, fabric, colors, notes). Marketplace orders display product images and `cm_measurements`. The dashboard modal conditionally renders based on `order.order_type`.

---

### [2026-04-10] Cart & Checkout System

**What was done:** Implemented global cart state with localStorage persistence, CartDrawer slide-out sidebar, and CartPage checkout screen.

**Why it was done:** Users needed to collect multiple items before placing orders, and the cart state needed to survive page navigation.

**Where the logic is:**
- Context: `resources/js/context/CartContext.tsx` — all cart state and operations
- Drawer: `resources/js/components/CartDrawer.tsx` — UI for slide-out cart
- Checkout: `resources/js/pages/CartPage.tsx` — places one `POST /api/orders` per cart item
- Root: `resources/js/App.tsx` — wraps entire app in `<CartProvider>`

**The Hook:** The cart in localStorage (`kere_cart` key) stores both marketplace and custom items under a unified `CartItem` interface. When `CartPage` checks out, it fires one API call per item sequentially. The cart is cleared after all orders succeed.

---

### [2026-04-10] Persistent Login Flow & Pending Order Preservation

**What was done:** When an unauthenticated user tries to place an order, their form state is saved to localStorage, they are redirected to login, and restored automatically post-login.

**Why it was done:** Without this, users lost their customization selections when redirected to login mid-checkout.

**Where the logic is:**
- Hook: `resources/js/hooks/useAuth.ts` — `savePendingOrder()`, `getPendingOrder()`, `clearPendingOrder()`, `saveReturnTo()`
- Used in: `resources/js/components/FinalPreview.tsx` (custom design), `resources/js/pages/ProductCustomization.tsx` (marketplace)
- Login pages restore pending order and navigate to `returnTo` after successful auth

---

### [2026-04-06] Order Status Notifications (Tailor → Customer)

**What was done:** When a tailor updates an order status, the customer receives an in-app notification.

**Why it was done:** Customers had no visibility into order progress after placing.

**Where the logic is:**
- `app/Http/Controllers/Api/OrderController.php` → `updateStatus()` method
- Creates `KereNotification` with `type: 'order_status'` when status changes to `processing`, `shipped`, or `delivered`
- Notification `data` payload includes: `{order_id, status}`

---

### [2026-04-06] Auto Tailor Assignment

**What was done:** Orders are auto-assigned to a random available tailor if no `tailor_id` is specified.

**Why it was done:** The MVP does not have a tailor selection UI. Orders must be routed automatically.

**Where the logic is:**
- `app/Http/Controllers/Api/OrderController.php` → `store()` method
- Queries `User::where('role', 'tailor')->inRandomOrder()->first()`
- If no tailor exists, order is created with `tailor_id: null`

---

### [2026-04-06] Custom Design Orders

**What was done:** `/design` tool allows customers to build a full garment specification. The spec is submitted as `custom_design_data` JSON stored on the Order record.

**Why it was done:** The core value proposition — bespoke clothing — requires capturing design intent beyond a simple product selection.

**Where the logic is:**
- Design tool: `resources/js/pages/DesignerApp.tsx` + `resources/js/components/DesignCanvas.tsx`
- Review: `resources/js/components/FinalPreview.tsx` — Submit button fires `POST /api/orders`
- Backend: `app/Http/Controllers/Api/OrderController.php` → `storeCustomOrder()`
- Stored in: `orders.custom_design_data` (JSON column)

**The Hook:** `custom_design_data` contains the full design object (clothing type, subcategory, length, sleeves, neckline, fabric, colors array, size, measurements, tailor notes). This entire blob is returned as-is to the tailor dashboard and customer dashboard for display.

---

### [2026-04-06] Tailor Dashboard & Product Management

**What was done:** Built `/tailor-dashboard` with order list, status management, and product CRUD.

**Why it was done:** Tailors needed a dedicated interface to manage incoming orders and their product listings.

**Where the logic is:**
- Page: `resources/js/pages/TailorDashboard.tsx`
- Subcomponents: `resources/js/components/tailor/` (DashboardHeader, StatsCards, OrdersList, ProductManager, AddProductModal)
- API: `GET /api/tailor/orders`, `PATCH /api/tailor/orders/{id}/status`, `GET /api/tailor/products`, `POST /api/tailor/products`
- Backend: `app/Http/Controllers/Api/OrderController.php` (tailorOrders, updateStatus)

---

### [2026-04-05] Marketplace & Product Customization

**What was done:** Built `/marketplace` product grid with search/filter and `/product/:id` customization page.

**Why it was done:** Primary customer entry point for browsing and ordering ready-made garments.

**Where the logic is:**
- `resources/js/pages/Marketplace.tsx` — debounced search (380ms), category filter, price filter, fetches `GET /api/products`
- `resources/js/pages/ProductCustomization.tsx` — color/size/qty/measurements selectors, fetches `GET /api/products/{id}`
- Backend: `app/Http/Controllers/Api/` (products are seeded via `ClothingSeeder`)

---

### [2026-04-05] SQLite & Railway Deployment

**What was done:** Configured SQLite as default database engine. Set up Nixpacks build for Railway. Added `TrustProxies=*` for HTTPS termination.

**Why it was done:** Simple self-contained database for MVP — no external DB service required. Railway terminates SSL at the proxy, so the app must trust forwarded headers to generate correct HTTPS URLs.

**Where the logic is:**
- `nixpacks.toml` — build phases and PHP extensions
- `Procfile` → `start.sh` — startup sequence
- `DB_CONNECTION=sqlite` in `.env` and Railway env vars
- `TRUSTED_PROXIES=*` in Railway env vars (or `AppServiceProvider`)
- SQLite file path defaults to `/tmp/database.sqlite` for Railway (ephemeral disk)

**The Hook:** Railway's filesystem is ephemeral — the SQLite file at `/tmp` is wiped on redeploy. This is acceptable for the MVP but means the database resets on every deploy. If data persistence is needed, migrate to a MySQL/PostgreSQL add-on on Railway and update `DB_CONNECTION`.

---

### [2026-04-05] Role-Based Auth System

**What was done:** Implemented unified User model with `role` field (`customer`/`tailor`). Token-based API authentication using SHA256-hashed tokens.

**Why it was done:** Two distinct user types with completely different UIs and API permissions.

**Where the logic is:**
- Migration: `database/migrations/2026_04_05_193614_add_role_and_profile_to_users_table.php`
- Controller: `app/Http/Controllers/Api/AuthController.php`
- Frontend hook: `resources/js/hooks/useAuth.ts`
- Token validation pattern used in every auth-gated controller: `User::where('api_token', hash('sha256', $bearerToken))->firstOrFail()`

---

### [2026-04-10] Manual Status Save, Finished Status & Customer Notification Center

**What was done:** Three connected features — (1) the tailor order modal now requires an explicit "Save Status" click before the API call fires; (2) a new `finished` order status was added; (3) customers have a dedicated Notifications section in their dashboard where they can clear individual or all notifications (deleting records from the DB).

**Why it was done:** Immediate-on-change API calls caused accidental status updates. The manual save pattern gives tailors a confirmation step. The notification center gives customers a persistent, clearable log of status updates rather than just an ephemeral bell dropdown.

**Where the logic is:**
- Backend status: `app/Http/Controllers/Api/OrderController.php` — `updateStatus()` now validates `finished` in addition to existing statuses. `finished` triggers a customer notification ("is finished and ready for you").
- Backend clear: `app/Http/Controllers/Api/NotificationController.php` — `destroy(id)` and `destroyAll()` methods added. Both check `user_id` ownership before deleting.
- Routes: `routes/api.php` — `DELETE /api/notifications/{id}` and `DELETE /api/notifications`
- Tailor modal: `resources/js/components/tailor/OrdersList.tsx`
  - `OrderDetailModal` now holds `localStatus` state. The `select` updates only local state (`setLocalStatus`). The "Save Status" `<Button>` calls `onStatusChange` with `await`, shows a `Loader2` spinner while in-flight, then shows a "Status saved — customer notified" green pill (fade in/out with `AnimatePresence`).
  - "Save Status" button is disabled when `localStatus === order.status` (no change) or while saving.
  - `key={viewing.id}` on the modal ensures `localStatus` resets when a different order is opened.
  - `STATUS_OPTIONS` (dropdown choices) and `STATUS_CONFIG` (display badges) are now separate — `STATUS_OPTIONS` only includes the 5 tailor-settable values: Pending, In Progress, Shipped, Finished, Cancelled.
  - `onStatusChange` prop type changed to `(orderId: number, status: string) => Promise<void>` to allow proper async await in the modal.
- Customer notifications: `resources/js/components/CustomerNotifications.tsx` — fetches `/api/notifications`, renders list with per-item `X` clear button and "Clear All" `<Button>`. Notifications animate in with Pattern 1 (fade in from bottom, `duration: 0.5`). Exit uses `exit={{ opacity: 0, x: 40 }}` via `AnimatePresence`. Unread notifications get a dark icon background.
- Customer dashboard: `resources/js/pages/CustomerDashboard.tsx` — imports and renders `<CustomerNotifications />` between orders list and quick actions. Added `finished` to its `STATUS_CONFIG`.

**The Hook:** The `onStatusChange` wrapper inside `OrdersList` (which updates `viewing` state after save) now uses `async/await` so the modal's success toast only fires after the API call resolves. If the API fails, the toast never appears — correct behavior, no optimistic falsehood.

---

### [2026-04-10] Dynamic Category Sampling & Cross-Page Filter via URL Params

**What was done:** The "Clothing Categories" section on the Landing page now fetches live data from the API. Each category card shows a real product image from the database (falling back to a static Unsplash image if the category is empty). Categories with zero products display a "Coming Soon" badge and a disabled "Notify Me" button instead of "Design Yours". Clicking "Design Yours" navigates to `/marketplace?category=<slug>`. The Marketplace page reads this URL param on mount and pre-activates the matching category filter. The URL stays in sync as the user changes filters, making every filtered view a shareable and bookmarkable link.

**Why it was done:** Cross-page state via URL parameters is the correct pattern for filter navigation — it supports SEO, shareable links, and browser back/forward navigation. Passing state through React component props or context would break on a hard refresh; the URL never does.

**Where the logic is:**
- Backend: `app/Http/Controllers/CategoryController.php` — `index()` now includes `sample_image` (random product image) and `products_count` per category. Fires one extra `inRandomOrder()` query per category (6 total, acceptable for MVP).
- Frontend (Landing): `resources/js/components/landing/CategoriesSection.tsx` — fetches `/api/categories` on mount, merges API data (`sample_image`, `products_count`) with the static `CATEGORIES` array. Falls back to Unsplash if `sample_image` is null. Shows "Coming Soon" badge + disabled "Notify Me" button if `products_count === 0`.
- Frontend (Marketplace): `resources/js/pages/Marketplace.tsx` — uses `useSearchParams` from `react-router`. `selectedCategory` state is initialized lazily from `searchParams.get('category')`. `handleCategoryChange(slug)` updates both state and URL (`setSearchParams(..., { replace: true })`). `clearFilters()` also resets URL params.

**The Hook:** The `replace: true` option on `setSearchParams` is critical — without it, every filter click pushes a new history entry and the back button becomes a filter-cycling nightmare instead of taking the user back to the Landing page.

---

---

### [2026-04-11] High-Fidelity Ghost-Mannequin Design Preview Engine

**What was done:** The DesignerApp (Steps 2–5) now uses a real ghost-mannequin photo as the base layer for the dress preview instead of SVG schematics or Unsplash placeholders. The color engine uses `mix-blend-mode: multiply` strictly on the white garment photo, preserving every fabric-fold shadow. A `contrast(1.15) brightness(1.02)` CSS filter on the base layer makes texture pop through the tint. An accent-color gradient overlays the collar/trim area as a second multiply pass. Missing style-detail overlays (e.g. Long Sleeves PNG not yet produced) show a "Preview coming soon" chip rather than crashing or reverting to schematic.

**Why it was done:** White-on-white ghost-mannequin assets are the industry standard for garment visualization — they are purpose-built for color-tinting via multiply blend because white areas become pure color and dark shadow pixels stay dark, preserving realistic drape and fold detail.

**Where the logic is:**
- Asset (canonical path): `public/assets/garments/maxi-base.png` — white ghost-mannequin dress PNG
- Also kept at: `public/images/garments/dress-maxi.png` for backward compatibility
- Component: `resources/js/components/GarmentPreview.tsx`
  - `BASE_LAYERS` map: `clothingType → subcategory → local PNG path`. All dress subcategories currently resolve to `maxi-base.png`. Add new paths here as assets are produced.
  - `OVERLAY_LAYERS` map: `type/detailKey/detailValue → PNG path | null`. `null` = asset not yet produced. When a slot is `null` and the user has selected that detail, `<ComingSoonChip>` renders over the preview instead of crashing.
  - Layer stack (z-order): `[0] base photo → [1] baseColor multiply div → [2] accentColor multiply gradient → [3] overlay PNG (when available)`
  - SVG silhouettes remain as fallback for shirt, pants, jacket, hat, scarf until photo assets are added.
- Steps wired: Step 3 (CustomizationPanel sticky preview), Step 4 (DesignCanvas live preview), Step 5 (FinalPreview hero card) — all use the same `<GarmentPreview>` component.

**The Hook:** `mix-blend-mode: multiply` only preserves shadows if the base image is genuinely white-on-white — any grey background would tint. The `contrast(1.15)` filter is applied to the `<img>` itself (Layer 0), before the multiply layer sits on top, so it sharpens the fold detail in the source before the color is applied rather than sharpening the composite (which would harden color edges). Adding new assets requires only one line in `BASE_LAYERS` or `OVERLAY_LAYERS` — no component logic changes needed.

---

### 2026-04-11 — Infrastructure & Feature Sprint

**1. PostgreSQL Migration (Railway)**
- `config/database.php`: default driver changed to `pgsql`; `pgsql` block now reads `DATABASE_URL` via Laravel's `url` key.
- `nixpacks.toml`: swapped `pdo_sqlite` + `pdo_mysql` for `pdo_pgsql`.
- `start.sh`: parses `DATABASE_URL` into individual `DB_*` env vars; removed SQLite file creation.
- No migration file changes needed — no SQLite-specific syntax was found.

**2. Transactional Email Notifications**
- Mailables: `OrderConfirmation`, `OrderStatusUpdated`, `NewOrderAlert` in `app/Mail/`.
- Blade templates in `resources/views/emails/` — dark header + slate palette, minimal design.
- `OrderController`: dispatches emails inline with `try/catch` (email failure never breaks the API). Confirmation + tailor alert on new order; status email on meaningful status changes.

**3. SEO, Open Graph & Sitemap**
- `GET /sitemap.xml` — static pages + all products with `<lastmod>`.
- `GET /robots.txt` — disallows dashboards + api, points to sitemap.
- `GET /api/products/{id}/meta` — returns `{title, description, image}` for product pages.
- `app.blade.php`: full OG + Twitter Card meta tags.
- `react-helmet-async` installed; `App.tsx` wrapped in `<HelmetProvider>`.
- `<Helmet>` added to Landing (with JSON-LD LocalBusiness), Marketplace, DesignerApp, CustomerDashboard (noindex), ProductCustomization (with JSON-LD Product schema).

**4. Footer Pages**
- All existing footer links point to real pages (`/how-it-works`, `/about`, `/our-tailors`, `/help`, `/privacy`, `/terms`, `/refund-policy`).
- New: `/contact` page with info cards + contact form (shows "Message Sent!" toast, no backend needed).
- "Contact Us" + "Email Support" links added to footer Support column.

**5. Email Support Contact Modal**
- `EmailSupportModal.tsx`: shows "Please sign in" prompt if unauthenticated; pre-fills user email (read-only); POST `/api/support-email`; success state.
- `SupportRequest.php` Mailable with `resources/views/emails/support-request.blade.php`.
- `SupportEmailController` updated to use the Mailable (was `Mail::raw`).
- Wired to footer "Email Support" link and Contact page "Open Email Support" button.

**6. Real Review Data on Marketplace Cards**
- `ApiProduct` interface extended with `reviews_count` + `average_rating`.
- Marketplace cards now show filled/empty stars (rounded to nearest integer) + count, or "No reviews yet".
- Backend already returned these fields via `withCount/withAvg` — no backend change needed.

**7. Tailor Public Profiles**
- Migration `2026_04_11_000010_add_profile_fields_to_users_table.php`: adds `bio`, `specialty`, `years_experience`, `profile_image` to `users`.
- `TailorController`: `GET /api/tailors`, `GET /api/tailors/{id}`, `PATCH /api/tailor/profile`.
- `TailorProfile.tsx` page at `/tailor/:id` — avatar, stats, bio, product grid with stars.
- Marketplace product cards: tailor name is now a link to `/tailor/{id}`.
- `TailorProfileEditor` accordion component in TailorDashboard for editing bio/specialty/experience/photo.

**8. Mobile Responsiveness Audit**
- `HeroSection`: headline `text-5xl` → `text-3xl sm:text-5xl`.
- `Marketplace`: filter dropdown fixed `w-64` → `w-full sm:w-64 max-w-[90vw]`.
- `ProductCustomization`: measurement grid `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.
- `CustomerDashboard`: quick actions `grid sm:grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2`.
- `StatsCards`: `grid-cols-2 lg:grid-cols-4` → `grid-cols-2 sm:grid-cols-4`.
- `OrdersList`: 7-column table — hidden columns on mobile (`hidden sm:table-cell`, `hidden md:table-cell`, `hidden lg:table-cell`).
- `Footer`: grid `md:grid-cols-5` → `sm:grid-cols-2 md:grid-cols-5`; newsletter form stacks on mobile.
- `FAQSection` CTA buttons: `flex-row` → `flex-col sm:flex-row`.
- `CategoriesSection`: `aspect-square` → `aspect-video sm:aspect-square`.

**9. Loading Skeletons & Error Boundaries**
- Skeletons in `resources/js/components/skeletons/`: `ProductCardSkeleton`, `OrderCardSkeleton`, `DashboardSkeleton`.
- `ErrorBoundary` (class component) + `ErrorFallback` (functional) in `resources/js/components/`.
- All routes in `routes.tsx` wrapped in `<ErrorBoundary>`.
- `Marketplace`: spinner replaced with 8-card `ProductCardSkeleton` grid; fetch errors show `ErrorFallback` with retry.
- `CustomerDashboard`: spinner replaced with 3 × `OrderCardSkeleton`.
- `TailorDashboard`: loading state replaced with `DashboardSkeleton`.

**10. Landing Page — Clarity & CTAs (2026-04-11)**
- `HeroSection`: pill badge, clearer headline, two CTAs (Browse Marketplace + Design Your Own), social proof stats.
- `CTASection`: two CTAs matching hero; removed generic copy; updated to rounded-full pill buttons.
- `LocalTailorsSection`: stat cards updated with real numbers (50+ tailors, 500+ orders, 4.9★, 7–14d turnaround); bullets made Kere-specific.
- `GuaranteeSection`: static testimonials updated — removed references to non-existent AI features; subtitle updated.

**11. Marketplace UX — Sorting & Filter Polish (2026-04-11)**
- Added Sort dropdown (Most recent, Most popular, Price low→high, Price high→low, Highest rated).
- Backend `ProductController`: added `popular` and `rating` sort options.
- Active filter chips shown below search bar with individual dismiss buttons.
- Sort and filter dropdowns share a single click-away overlay.

**12. Designer Tool — Step Indicator & Price Estimation (2026-04-11)**
- `DesignerApp`: dots replaced with numbered circles (✓ for completed steps) + label text (hidden on mobile).
- Live price estimate (₾) shown in header once clothing type is selected; animates on change.
- `FinalPreview`: price breakdown card added (base + fabric premium + design elements).
- Price logic: `estimatePrice()` / `getPriceBreakdown()` functions shared between header and final review.

**13. Checkout & Order Flow Polish (2026-04-11)**
- Post-order redirect changed from `/` to `/customer-dashboard` in both `ProductCustomization` and `FinalPreview`.
- Success message updated to "Taking you to your orders…".

**14. Dashboard Polish — Empty States & Status Visuals (2026-04-11)**
- `StatsCards`: removed hardcoded "+12% this month" and "3 due this week" placeholders; all stat subtitles now data-driven.

**15. Trust & Realism — Verified Badges & Guarantees (2026-04-11)**
- `TailorProfile`: "Verified Tailor" badge shown when tailor has reviews or ≥2 years experience.
- `TailorProfile`: Fit Guarantee / Kere-vetted / Tbilisi-based trust chips added below bio.
- `Marketplace`: `BadgeCheck` icon appears next to tailor name on product cards with reviews.

---

---

### [2026-05-02] Layer-Based 2D Clothing Customizer Engine

**What was done:** Built a full layer-based 2D clothing configurator — the "Sumissura-style" engine where transparent PNG/SVG images are stacked on top of each other via CSS `position: absolute`, and user selections swap individual layers in real time (no canvas, no 3D, no AI).

**How the engine works (read this before touching it):**

Each `customizer_product` has a set of `layer_categories` (e.g. Body, Fabric, Sleeves, Collar, Buttons). Each category has a `z_index` that controls stack order — lower = rendered behind. Within each category are `layer_options`, each pointing to a transparent PNG or SVG file. Selecting an option swaps only that layer; all other layers are unaffected. The `PreviewCanvas.tsx` component renders `<img>` tags absolutely positioned inside a fixed `aspect-[3/4]` container, sorted by `z_index`.

**Fabric tinting:** The Fabric layer category is marked `is_colorable: true`. The selected fabric's `color_hex` is injected as the CSS `color` property on that layer's `<img>`. SVG files in this layer use `fill="currentColor"` so the hex is picked up directly. This avoids canvas drawing or CSS filters.

**Stacking order for Classic Shirt:**

| z_index | Category | Role |
|---------|----------|------|
| 1 | Body | Base silhouette outline |
| 2 | Fabric | Color fill overlay (`is_colorable: true`) |
| 3 | Sleeves | Sleeve shape (long / short / rolled) |
| 4 | Collar | Collar style (spread / button-down / mandarin) |
| 5 | Buttons | Button placket |

**How to add a new product:**
1. `POST /api/admin/customizer/products` with `{ name, slug, base_price }`
2. `POST /api/admin/customizer/categories` for each layer, specifying `z_index` and `is_colorable`
3. Upload SVG/PNG options via `POST /api/admin/customizer/options` (multipart with `image` field)
4. Navigate to `/customize/{slug}`

**How to add a new layer category:**
1. Decide its `z_index` position in the stack (must not conflict with existing layers)
2. `POST /api/admin/customizer/categories` with `{ customizer_product_id, name, slug, z_index, is_required, is_colorable }`
3. Upload at least one option (mark it `is_default: true`)
4. `useCustomizer` hook auto-initializes the new category to its default

**How z_index stacking works:**
- Layer categories are sorted by `z_index` ascending before rendering
- Each `<img>` receives `style={{ zIndex: category.z_index }}`
- All layers are `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain`
- Transparent PNG/SVG only paints where the artwork exists — everything else is see-through, revealing layers below
- The container background is a CSS checkered pattern so transparency is visible

**How fabric tinting works:**
- Categories with `is_colorable: true` receive the selected `Fabric.color_hex` as their CSS `color` property
- SVG layers in this category must use `fill="currentColor"` — the SVG fill then equals the hex
- A `Fabric` record stores `color_hex` (always) and optionally `texture_image_path` (tileable PNG)
- Global fabrics (`customizer_product_id = null`) are merged with product-specific fabrics in the API response

**Where the logic is:**

Backend:
- Migrations: `database/migrations/2026_05_02_000001–000005_*.php`
- Models: `CustomizerProduct`, `LayerCategory`, `LayerOption`, `Fabric`, `SavedDesign`
- Resources: `app/Http/Resources/Customizer*.php`, `LayerCategory*.php`, `LayerOption*.php`, `Fabric*.php`, `SavedDesign*.php`
- Form Requests: `PreviewDesignRequest`, `StoreDesignRequest`, `StoreLayerOptionRequest`
- Controllers:
  - `CustomizerProductController` — public product listing + single product + preview pricing
  - `SavedDesignController` — auth-protected design CRUD
  - `CustomizerAdminController` — admin CRUD for products / categories / options (with image upload) / fabrics
- Routes: `routes/api.php` under `/api/customizer/*` (public + auth) and `/api/admin/customizer/*` (admin)
- Seeder: `database/seeders/CustomizerSeeder.php` — "Classic Shirt" with 5 categories, 12 options, 6 fabrics; SVGs generated via PHP string templates and saved to `storage/app/public/layers/`

Frontend:
- Types: `resources/js/types/customizer.ts`
- Hooks: `useProductData.ts` (fetch + shape), `useCustomizer.ts` (state: selections, fabric, price)
- Components: `resources/js/components/customizer/`
  - `PreviewCanvas.tsx` — stacked `<img>` layer renderer with `AnimatePresence` fade transitions
  - `CategoryTabs.tsx` — accessible `role="tab"` navigation with Motion `layoutId` indicator
  - `OptionSwatch.tsx` — thumbnail button with checkered background + selected check badge
  - `FabricPicker.tsx` — color circle swatches (same pattern as existing ProductCustomization)
  - `OptionPanel.tsx` — tabs + option grid + fabric picker wrapper
  - `PriceSummary.tsx` — reactive price breakdown (base + per-option modifiers + fabric modifier)
  - `SaveDesignModal.tsx` — name-and-save modal, calls `POST /api/customizer/designs`
  - `Customizer.tsx` — top-level wrapper: preview left, options right; Reset/Save/Order CTAs
- Pages:
  - `CustomizePage.tsx` at `/customize/:slug`
  - `MyDesignsPage.tsx` at `/my-designs`
  - `CustomizerAdminPage.tsx` at `/admin/customizer` (admin-only)

**The Hook:** `useCustomizer` initializes selections from each category's `is_default` option. `totalPrice` is a `useMemo` that recomputes instantly on every selection change — no API call needed for pricing. The `preview` endpoint (`POST /api/customizer/preview`) exists for server-side price validation before order submission, but the UI uses client-side computation for latency-free feedback.

**To run fresh:**
```bash
php artisan migrate:fresh --seed   # creates all tables + Classic Shirt data
php artisan storage:link           # serves SVG assets from /storage/layers/
```

*End of README. Update the Evolution Log every time a feature is added or a significant bug is fixed.*
