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

**Why Resend over Gmail SMTP:** Railway blocks all outbound SMTP ports (465 and 587). Resend uses HTTP (port 443) which is never blocked. The native `resend/resend-laravel` package is installed — set `MAIL_MAILER=resend` and `RESEND_KEY`.

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
| `RESEND_KEY` | Set in Railway env only — never commit the real key |
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

### [2026-08-13] Cart QA round — duplicate-order race and a signed-in navbar regression

**What was done:** Fixes for the QA pass on `b5b9bfa`. The backend was cleared as-is; both blockers were frontend.

- **🔴 Duplicate orders on retry after a partial checkout.** `checkout()` bailed on the first failing tailor group but left the *already placed* groups in the bag — `clearCart()` only ran on full success. Pressing **Place order** again re-sent the groups that had already succeeded, creating a second order and decrementing stock again, every click. The cart is now reconciled **as each group succeeds** (`removeCartItem` per line immediately after its 201), so a retry sends only what is genuinely left and re-ordering is impossible. Proven by intercepting the API to force group 1 → 201 and group 2 → 422: across two clicks the successful tailor was sent **exactly once** (`#1 tailor=5`, `#2 tailor=7`, `#3 tailor=7`), and the bag held only the failed line between attempts.
- **🔴 Georgian navbar overlap returned for signed-in users.** Yesterday's `b5f4874` fixed the signed-out case; the new bag button added ~44px to the same right-hand cluster and ate the remaining margin. Georgian names made it worse, since the full name sat in that cluster. The user link is now **icon-only below `2xl`** (name shown from 1536px, capped and truncated) and the centre group uses `gap-5` until `2xl`. Measured clearance, last centre link → right cluster, in `ka`:

| state | 1280 before → after | 1366 | 1440 |
| --- | --- | --- | --- |
| signed out | 1.3 → **20.0** | 60.3 | 97.3 |
| signed in, Georgian name | −46.4 → **20.7** | 63.7 | 100.7 |
| signed in, long Latin name | −96.0 → **20.7** | 63.7 | 100.7 |

  Name length no longer affects layout below `2xl`, so the worst case is now the same as the best.

- **🟡 Stock pre-check no longer fails open.** A product deleted while sitting in the bag returned 404, was skipped, and checkout proceeded — the customer saw the raw validator string *"The selected items.0.product_id is invalid."* A 404 is now tracked separately from a network error: the line is flagged **No longer available** and checkout is disabled, while a transport failure still lets the attempt through (the server remains the authority on overselling).
- **🟡 Write throttle surfaced.** `/api/orders` is `throttle:10,1`, and checkout sends one request per tailor group, so a large multi-tailor bag could hit it mid-checkout. A 429 now reports `cart.errorThrottled` ("wait a minute and place the rest") instead of a generic failure — and because the bag is reconciled per group, the retry resumes rather than duplicating.
- **Nits:** success-screen order totals use `.toFixed(2)` so they match every other total; the colour label is wrapped in its own element so `gap-1.5` applies to both flex children (previously `Colour:Navy` with no space, while hex swatches got one).
- **i18n:** `cart.noLongerAvailable` + `cart.errorThrottled` in both locales (1317/1317, in sync).

**Verified:** `vite build` clean; partial-failure retry proven non-duplicating via request interception (no DB writes); nav clearance re-measured across 3 auth states × 4 widths, all positive; deleted-product cart disables checkout and shows the right message; full drawer/badge/persistence/checkout-redirect suite re-run green in **en** and **ka** with zero console errors; colour rendering confirmed by screenshot.

---

### [2026-08-13] Shopping cart — guest bag, global drawer, `/cart`, tailor-grouped checkout

**What was done:** A standard marketplace add-to-cart. Mariam's design already shipped a cart *drawer* in `Marketplace.tsx`, but `quickCartItems` was plain `useState` local to that page — it vanished on navigation or refresh, had no nav badge, and its "checkout" button just navigated to the first item's product page. The drawer design was kept and promoted to a real cart.

- **Store (`hooks/useCart.ts`).** A `useSyncExternalStore` module rather than a Context provider, matching the existing `useSection` / `useAuth` plain-module convention and avoiding a provider above `RouterProvider` (the drawer needs router hooks). Persists to `localStorage` under `kere_cart` alongside `kere_lang` / `kere_section`, so **guests can fill a bag without an account** and only log in at checkout, reusing the existing `saveReturnTo` redirect. Also syncs across tabs via the `storage` event, tolerates malformed/unparseable storage, caps quantity at 99, and treats product + size + colour as the line identity.
- **Prices are a display snapshot only.** `storeMarketplaceOrder` recomputes every price from the product row (`$lineProduct->price`), so an edited `kere_cart` cannot change what a customer is charged. `/cart` re-fetches each product on load to refresh stock and surface anything that sold out, and blocks checkout while a line exceeds stock.
- **Global drawer (`components/CartDrawer.tsx`)** mounted inside `Navigation` (present on 19 pages), opened from a new nav bag icon with a wine count badge. Closes on Escape and locks body scroll. Keeps Mariam's markup, including the "you may also like" strip, which now fetches its own suggestions.
- **`/cart` page** groups the bag by tailor, showing per-tailor delivery and a notice that the bag will split; plus `Add to bag` on the product page next to the existing direct "Place order".
- **Backend — `POST /api/orders` now accepts multiple lines.** *Correction to the plan: this was scoped as "no backend change", which was wrong* — the endpoint created exactly one order item, so one-order-per-tailor was impossible without it. Rather than add a parallel cart endpoint (a drift risk), `storeMarketplaceOrder` normalises **both** shapes into one `$lines` array: the existing `product_id` payload still works untouched, and a new `items[]` payload creates one order with N items. Stock is now totalled per product before the guarded decrement, since one product can appear on several lines in different sizes. A server-side check rejects mixed tailors in one order (422), so the client-side grouping cannot be bypassed.
- **i18n:** new `cart.*` namespace, 35 keys, in both `en.json` and `ka.json` (1315/1315, in sync).

**Verified — real browser and real HTTP, not just the build.**

| check | result |
| --- | --- |
| Single-product order (regression, old payload) | 201, total ₾105 ✅ |
| Cart order, 2 lines, one tailor | 201, ₾315 = 90×2 + 120 + 15 ✅ |
| Order rows written | 2 items, subtotal 300 / shipping 15 / total 315 ✅ |
| Stock decrement | p19 50→47, p21 50→49 ✅ |
| Mixed tailors in one order | 422, rejected ✅ |
| Quantity beyond stock | 422, no stock moved ✅ |
| Badge / drawer / persistence (en + ka) | none→1→2, survives reload ✅ |
| `/cart` grouping + totals | 2 tailor groups, ₾125.00, ₾ only, no `$`, no untranslated keys ✅ |
| Logged-out checkout | routes to `/signin` with `returnTo=/cart` ✅ |
| Logged-in checkout | 2 orders placed, cart cleared, success screen ✅ |
| Console errors | none at any step ✅ |

All test data (6 orders, a temporary second tailor + product, the minted token) was removed afterwards and stock restored to 50/50.

**Found and fixed during testing:** the marketplace grid's size strip defaulted the line's colour to `colors[0]`, which is stored as hex — the bag rendered "Colour: #1E293B". Quick-add now leaves colour unset (the strip only picks a size), and both the drawer and `/cart` render any hex colour as a swatch instead of raw text.

**Flagged, not fixed:**
- **Checkout is slow: ~6.1s per tailor order** (measured 9.7s→15.8s, 15.9s→22.0s), because each order sends a confirmation email and an SMS/`Notifier::dual` synchronously inside the request. A two-tailor bag takes ~12s behind one "Placing order…" label. Queueing the mail/SMS would fix it; the UI should also show per-order progress.
- **Partial-failure window.** Orders are placed sequentially, so if the second fails the first is already committed. The UI reports this explicitly (`cart.errorPartial`) rather than hiding it, but there is no rollback.
- **`app/Http/Controllers/CartController.php` + `CartItem` are dead code** — Inertia-based (`Inertia::render`, `back()`) in a react-router SPA, and routed nowhere. The `cart_items` table is likewise unused. Left in place as removing them was outside this request, but they are now actively misleading next to a working localStorage cart.

---

### [2026-08-12] QA round on the navbar/hero pass — 2 blockers fixed, both outside desktop English

**What was done:** QA drove `998b91f…ac9eee4` in Chrome across 5 viewports × 2 locales and found two blockers, both in the ranges the previous log had explicitly marked unverified. Both reproduced independently before fixing.

**🔴 Blocker 1 — hero gallery clipped at the top on phones (≤640px).** `3636e2e` fixed desktop centring by making the RAF loop write `translate3d(x, -50%, 0)`. That `-50%` applies at *every* breakpoint, but the `≤640px` block overrode the track to `top: 39px`, so the JS subtracted half a track-height from a 39px offset and pushed the band above its own frame — the same bug as before, mirrored.

- **Fix is architectural, not a patched number:** vertical centring moved off `transform` (which the marquee owns and rewrites every frame) onto **flexbox** — `.kere-gallery` gains `display: flex; align-items: center`, `.kere-gallery-track` becomes `position: relative; flex: 0 0 auto` and drops `top` / `left` / `translateY(-50%)`, and the JS goes back to `translate3d(x, 0, 0)`. The stale `top: 39px` mobile override is deleted. Vertical position is now entirely CSS's, so no future transform write can clobber it.

| viewport | before (clipped above / dead below) | after |
| --- | --- | --- |
| 1280 | 0 / 0 | 0 / 0 |
| 640 | **83.5 / 73.5** | **0 / 0** |
| 390 | **54.6 / 102.4** | **centred, 23.9 symmetric** |

**🔴 Blocker 2 — Georgian nav labels overlapped the sign-in cluster at 1024–1200px.** `nav.faq` in `ka` is "ხშირად დასმული კითხვები" (23 chars vs English's "FAQ"), so the centre column overran the right cluster — silently, with no page scroll to reveal it. Fixed in two parts:

- The hover ghost reserved the **grown** width, padding the whole bar out by ~10% at every width. It now holds the label's **resting** width with the visible copy absolutely positioned, so growing it overflows symmetrically instead. Neighbour shift stays 0.0px (re-verified).
- The desktop link row moves from `lg` (1024) to **`xl` (1280)** — the first width where Georgian actually fits — with the burger and drawer overlay moved to `xl:hidden` to match, so navigation stays reachable below it.

| clearance (last centre link → right cluster) | 1024 | 1100 | 1200 | 1280 |
| --- | --- | --- | --- | --- |
| ka before | −114.7 | −75.6 | −28.6 | +10.3 |
| ka after | centre hidden | centre hidden | centre hidden | **+45.3** |
| en after | centre hidden | centre hidden | centre hidden | **+109.9** |

**🟡 Minor 3 — wordmark invisible in forced colours.** `.kere-nav-logo` paints through a mask with `background-color: currentColor`, and forced-colors rewrites `background-color` to Canvas (measured white-on-white). Added a `@media (forced-colors: active)` block setting `forced-color-adjust: none` and `background-color: CanvasText` — now measures `rgb(0,0,0)`.

**Verified:** burger present and drawer populated (10 links) at 1024/1200/1279, hidden at 1280 where the row takes over — clean handoff, no width with neither. Hover unchanged (0.0px shift, 10→11px, decoration `rgb(17,17,17)`). Screenshots at 1024 `ka` and 390 confirm both fixes visually. `vite build` clean.

**🔴 Blocker 4 (owner-reported, follow-up) — right nav cluster sat mid-bar at every width below `xl`.** The language toggle and profile icon rendered in the middle of the header instead of against the right edge. Cause is a CSS Grid subtlety introduced by the `d635cb3` restructure: the bar is `grid-cols-[1fr_auto_1fr]` and its middle child (the link row) is `hidden` below `xl`. A `display: none` child is **not placed in the grid at all**, so with only two children left the right cluster was auto-placed into column *2* — the `auto` track — and column 3 stayed empty. Widening the link row's breakpoint from `lg` to `xl` in Blocker 2 extended the broken range rather than causing it.

- **Fix:** pin each child to its track with `col-start-1` / `col-start-2` / `col-start-3`, so a hidden sibling can no longer re-flow the others. Measured gap from the right cluster to the bar's right edge, before → after: 375px **163.6 → 16**, 768px **277.8 → 24**, 1024px **373.4 → 40**, 1280px 40 → 40 — i.e. it now lands exactly on `px-4` / `sm:px-6` / `lg:px-10`, with the middle track collapsing to 0 when the links are hidden. Confirmed visually at 375 and 890.

**Flagged, not fixed (pre-existing):** the header bar has **no language toggle between 640px and 1023px** — the mobile one is `sm:hidden`, the desktop one `lg:flex`. Still reachable inside the burger drawer, so not a break, and it predates this diff. Also still open from earlier: drawer link order differs from desktop, and `npx tsc --noEmit` fails on `tsconfig.json:110`, so typecheck gates nothing for anyone.

---

### [2026-08-11] Hero spacing settled: heading clear of the navbar, band trimmed

**What was done:** Final tune after the centring fix. Two owner notes — the heading sat almost against the navbar, and the band was now too tall.

- **Restored the designed copy spacing.** `.kere-hero` `padding-top` back to **72px** and `.kere-hero-copy` `padding-top` back to **`clamp(58px, 7vh, 82px)`**. Halving these earlier was collateral from the wrong diagnosis — the gap was never padding, it was the `translate3d` bug, so the original values are correct again. Heading now clears the navbar by **~91px** (header bottom 51 → heading top 142.3) instead of ~17px.
- **Band trimmed.** `.kere-gallery` `min-height` and `.kere-gallery-image` `height` **`clamp(500px, 60vh, 620px)` → `clamp(420px, 50vh, 520px)`**, kept identical to each other. Visible strip **362px → 270px**.
- Net at 1280×920: card 77.9→847.1, gallery 259.8→719.8, and `.kere-gallery-track` measures **259.8→719.8**, i.e. still flush with the gallery — the centring fix holds at the new size.

**Verified in browser** (playwright-core + system Chrome): geometry re-measured, plus a screenshot confirming the heading has air under the navbar and the band reads correctly with both ellipse curves. `vite build` clean.

**Flagged, not fixed:** the first screenshot showed the gallery as empty grey boxes, which turned out to be a **capture-timing artefact, not a regression** — all six images report `complete=true` at 600×800, they are just external `picsum.photos` placeholders from the demo seed that had not arrived at 3.5s. Related, and a genuine issue: the landing page hotlinks Unsplash directly in `GuaranteeSection`, `LocalTailorsSection` and `CategoriesSection` (plus `ClothingSeeder`), and one of those now fails with `net::ERR_BLOCKED_BY_ORB`. Hotlinked third-party images on the landing page are worth replacing with local assets.

---

### [2026-08-11] Hero gallery was half an image below its own band — JS transform clobbered the CSS centring

**What was done:** The reported "big unnecessary gap between the header and the slideshow" was not spacing at all. `.kere-gallery-track` is centred in the stylesheet with `top: 50%` + `transform: translateY(-50%)`, but the marquee RAF loop in `HeroSection.tsx` assigned `track.style.transform = translate3d(Xpx, 0, 0)` every frame, **replacing** that transform and destroying the vertical centring. The track therefore sat exactly half an image-height (276px) below the gallery, hung the same distance out of the bottom, and left a 276px band of empty ellipse-masked white on top.

Measured in Chrome at 1280×920, before → after:

| element | before | after |
| --- | --- | --- |
| `.kere-gallery` | top 185.7, h 552, bottom 737.7 | unchanged |
| `.kere-gallery-track` | **top 461.7, bottom 1013.7** | **top 185.7, bottom 737.7** |
| visible band (between the ellipse masks) | **181px** | **362px** |
| copy bottom → first visible pixel | **276px** | **95px** |

- **Fix:** the loop now writes `translate3d(${offset}px, -50%, 0)`, keeping the marquee offset *and* the centring in the one transform the JS owns. One line, plus a comment so the `-50%` is not "tidied away" later.
- **This bug is why the band always looked short.** `3b71385` had raised the gallery/image height to `clamp(430px, 52vh, 540px)` to compensate — with the offset bug the visible strip was only ~139px at that size. Now that the track centres properly the current `clamp(500px, 60vh, 620px)` yields a 362px band, so the height bump can be revisited later if it ever reads as too tall; it looks right as-is.
- The gap that remains above the images (~95px) is the `.kere-ellipse-top` / `.kere-depth-ellipse` curve that shapes the band, exactly as intended — no longer 276px of nothing.

**Header nudged down.** `.kere-site-header` gained `pt-1.5` (6px), so the bar's contents sit lower instead of hugging the viewport edge; the header is now 51px and `.kere-hero`'s `min-height` was updated from `calc(100vh - 44px)` to `calc(100vh - 51px)` to match. Implemented as padding rather than a real `top` offset deliberately: the header is a full-width opaque bar, so an actual gap above it would let scrolled page content show through the strip.

**Verified — browser, not just build.** `playwright-core` (installed in the scratchpad, not the project) driving system Chrome against the dev server: geometry re-measured post-fix confirming track and gallery now share `top` and `bottom` to the pixel, plus a full screenshot showing the band filled edge to edge with both ellipse curves reading correctly. `vite build` clean.

---

### [2026-08-11] Hero: halve the gap above the gallery, grow the band; nav wordmark becomes the brand logo

**Hero spacing + band height (desktop only).** The gallery sat a long way below the header and the visible strip was short.

- `.kere-hero` `padding-top` **72px → 36px** and `.kere-hero-copy` `padding-top` **`clamp(58px, 7vh, 82px)` → `clamp(29px, 3.5vh, 41px)`** — both literally halved.
- `.kere-gallery` `min-height` and `.kere-gallery-image` `height` **`clamp(430px, 52vh, 540px)` → `clamp(500px, 60vh, 620px)`**, kept identical to each other so the images still exactly fill the band.
- Net effect at a ~900px viewport: ~68px of dead space removed above the band, while the **visible** strip goes ~278px → ~350px (+26%). The two roughly cancel, so the hero's overall height is within ~5px of before and nothing below it moves.
- The `≤991px` and `≤640px` blocks already carry their own gallery/hero values and were deliberately left alone, matching how `3b71385` scoped its change.
- **Still ~95px of the space above the images is the `.kere-ellipse-top` / `.kere-depth-ellipse` mask**, not padding — that white curve is what shapes the band. It was left intact, so the gap is *not* halved end-to-end; cutting it further means a shallower curve and losing the top/bottom symmetry, which is a design call rather than a spacing fix.

**Nav wordmark → real logo.** The header's text "Kere" is replaced by the brand mark from `public/assets/garments/Logos/Kere 1.png`.

- The source is **cream glyphs on a solid wine tile** (all three copies — the two in `garments/Logos/` and `brand/kere-logo.png` — are the same 323×326 tile), so dropping it in would have put a wine block in a cream bar, and it could not follow the nav's light/dark tone.
- Generated `public/assets/brand/kere-wordmark.png` (**221×49, 1.2 KB**) by mapping the source's luminance to alpha — which keeps the glyph antialiasing — then trimming to the letterforms.
- It renders through the new `.kere-nav-logo` class as a **CSS mask filled with `currentColor`**, so it inherits `navTextClass` exactly as the text did: ink on the light bar, cream on the dark one, from a single file. Sized by height (`h-[14px] sm:h-[15px] lg:h-4`) with `aspect-ratio: 221 / 49` deriving the width.
- The link keeps `aria-label="Kere"` and the mask span is `aria-hidden`, so the home link stays announced now that the visible text is gone. The **mobile drawer's** matching "Kere" text was swapped for the same mark so the two don't drift.

**Verified:** `vite build` clean; `.kere-nav-logo` and the mask URL are in the built CSS; the new `clamp(500px, 60vh, 620px)` appears twice (gallery + image) with the old value gone; `/assets/brand/kere-wordmark.png` serves 200 at 1.2 KB; the extracted mark was rendered tinted on the cream nav colour to confirm the background stripped cleanly. **Not browser-verified** — the exact gap and band height want your eye, and that is the part most likely to need a nudge.

---

### [2026-08-11] Navbar reorder (KERE left, links centred) + fix the blur on hover-grow

**What was done:** Follow-up to the hover change earlier the same day.

- **Blur on hover fixed — root cause was `scale`.** Growing the label with `transform: scale(1.1)` promotes it to a composited layer, so the browser stretches an already-rasterised bitmap of the text for the length of the transition and only re-renders sharp at the end — exactly the "blurry for a short time, then normal" that was reported. The size change is now **`font-size`** (`group-hover:text-[1.1em]`), which is not a composited property, so the glyphs are re-rendered crisply on every frame. Same 110% growth, same `duration-300 ease-out`.
- **No layout shift.** `font-size` reflows where `scale` did not, so `AnimatedNavText` now renders a second `aria-hidden invisible` copy of the label at the grown size in the same `inline-grid` cell. The hidden copy fixes the box at its widest, the visible copy is `justify-self-center`, so the word grows symmetrically inside reserved space and never nudges its neighbours.
- **Bar reordered.** `KERE` moved out of the centre grid cell into the left cell (its `justify-self-center` dropped) and sits alone there — beside the burger below `lg`, since the burger has to live somewhere. The link group moved into the centre cell, reordered to **Marketplace → Start Designing → Remodel → How It Works → FAQ**, and the `h-3.5 w-px` divider that separated the site anchors from the destinations is gone. The bar keeps `grid-cols-[1fr_auto_1fr]`, so the centre group stays optically centred regardless of how wide the left and right clusters get.

**Verified:** `vite build` clean; `group-hover:scale-110` is gone from the bundle and `group-hover:text-[1.1em]` present; the divider span is gone from the source; `navDividerClass` / `showSiteAnchors` / `isOverDark` all still referenced (nothing orphaned by the restructure). **Not browser-verified** — no browser automation this session; worth checking that the centre group still clears the right-hand cluster at ~1024–1280px, where the nav is tightest.

**Flagged:** the **mobile drawer** still lists How It Works → Marketplace → Start Designing → Remodel → FAQ, which no longer matches the desktop order. Left alone as it was outside the request — worth aligning.

---

### [2026-08-11] Navbar hover → underline + grow; restore the pointer cursor on every button

**What was done:** Three owner-requested nav changes, one of which turned out to be a site-wide regression.

- **New nav hover.** `AnimatedNavText` was a two-layer roll-up — the label slid up while a duplicate slid in from below (`group-hover:-translate-y-full` / `group-hover:translate-y-0`). Replaced with the requested effect: the hovered word gains an underline and scales to `110%`. Built as `underline decoration-transparent … group-hover:decoration-current`, so the underline **fades** in via `text-decoration-color` and its space is always reserved — a bare `group-hover:underline` would pop in and nudge the row. `inline-block` makes the transform apply, and because `scale` is a transform it grows without reflowing neighbours. Kept the outgoing `duration-300 ease-out` so nav timing is unchanged. This is the approved **hover-scale** pattern; the old roll-up was not one of the 5.
- **KERE wordmark hover removed entirely** — dropped both the `<AnimatedNavText>` wrapper and the `group` class on its `<Link>`. Confirmed `navTextClass` is colour-only (`text-white` / `text-[#111111]`), so with `group` gone the wordmark has no hover state left at all.
- **The EN/ქართ toggle had no pointer cursor — and neither did anything else.** It was already a real `<button>` with an `onClick`, so the fix was not markup. **Tailwind v4's Preflight dropped the `button { cursor: pointer }` that v3 supplied**, so the arrow cursor was showing on all **237 raw `<button>` elements** in the app plus the shared `ui/button.tsx` — the toggle was just where it got noticed. Fixed at the root with one `@layer base` rule (`button:not(:disabled), [role='button']:not([aria-disabled='true'])`), rather than adding a class in 237 places. Disabled buttons are excluded so they keep the default arrow.

**Verified:** `vite build` clean; the `cursor: pointer` rule is present in the built CSS; `group-hover:-translate-y-full` is gone from the bundle and `group-hover:scale-110` / `group-hover:decoration-current` are present. The one remaining `group-hover:translate-y-0` is the Marketplace card's size-picker slide-up, unrelated. **Not browser-verified** — no browser automation this session; the underline offset and the 110% growth want an eyeball at desktop widths, over both the light and dark nav tones.

**Note:** the effect is applied uniformly to every nav label that had the old one — including the filled black **Sign in** link, which now underlines and grows on top of its existing `hover:bg-[#2b2b2b]`. Say so if that one should keep only the background change.

---

### [2026-08-11] Remove the customizer's single-tab "Style your own" bar

**What was done:** The customizer rendered a black pill tab above the option swatches showing the layer-category name (every seeded product names its one category *"Style your own"*), so the page read the same label twice — once as a black tab, once as the grey section heading directly under it.

**Root cause:** `OptionPanel.tsx` chose its layout with `useStackedLayout = choosableCategories.length > 1`, so the **tab** branch ran only when a product had *exactly one* category — precisely the case where a tab bar has nothing to switch between. The stacked branch (no tabs, one grey heading per category) was reserved for multi-category products. The condition had the two layouts backwards.

- **Fix:** `OptionPanel` now always stacks. Multi-category products keep the identical stacked rendering they already had (including the `border-t` separator between categories, previously gated on `useStackedLayout`), and single-category products simply lose the pointless tab. Dropped the now-unused `activeCategoryId` state, its initialising `useEffect`, the `activeCategory` lookup, and the `useState`/`useEffect` imports.
- **`CategoryTabs.tsx` deleted** — the tab bar was its only consumer, so keeping it would have left dead code. This also removes its `duration: 0.25` `layoutId` indicator, which was an off-spec animation.
- **Why not just hide the pill:** a `categories.length > 1` guard would have left the same backwards branch in place and kept a component no product could reach. Verified against the live API that **all 15 customizer products have 0 or exactly 1 layer category** (the 9 with one all name it "Style your own"), so nothing depended on tab navigation — and stacking keeps future multi-category products fully reachable, which suppressing the tab would not.

**Verified:** `vite build` clean (exit 0); `/customize/mens-cargo-trousers`, `/customize/mens-elbow-shirt` and `/customize/witeli-maika` all 200; the tab's `aria-label` (`Customization categories`) and `tab-indicator` `layoutId` both gone from the built bundle. **Not browser-verified** — no browser automation in this session; the swatch grid and its grey heading should be eyeballed on a customizer page.

**Flagged, not fixed (pre-existing, outside this change):** `OptionPanel.tsx` renders a hardcoded English `"More options coming soon."` for products with no choosable categories — an i18n violation that should come from `en.json`/`ka.json`.

---

### [2026-08-11] Merge Mariam's August Design Pass (`mariam-changes`) — design in, regressions out

**What was done:** Merged `origin/mariam-changes` (2 commits by `mbadzaghua`, latest 08-10) into `main`. The branch forked at `028990e` on 08-05 and so predated the twenty 08-07 commits, meaning three of its changes would have silently reverted shipped work. Resolution rule (per owner): **her design wins on layout/CSS; anything that reverts a deliberate main commit does not.** Note `origin/mariami` is now fully stale (0 ahead / 60 behind) — `mariam-changes` supersedes it.

- **Taken from Mariam (design):** the Marketplace redesign — section tabs (All / Women / Men), a centred result count, and a proper filter-bar system (`category` / `colour` / `size` / `fabric` / `more`) replacing the old left sidebar; `xl:grid-cols-4` on the product and skeleton grids; the shopping-bag slide-in drawer; `HeroSection`, `ProductCustomization` (525 lines), `RemodelRequest` (305), `NotFound`, +175 lines of `app.css`; +20 i18n keys per locale.
- **Kept from main (would have regressed):**
  - `Navigation.tsx` — she still carried the mobile-drawer search that `9d1fb00` deliberately removed (still `readOnly`, still non-functional). Dropped; main's `mt-10 sm:mt-12` drawer spacing restored since the bar above it is gone. Her sorted import block was kept, minus the now-unused `Search`.
  - `Marketplace.tsx` — her branch wrapped the **working** text search in `className="hidden"`. Restored as a live control in the free `1fr` column of her new bar (search left · count centre · sort right), so the bar reads as designed with search intact.
  - The superseded sidebar block, which she had hidden rather than deleted, was removed outright — her filter menus already cover category **and** price, so keeping it would have been dead code. All of `clearFilters` / `priceMax` / `categories` / `WOMEN_ONLY_CATEGORY_SLUGS` remain live through those menus.
  - Main's dead-space fix (`3b71385`) needed no re-injection: her restructure removes the sidebar and the `ml-[245px]`/`pl-[245px]` magic offsets independently, and reintroduces neither.
- **Asset weight (undid a regression against `1b4d7c1`/`0dbb20b`):** the branch added ~13 MB of images days after the ~69% / ~76% compression passes. **10 of its 12 new assets were never referenced** — design iterations left in the tree — and the 2 live ones were uncompressed PNG exports of opaque photographs. Deleted the 9 orphans; converted the two live ones to mozjpeg q82 (`remodel-gold-texture` 3031 KB → 273 KB, −91%; `landing-red-hanger` 1854 KB → 204 KB, −89%) and repointed `RemodelRequest`/`HeroSection` at the `.jpg`, matching the `gold-upload-bg.png` → `.jpg` convention. **Net: 13.1 MB never enters the tree.** (Her `remodel-gold-texture.jpg` was *not* a smaller copy of the PNG — a 736×736 square crop vs the 1672×941 wide original — so it was regenerated from the PNG rather than swapped in.)

**Verified:** `vite build` clean (exit 0, 2126 modules); zero conflict markers; both locales parse and stay key-for-key in sync (1281/1281). Over real HTTP against `php artisan serve`: `/`, `/marketplace`, `/remodel` and `/api/products` → 200, and both new `.jpg` assets serve at their compressed sizes. Bundle grep confirms no reference to any deleted asset survives. Convention sweep of her diff: no blue/indigo/purple, no `$` (₾ preserved on the price filter and chips), no new spring/bounce. Pre-merge `main` is recoverable at `0dbb20b`; the in-flight Flitt payment work was parked on branch `flitt-payments` (`738fe71`) first.

**Home page reverted (owner call, same day):** after reviewing the merge in the browser the owner kept everything except the landing page, so her hero pass was rolled back to pre-merge `main` while the rest of the design stayed. Reverted: `HeroSection.tsx` (her full-bleed dark `landing-red-hanger.jpg` editorial hero → main's `kere-hero` card + draggable product gallery, byte-identical to `0dbb20b`), the four `.kere-landing`-scoped `app.css` hunks (transparent header + white-on-dark nav tone + the `.kere-editorial-hero-*` monochrome overrides), and the hero asset itself (now unreferenced). Orphaned `hero.shopNow` trimmed from both locales (1281 → 1280, still in sync).

The landing nav CSS **had** to go with the hero: her `.kere-landing … .kere-site-header-bar` rule forces nav text `#ffffff` until scrolled, which paired with her dark photograph — over main's cream hero that is white-on-cream and invisible, the same class of bug as the 08-01 `LanguageToggle` regression. Kept deliberately: `Navigation.tsx` (her `AnimatedNavText` roll-up hover is site-wide, not a landing change, so it still appears on the home page), plus the `.remodel-page` / `.kere-sign-in-link` / `.kere-info-page` / `.kere-workflow-page` CSS and every non-landing page. `vite build` clean (2126 modules); `/` and `kere-look-*.jpeg` serve 200; the deleted hero asset now falls through to the SPA shell.

**Not verified / flagged:**
- **No browser pass** — no browser automation in this session. Her Marketplace bar is a 3-column grid whose first cell now holds the restored search; the centred count is `hidden sm:block`, so the **narrow-viewport layout of that bar needs a real eyeball**, as do the two recompressed backgrounds at full-bleed.
- **Off-spec animation (hers, left as-is):** `Marketplace.tsx` bag drawer uses `transition={{ type: 'tween', duration: 0.28 }}` — not one of the 5 approved patterns at 0.5/0.6s. It is a tween (no spring/bounce) and retiming a drawer to 0.5s would make it feel sluggish, so it is flagged for a design call rather than silently changed.
- **Pre-existing, not from this merge:** `npx tsc --noEmit` fails at `tsconfig.json:110` (`Invalid value for '--ignoreDeprecations'` under TS 5.7.3) — typechecking is broken repo-wide independent of this change. Off-spec `0.15`/`0.2`/`0.4` durations in `Marketplace`/`ProductCustomization`/`NotFound` were already on `main`.
- **Recurring noise:** `en.json`/`ka.json` diffed as ~2730 changed lines each that were **pure CRLF churn** — the real change was +20 keys, no deletions. A `.gitattributes` `text eol=lf` rule would stop this recurring on every push from her machine; not added here as it is outside the merge.

---

### [2026-08-07] Fix CustomizerSeeder broken image references

**What was done:** The classic-shirt / woman-shirt / womens-top customiser products pointed at garment images that had been deleted from the working tree (`maxi-base.png`, `necklines_*`, `sleeves_long*`, `sleeveless.jpg`, `short sleeeves.jpg`, `long sleeves.jpg`, `Colar1.jpg`, `colar 2.jpg`, all `maika *`, plus their variants) — a fresh `DatabaseSeeder` run or a prod deploy would have rendered those products with broken images.

- **Restored 20 images** that were unstaged deletions, straight from `HEAD` (`git restore --source=HEAD`) — the assets still existed in git, only the working tree had dropped them.
- **Removed a broken-since-birth layer:** the classic-shirt z=5 "Body Buttons" overlay referenced `body+button_close_standard.png`, which **never existed in git history** and is on no disk — so that required layer has been a broken/empty overlay since the product was created. With no asset to point it at, the dead `body-buttons` `LayerCategory` + option were removed (no frontend references the `body-buttons` slug).

**Verified:** re-seeded all three products; a full audit of every image path across **all** customiser products (`preview_image_path` + every option/child/colour `image/thumbnail/alt/back/left/right`) now resolves on disk for the seeded products — 0 missing of 105 checked. The only remaining misses are 4 files on `witeli maika`, an **admin-uploaded** product (`product-previews/…`, `layers/…` UUIDs) whose upload files aren't present locally — unrelated to seeders, flagged separately.

### [2026-08-07] Men's Section Customiser Garments (2 shirts + 4 trousers)

**What was done:** Wired six new men's garments into the customiser catalogue from raw image drops in `public/assets/garments/`. Each is a `CustomizerProduct` with `gender='men'`, following the Sleeveless Tank shape (single `style` layer whose colour variants each carry their own photos), so they surface in the men's section (`whereIn('gender',['men','unisex'])`) with live colour swatches.

- **New seeder (`MensGarmentsSeeder`):** one parameterised `seedColorGarment()` + a shared `PALETTE` slug→[name,hex] map, so adding a garment is a folder + colour-slug list, no per-product boilerplate. White is the only colour shot from other angles; those view files (`{slug}-back/left/right.png`) are picked up automatically via a `file_exists`-guarded `viewPath()`, so trousers (white has back+left, Cargo also right) need no special-casing vs shirts (back+left+right). Registered in `DatabaseSeeder` alongside a now-registered `SleevelessTankSeeder`.
- **Products:** Men's Elbow-Sleeve Shirt (`shirt`, 95₾, 9 colours), Men's Short-Sleeve Tee (`shirt`, 45₾, 8 colours), and Chino / Corduroy / Dress / Cargo trousers (`trousers`, 120₾; 9 colours each, Cargo 10 incl. Sand). Unified 10-colour men's palette (white, black, charcoal, grey, slate blue, navy, olive, khaki, sand, brown) plus light-/dark-blue on the shirts.
- **Assets:** the drop shipped white views with descriptive names but every colour variant as `unnamed (N).png` (and trousers had no named front at all). Each unnamed file was visually identified and renamed to the `{colour-slug}-front.png` convention. Redundant `TankTops/` folder (byte-identical to the existing `shirts/` behind the unisex Sleeveless Tank) deleted; the tank seeder now sets `gender='unisex'` explicitly so it already appears to men.

**Verified:** all six seeded on SQLite with **zero missing image files** (every `image/back/left/right` path checked against `public_path`); gender/category/price/colour counts confirmed. Real HTTP: `GET /api/customizer/products?gender=men` → 200 with all six present (and hidden from women); `GET /api/customizer/products/mens-cargo-trousers` → 200 with the `Cargo` style option carrying 10 colours, each with `color_hex` + an `image_url` resolving to a real file. **Browser-verified** (Playwright + system Chrome against the running dev server): the Cargo and Elbow-Sleeve customisers render with the full swatch row (10 / 9 colours), price in ₾ (120 / 95) and the wine order button; clicking a swatch swaps the preview to the exact `{colour}-front.png` (White→Navy→Olive→Sand confirmed); the view switcher cycles white front→back→left→right (each a real photo); zero broken images and zero console errors on load.

### [2026-08-04] Remodel / Alter-My-Garment Service (4th entry point, priced reverse-marketplace)

**What was done:** Added a third customer offering alongside Marketplace / Create Design / Upload Design — a **remodel** flow where a customer sends an existing garment to be altered, tailors bid with a price, and the customer picks one. Built as a new `order_type='remodel'` reusing the existing open-order → offer → choose-tailor → chat pipeline, not a parallel system.

- **Schema (`2026_08_04_000001`):** `orders.expected_price` (customer's optional budget) + `tailor_requests.offered_price` (tailor's quoted price), both nullable `decimal(10,2)`. No `order_type` enum change (free string); `pending_assignment` status reused.
- **Backend (`OrderController`, `CustomerOrderController`):** new `storeRemodelOrder` (order_type `remodel`, always `pending_assignment`, stores the **real pickup/return address** + `custom_design_data.{change_request, remodel_images[]}` + `expected_price`, and broadcasts an `open_order` notification to every approved tailor). `openOrders`/`requestOrder` broadened from `custom` to `whereIn(['custom','remodel'])`; offers now carry `offered_price`; the tailor-request notification is remodel-aware (title/body/SMS). `CustomerOrderController` surfaces `offered_price` per offer and `expected_price` on the order.
- **Frontend:** new `/remodel` route + `RemodelRequest.tsx` intake (multi-photo upload via `/api/uploads`, "what to change" textarea, pickup/return address, optional expected price in ₾). "Remodel" link added to the desktop nav destinations + mobile menu (link only — navbar styling untouched). `AvailableDesigns` (tailor) renders remodel cards (photo, change text, expected price) with a **price (₾)** input on the offer form. `CustomerDashboard` shows each offer's price + message, the remodel photos/request/budget in the order modal, and a "Remodel request" label/icon in the list. Post-confirmation communication uses the existing order chat unchanged.
- **i18n:** full `remodel.*` (29 keys) + new `nav.remodel`, `tailorComponents.*`, `customerDashboard.*` in both `en.json` and `ka.json`, kept key-for-key in sync (1259/1259).
- **Scope calls (per owner):** single priced offer per tailor (real negotiation happens in chat after confirm), and one reused address with manual/off-platform courier for v1 (no courier API/tracking yet).

**Verified:** migration applied on SQLite; full flow exercised over real HTTP — create remodel order → two tailors offer with prices → customer sees both → choose one → **other offer auto-declined**, order assigned, both tailors notified. Validation edges confirmed (missing images/change_request/bad URL/negative price → 422 with `Accept: application/json`; offer on assigned order → 409; valid minimal → 201). Notifications fire with remodel-aware copy. `vite build` clean; locales parse and stay in sync. Test data cleaned from the dev DB afterward. **Not yet done:** in-browser click-through of the new pages (no browser automation in this environment) — recommend a visual pass of `/remodel`, the tailor offer form, and the customer compare view in both locales.

**QA round (fixes):**
- **Price required on remodel offers.** `offered_price` was nullable in `requestOrder`, so a tailor could offer on a remodel with no number — the whole point of the flow. The validation rule is now conditional: `required` for `order_type='remodel'`, still `nullable` for `custom`. Frontend mirrors it — the tailor's Send button is disabled (with a hint) until a price is entered. Verified over HTTP: no-price remodel offer → 422, priced → 201; custom offers still accept no price.
- **Remodel total reflects the accepted price.** Previously the order headline showed `total` = shipping only (₾15) even after accepting a ₾200 offer — three prices on screen with the smallest as the headline. On accept, `chooseTailor` now folds the winning quote into the order for remodel orders: `subtotal = offered_price`, `total = offered_price + shipping` (custom unchanged). While the order is still `pending_assignment` (no offer chosen), the customer total line reads "quoted by tailor" instead of the misleading shipping-only figure. Verified: total = 215 (200 + 15) after accept; "quoted by tailor" before. Locales now 1261/1261.

### [2026-08-04] Merge Mariami's Newer Design Commits (design wins, main's logic/fixes kept)

**What was done:** Merged the three genuinely-new commits from `origin/mariami` (`ce46811`, `1d7f2fc`, `df88783`) that landed after the 08-01 integration. `git cherry` confirmed the other 21 branch commits already had equivalents in `main`. Resolution rule (per owner): **Mariam's design wins on conflict; the navbar is untouched; main's logic and shipped fixes are preserved.**

- **Taken from Mariam (design):** `app.css` product-card action buttons go row/50%-width on mobile (`.kere-actions`/`.kere-button`); `DesignerApp`/`SectionSelect` design pass (auto-merged); `Marketplace` header gains a right-aligned "showing count" on `lg` and switches to a margin-offset content layout.
- **Kept from main (not design — would have regressed):** navbar left exactly as-is per instruction (`Navigation.tsx` + all `.kere-site-header` CSS stay light/adaptive, `#F4F0E9`); `SmsService` SMSOffice rejection-logging; `routes.tsx` `ScrollToTop` (pathname-only) + merged `react-router` import; the full README Evolution Log; `DesignerApp` gender filter via the shared `WOMEN_ONLY_CATEGORIES` set; locales kept at main's 3-key `howItWorks` (the shared component only references `s1/s3/s6Title` — her extra keys were orphans).
- **Marketplace surgical merge:** started from her file, re-injected main's `ImageOff` empty-image placeholder (her side regressed to a `□` tofu glyph) and the `WOMEN_ONLY_CATEGORY_SLUGS` gender filter on both category lists. Her old 40s CSS gallery marquee was again dropped (main uses the JS draggable hero).

**Verified:** `vite build` clean (exit 0, 2125 modules); no conflict markers; Marketplace `section`/`switchSection` single-declared; gender filter present on both category maps. Backup branch `backup/main-before-mariami-merge` retained. Browser pass still pending.

**Post-merge fixes (review follow-up):** two regressions the merge introduced were caught in review and reverted. (1) `app.css` — the light navbar's nav-group divider (`.kere-landing … .border-l`) had its `!important` color flipped to `rgba(255,255,255,0.2)` (invisible white-on-cream, and inconsistent with the black `.design-page`/`.remodel-page` dividers); restored to main's `rgba(0,0,0,0.15)`, so the adaptive `navDividerClass` value shows through on the light surface. (2) `Marketplace.tsx` — the new `lg` header "showing count" duplicated the inline count above the grid (identical text rendered twice on desktop); the inline count is now `lg:hidden`, so the header count is the desktop source and the inline count stays for mobile. `vite build` clean (2126 modules). Browser pass still pending.

### [2026-08-01] Integrate Mariami's Design Pass + Light Adaptive Navbar

**What was done:** Landed the design updates from the `mariami` branch (PR #5) onto `main` and reworked the site navbar from always-dark to a light, tone-adaptive surface.

- **Design integration:** rather than merging the whole diverged `mariami` branch (stale backend duplicates + 10 conflicts), only her three genuinely-new design commits were cherry-picked on top of `main`. Net: 25 frontend files (landing components, pages, `app.css`, locales, routes); **zero** backend/migration/config changes. Conflicts resolved as *main's logic + her design* — notably the marketplace gallery kept main's drag/touch behaviour (her old 40s CSS auto-scroll marquee was dropped, since main deliberately removed it in the draggable-hero work).
- **Navbar colour:** header is now `#F4F0E9` (light warm cream, a touch lighter than the `#E4E0D7` body) with `#111111` text, replacing her `#1c1c1c`/white. Applied in `Navigation.tsx` and the `.kere-landing` / `.design-page` `!important` blocks in `app.css`.
- **Adaptive tone restored:** her redesign had hard-coded `navTextClass`/`isOverDark` to always-white; restored main's `isOverDark` probe so dark-themed pages (Login `#111111`, Register `#050505`) keep a dark navbar while cream pages stay light. Branded pages (`.kere-landing`/`.design-page`) are pinned light via CSS; the JSX `isOverDark` branch drives the ~9 unwrapped pages.
- **Burger scope:** MENU button restored to `lg:hidden` (mobile/tablet only) with desktop anchors at `lg:flex` and the mobile overlay guarded `lg:hidden` — matching pre-redesign behaviour.
- **Bug fixed:** `<LanguageToggle isOverDark />` (JSX shorthand for `={true}`) was rendering the EN/ქართ toggle white on ~8 light unwrapped pages (AboutUs, Contact, HelpCenter, OurTailors, Privacy/Refund/Terms, RoleSelection) — invisible on the new cream bar. Restored main's `isOverDark={isOverDark}`.
- **Cleanup:** removed a dead duplicate white-text CSS block her merge left behind; merged a duplicate `react-router` import in `routes.tsx`.
- **Desktop nav:** added Marketplace + Start Designing links to the desktop top bar (they were previously only in the mobile slide-out); How It Works / FAQ stay gated to landing & partners.

**QA round (fixes):**
- `ScrollToTop` (routes.tsx) keyed on `search` as well as `pathname`, so Marketplace category/sort filters (which sync to the query string) yanked the page to the top mid-browse. Now keyed on `pathname` only.
- Marketplace empty-image placeholder was a bare `□` (tofu glyph); replaced with a Lucide `<ImageOff>` icon.
- Removed orphaned i18n keys after the copy trim: `signIn.loginSubtitleCustomer/Tailor` (Login subtitle dropped) and `howItWorks.eyebrow/closing/s1Desc/s2*/s3Desc/s4*/s5*/s6Desc` (HowItWorks went 6→3 steps, titles only) — from both `en.json` and `ka.json`, kept in sync.

**Intentional design exceptions (signed off):** HowItWorks uses a scroll-linked timeline line (`scrollYProgress`) that isn't one of the 5 approved animation patterns; Marketplace product images use `object-contain` (letterboxed) rather than `object-cover`. Both are deliberate choices from the design pass.

**Verified:** `vite build` clean throughout; phone-OTP registration (25 refs), Login auth submit, and Marketplace gender filtering confirmed intact vs `main`; both locales parse and stay key-for-key in sync. Full cross-page browser pass of the light navbar (esp. Partners over its dark benefits section, and the toggle on unwrapped pages) still pending user eyeball.

### [2026-07-29] Drag-to-Reorder Colours, Styles & Sub-styles in Customizer Admin

**What was done:** Admins can drag-and-drop to reorder a style's **colour variants**, a category's **styles**, and a style's **sub-styles**; the order persists and is what customers see (all render in `display_order`).

- **Backend:** three endpoints, each validating the payload is a permutation of the parent's own children (422 otherwise) and writing each `display_order` to its index inside a `DB::transaction`:
  - `PUT /api/admin/customizer/options/{id}/colors/reorder` (`reorderOptionColors`) — colours of a style.
  - `PUT /api/admin/customizer/categories/{id}/options/reorder` (`reorderCategoryOptions`) — top-level styles of a category.
  - `PUT /api/admin/customizer/options/{id}/children/reorder` (`reorderOptionChildren`) — sub-styles of a style.
  - The `display_order` columns and the `orderBy('display_order')` relations (`LayerOption::colors()`, `LayerCategory::options()`, `LayerOption::children()`) already existed — only the write path was missing.
- **Frontend (`CustomizerAdminPage`):** `ColorVariantRow`, `StyleCard`, and the new `SubStyleRow` are each a `Reorder.Item` (Motion) with a `GripVertical` handle; `dragListener={false}` + `useDragControls` means only the handle starts a drag, so inline edit/upload/delete controls and the three nested reorder levels stay independent. `StyleCard` holds local `colors` + `children` orders, `OptionGroupCard` a local `styles` order — each re-synced from the server via `useEffect` and persisted on drag end. Reorder transition is a 0.2s tween (no spring) — a functional admin interaction, not one of the branded entrance animations.
- **Layout change:** sub-styles moved from a 3-column thumbnail **grid** to a compact vertical **list** (thumbnail + name + grip + delete) so drag-reorder tracks cleanly on a single axis and matches the colours/styles rows.

**Verified:** all three routes registered; PHP lint + `tsc`/`vite build` clean; backend round-trips confirmed via tinker (reversing a 9-colour style, a 3-style category, and a 3-sub-style option all persisted and restored). Drag gesture itself still needs a real-browser pass.

### [2026-07-29] SMS Live via SMSOffice.ge + Silent-Rejection Fix

**What was done:** Took the SMSOffice.ge SMS gateway from configured-but-dormant to confirmed live delivery, and fixed a silent-failure bug that had masked a rejected send.

- **SMS confirmed live:** `SMSOFFICE_KEY` is set and funded; the "Kere" sender name is now activated on the SMSOffice account. A real OTP-style SMS was delivered end-to-end to a +995 number with "Kere" as the sender. This supersedes the 2026-07-22 note that SMS was "logged, not delivered."
- **Silent-rejection fix (`SmsService`):** SMSOffice returns **HTTP 200 even when it rejects a message** (real status is in the JSON body: `{"Success":false,"Message":"...","ErrorCode":N}`). The old code only checked `$response->failed()` (HTTP ≥ 400), so rejections like `sender is not active` (ErrorCode 165) / `invalid sender` (150) passed as success with no log. `SmsService::send` now parses the body and `Log::error`s `SMS rejected for {phone}: {Message} (ErrorCode {code})` when `Success` is false. Successful sends stay silent.
- **Not changed:** tailor auth is still phone-identified **with a password** (SMS OTP is registration-verification only, not passwordless login).

**Prod note:** ensure `SMSOFFICE_KEY`/`SMSOFFICE_SENDER=Kere` are set on Railway and the SMSOffice balance stays funded — a depleted balance will now surface as a logged rejection rather than a silent no-op.

### [2026-07-22] Tailor Phone Verification + Dual-Channel (SMS + Email) Notifications

**What was done:** Finished the phone-first tailor flow so Georgian tailors (who often have no email) verify and get notified by SMS, with email as an optional bonus channel.

- **SMS gateway → SMSOffice.ge:** `SmsService` now sends through the Georgian gateway SMSOffice.ge (best +995 delivery/cost, supports a registered "Kere" sender) instead of Twilio, via `SMSOFFICE_KEY`/`SMSOFFICE_SENDER`/`SMSOFFICE_URL` (`config/services.php`). Logs the message when unconfigured (dev). `OtpService::sendSms` and every alert route through it.
- **Phone-first verification:** `registerInitiate` now sends the OTP by SMS for `role=tailor` even when they also enter an email (email stays optional, unverified contact); customers still verify by email. OTP text is Georgian.
- **Dual-channel alerts:** new `Notifier::dual($user, $smsText, $mail)` — SMS always (if phone) + email additionally (if present). Replaces the old `if (email) … elseif (phone)` either/or blocks in all tailor-facing alerts: `NewOrderAlert` (marketplace, custom, chosen-tailor), `TailorApproved`, `TailorRejected`. Customer notifications unchanged.
- **Config:** `SMSOFFICE_KEY`/`SMSOFFICE_SENDER` documented in `.env.example` (old Twilio config removed).

**To activate in production:** create an SMSOffice.ge account, register "Kere" as the sender, and set `SMSOFFICE_KEY` (+ `SMSOFFICE_SENDER=Kere`) on Railway. Until then SMS is logged, not delivered.

### [2026-07-22] Convention: Marketplace/ProductCustomization action buttons → `<Button>`

**What was done:** Converted the raw hand-styled `<button>` action buttons in `ProductCustomization` (size pills, quantity steppers, Customize CTA, Place Order, sign-in modal) and the two Marketplace product-card CTAs (Customize / Check Product) to the shared `<Button variant size>` component, per the project convention. Appearance preserved via `className` overrides. Color swatches and the tiny measurement help-icon stay raw — they're specialised controls, matching the app's own swatch pickers (FabricPicker/ColorDotPicker).

### [2026-07-22] Marketplace Customization: Customize CTA, Description Field, Reused Order/Chat Flow

**What was done:** Customizable marketplace products now route customers through a dedicated customization page (description + size + measurements); everything else (tailor accept/decline, live chat) reuses the existing order flow.

- **Gate on `is_customizable`:** Marketplace cards for customizable products show a "Customizable" badge and a **Customize** button → `/product/:id/customize`; non-customizable products keep "Check the product" and order as-is.
- **Dedicated customize page:** new `/product/:id/customize` route renders `ProductCustomization` with a `customize` prop. In that mode it adds a "Describe your customization" textarea (max 1000) plus the existing size + optional measurements; the plain `/product/:id` view drops those and shows a "Customize this product" button when the flag is set. The customization note only sends in customize mode.
- **Backend:** `order_items.customization_note` (migration `2026_07_21_000001`, `OrderItem` fillable). `storeMarketplaceOrder` validates `customization_note` (max 1000) and only stores it when the product is customizable. Surfaced in `formatOrder` (tailor) and `CustomerOrderController::index` (customer) item payloads; login-redirect thaw carries it via `PendingMarketplaceOrder.customizationNote`.
- **Display:** the note renders in the tailor's `OrdersList` order detail (new `tailorComponents.customizationNote` key) and the customer's dashboard order modal, both locales.
- **No new work needed for accept/decline or chat** — verified end-to-end: order arrives `pending`, tailor Accept (→ processing) / Cancel already exist, and `OrderChat` already renders per order for both sides. API round-trip confirmed: note saves, returns to both dashboards, and the tailor accept transition works.

### [2026-07-20] Visitor Analytics: Microsoft Clarity Behind a Consent Gate

**What was done:** Consent-gated Microsoft Clarity (heatmaps + session replay) to see where visitors go on the site.

- **Loader** (`resources/js/lib/analytics.ts`): injects the Clarity tag only after consent; reads project id from `VITE_CLARITY_PROJECT_ID` (build-time). No id → every function is a no-op, so dev/local builds never phone home. Consent stored in `localStorage` as `kere_analytics_consent` (granted/denied).
- **Consent banner** (`components/AnalyticsConsent.tsx`, mounted in `App.tsx` beside `RouterProvider`): wine-brand card fixed to the bottom, fade-up 0.5s, `<Button>` Accept/Decline, link to `/privacy`, both locales (`consent.*`). Shows once; Accept injects Clarity, Decline remembers refusal; hidden entirely when analytics isn't configured or a choice was already made.
- **Privacy page:** section 7 renamed "Cookies & Analytics" and expanded to disclose Clarity, form-text masking, and how to decline (replaces the now-inaccurate "we do not use tracking cookies" line); EN + KA.
- **Config:** `VITE_CLARITY_PROJECT_ID` documented in `.env.example` — must be set in Railway before the production build for Vite to inline it. SPA route changes and per-URL heatmaps are handled by Clarity natively (no manual pageview wiring).

### [2026-07-19] Customizer: Colour Variants Inside Styles + Slug-less Product Creation

**What was done:** Colours are now variants *of a style* instead of separate styles or a separate option group — one style can carry any number of colours, each with its own photos.

- **Data model:** new `layer_option_colors` table (migration `2026_07_19_000004`): `layer_option_id`, `name`, `color_hex`, front + back/left/right image paths, `is_default`, `display_order`. `LayerOption::colors()`; colours ride along in `LayerOptionResource`.
- **Admin:** each style card has a **Colours** section — list of variants (dot, name, Front/Back/Left/Right upload slots, delete) and an Add Colour form (dot colour picker, name, front photo). CRUD via `POST /admin/customizer/options/{id}/colors`, `PUT/DELETE /admin/customizer/options/colors/{id}`. First colour becomes default; deleting the default promotes the next. The per-style "Dot colour" control was removed (superseded).
- **Customer:** `useCustomizer` tracks `colorSelections` (option id → colour id, included in `DesignConfiguration.color_selections`); the right column shows a colour-dot card for the selected style's variants; `PreviewCanvas` renders the chosen colour's photos and rotation views come from the colour row. The old "all-options-colour-tagged category renders as dots" path was removed.
- **Products:** the admin New Product form no longer asks for a slug — the backend generates a unique one from the name (`storeProduct`).
- **Seeder:** `SleevelessTankSeeder` restructured — one "Sleeveless" style carrying 9 colour variants (White has the 4 views); it deletes the legacy per-product Color category on re-run.

### [2026-07-19] QA Fix Pass: Throttle Buckets, Suspended-Tailor Guard, Silent Failures

**What was done:** Fixes for the QA findings on the offer-pool and customizer batches.

- **Throttle collision (MAJOR):** all inline `throttle:X,1` groups shared one per-user counter, so OrderChat's 4s message polling starved the 10/min write bucket — "Choose This Tailor" 429'd at normal reading pace. Each group now has its own bucket via the throttle prefix parameter (`throttle:60,1,api-reads`, `throttle:10,1,api-writes`, `api-customizer`, `api-admin`) in `routes/api.php`.
- **Suspended-tailor hire (MAJOR):** `CustomerOrderController::chooseTailor` now re-checks the offering tailor's eligibility (`approval_status` approved/null and not `is_suspended`) and returns 409, matching the manual-selection path.
- **Silent failures:** `AvailableDesigns.tsx` shows a destructive error state with a Retry button on load failure (new `tailorComponents.openDesignsLoadFailed/openDesignsRetry` keys, both locales). `CustomizerAdminPage` view-image uploads and dot-colour saves check `res.ok` and surface the server message.
- **Cosmetics:** pool-card measurement chips use translated `orderReview.size_*` labels and no longer capitalize the cm unit; customer stat tile "Pending" now includes `pending_assignment` orders.

### [2026-07-19] Customizer: Colour Dots, Rotation Views, Selector-Only Groups + Sleeveless Tank

**What was done:** Three engine extensions to the 2D customizer, plus the first product built on them.

- **Rotation views:** `layer_options` gained nullable `back/left/right_image_path` (migration `2026_07_19_000001`). `PreviewCanvas` takes a `view` prop; `ViewSwitcher` (right column card) cycles Front/Back/Left/Right and renders only when every painted layer has the angle — switching to an option without it snaps back to front. Admin: per-style "Rotation views" upload slots (proper `_method=PUT` spoofing).
- **Colour dots:** `layer_options.color_hex` (migration `2026_07_19_000002`). When every option in a category is colour-tagged (and childless), the category renders as `ColorDotPicker` swatches in the right column instead of image thumbnails; the option panel hides when empty. Admin: "Dot colour" picker + remove per style.
- **Selector-only groups:** `layer_categories.is_preview_layer` (migration `2026_07_19_000003`, default true). When false, the category shows as picker cards but paints no canvas layer — needed for photo-swap products where the "style" card would otherwise stack over the colour photo. Single-option categories now display in the panel.
- **Sleeveless Tank** (`SleevelessTankSeeder`, re-runnable): ₾90, category shirt, "Style your own" (selector-only, 1 style) + 9 colour options from `public/assets/garments/shirts/` (public-asset paths supported by the resources); White carries the 4 rotation views. Preview renders images at natural size (`object-scale-down`, `object-[center_25%]`, viewport-capped canvas) because the source photos are ~220×400.

### [2026-07-19] Landing Polish: Nav Bar Surface, Fonts, Carousel Click Fix, How-It-Works Section

**What was done:** Post-redesign fixes on Mariam's landing.

- **How It Works:** standalone `/how-it-works` page deleted (route + page + page-only locale keys); new `HowItWorksSection` on the landing (4 steps, `howItWorks.s1–s4` keys, her design language) with `id="how-it-works"`; navbar/burger/footer links scroll to it like FAQ.
- **Hero carousel:** `HeroSection` now pulls real marketplace products (`/api/products`, ≥4 with images required) into the rotating gallery as clickable product links; her poster images remain the fallback.
- **Navbar:** burger button hidden ≥lg (drawer breakpoint aligned from md to lg — it never opened on tablets); "Start Designing" link removed; language toggle vertically centred; header is now a frosted ivory surface (`rgba(251,248,240,.9)` + blur + hairline border) with always-dark text — replaces the transparent bar + scroll tone-flipping.
- **Fonts:** per-script stacks — `Newsreader, Noto Serif Georgian` / `Instrument Sans, Noto Sans Georgian` in the theme and all landing CSS; Latin gets the editorial faces, Georgian keeps Noto. Poppins dropped (footer logo now `font-serif`); Google Fonts moved from CSS `@import` to the blade `<link>`.
- **Marketplace carousel:** cards were unclickable — `setPointerCapture` on pointerdown retargeted every click to the strip. Drag mode (and capture) now starts only after 6px of movement; clean clicks navigate to `/product/{id}`.

---

### [2026-07-13] Upload-Design Measurements + Open Order Pool with Tailor Offers

**What was done:** The upload-your-design step now collects measurements and an explicit customization request; custom orders without a hand-picked tailor go to an open pool where every approved tailor is notified, can send an offer, and the customer picks the winner from her dashboard.

**Upload step (`DesignerApp.tsx` UploadPanel):** Four optional cm measurement inputs (chest, waist, hips, length — validated to ≤999 with one decimal, matching backend `measurements.*` rules), a "I want to customize this design" checkbox that reveals a 1000-char request textarea, and the additional-information box shrunk to 2 rows. All persisted via `useCustomOrderDraft` (`measurements`, `customization_request`) and submitted inside `custom_design_data`.

**Order creation (`OrderController::storeCustomOrder`):** Manual tailor selection still assigns directly. Any other path (formerly "Let Kere Choose" auto-match — `matchTailorForGarment()` removed) now sets `status = pending_assignment` with `tailor_id = null` and creates an `open_order` KereNotification for every approved, non-suspended tailor. `custom_design_data.customization_request` accepted (max 1000).

**Offer flow:**
- `GET /api/tailor/open-orders` — pool of unassigned custom orders with design data, `requests_count`, and the caller's `my_request_status`.
- `POST /api/tailor/orders/{id}/request` — creates a `TailorRequest` (optional 500-char message; unique per order+tailor, 409 on duplicate or closed order). Customer gets an in-app `tailor_request` notification plus a `TailorRequestReceived` email (SMS fallback when no email).
- `GET /api/customer/orders/{orderId}/requests` — offers with tailor profile + weighted product-review rating.
- `POST /api/customer/orders/{orderId}/choose-tailor` — transactionally assigns the tailor, sets order `pending`, marks the offer `accepted` and the rest `declined`; chosen tailor gets `request_accepted` notification + `NewOrderAlert` email (SMS fallback), declined tailors get `request_declined`.

**Dashboards:** `TailorDashboard` renders a new `AvailableDesigns` card (design preview, measurements, customization request, offer form with message). `CustomerDashboard` shows an "Awaiting Offers" status badge and offers-count chip on `pending_assignment` orders; the order modal lists offers (`TailorOffers`) with a Choose button and now also renders the upload-shape design data (`garment_type`, image, measurements, customization request, notes) — as does the tailor's `OrdersList` modal.

**Migration:** `2026_07_12_120000_create_tailor_requests_table.php` (`order_id`, `tailor_id`, `message`, `status`, unique `[order_id, tailor_id]`).

**Where the logic is:**
- `app/Http/Controllers/Api/OrderController.php` — pool creation + broadcast, `openOrders()`, `requestOrder()`
- `app/Http/Controllers/Api/CustomerOrderController.php` — `requests()`, `chooseTailor()`, `tailor_requests_count` in `index()`
- `app/Models/TailorRequest.php`, `Order::tailorRequests()`
- `app/Mail/TailorRequestReceived.php` + `resources/views/emails/tailor-request-received.blade.php`
- `resources/js/components/tailor/AvailableDesigns.tsx` — pool UI
- `resources/js/pages/CustomerDashboard.tsx` — `TailorOffers`, status badge, chip
- `resources/js/pages/DesignerApp.tsx`, `OrderReview.tsx`, `hooks/useCustomOrderDraft.ts` — new draft fields
- i18n: new keys in `design`, `orderReview`, `customerDashboard`, `tailorComponents`; `tailorSelect.letKereChoose*` copy now describes the offers flow

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

**Fix:** Installed `resend/resend-laravel` package which uses Resend's HTTP API (port 443, never blocked). Set `MAIL_MAILER=resend` and `RESEND_KEY` in Railway env vars.

**Domain:** `kereforyou.com` registered on Cloudflare Registrar. Connected to Railway via one-click Cloudflare DNS integration. Domain verified on Resend — `MAIL_FROM_ADDRESS=noreply@kereforyou.com`.

**Where the logic is:**
- `composer.json` / `composer.lock` — `resend/resend-laravel` package
- `config/mail.php` — `resend` mailer already defined (Laravel built-in)
- Railway env vars: `MAIL_MAILER=resend`, `RESEND_KEY`, `MAIL_FROM_ADDRESS=noreply@kereforyou.com`
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

### 2026-07-12 — Auth Form Error Messages Now Red

Error messages on login and registration rendered in grey (`text-slate-600` / `border-slate-400` / slate banners) and were barely distinguishable from helper text. All auth-flow error states now use the theme's `--color-destructive` red token (first consumer of it): `text-destructive` for messages, `border-destructive` for invalid inputs, `bg-destructive/10 border-destructive/30` for general-error banners.

- `Login.tsx` — general banner + email/password field errors and borders.
- `RegisterCustomer.tsx` — general banner (form + OTP verify step), all field errors, OTP digit boxes' error state.
- `RegisterTailor.tsx` — general banner + all field errors and borders.
- `AdminLogin.tsx` — error banner (red on dark background).
- `PhoneInput.tsx` — error border on both the country selector and the number input.

Verified in the browser (headless Chrome): empty-submit field errors and wrong-credential banners render `rgb(239, 68, 68)` on both login and register pages; Georgian i18n strings intact.

**Follow-up (same day): full-app sweep.** Every remaining grey error message was converted to the same destructive treatment:

- `ErrorFallback.tsx` — shared fetch-error component (used by Marketplace and others).
- `DesignerApp.tsx` — upload-error banner + products fetch error.
- `CustomizePage.tsx` — load-error / product-not-found message.
- `TailorSelectStep.tsx`, `MyDesignsPage.tsx`, `OrderReview.tsx`, `ProductCustomization.tsx` — fetch/submit/order errors.
- Modals: `AddProductModal`, `EmailSupportModal`, `ReviewModal`, `SaveDesignModal`, FAQ newsletter error.
- `TailorProfileEditor.tsx` (upload + save errors), `StatsCards.tsx` (stats fetch), `OrderChat.tsx` (load error, icon at `text-destructive/40`).

Deliberately left grey: the measurement out-of-range *warnings* in `DesignCanvas.tsx` / `ProductCustomization.tsx` — they are non-blocking hints, not errors. Verified in browser: `/customize/<bogus-slug>` not-found and Marketplace fetch-failure (API route aborted) both render red.

### 2026-07-12 — Phone-Only Tailor Registration & Phone Login

Many prospective tailors don't have email addresses. Tailors can now register with just a phone number; email is optional. All users can log in with email **or** phone.

**Database** (`2026_07_12_000001_...`): `users.email` nullable, `users.phone` unique (existing duplicates cleared, keeping the oldest account), `verifications.email` nullable, `verifications.phone_attempts` added.

**Backend:**
- `SmsService` (`app/Services/SmsService.php`) — generic SMS sender extracted from `OtpService`'s Twilio logic; logs the message when Twilio is unconfigured (dev). Single swap point if we move to a local Georgian gateway (smsoffice.ge etc.) later.
- `POST /api/register/initiate` — email now `required_if:role,customer`; phone must be unique and `+<digits>` format. Without email, the OTP is sent by SMS and the response carries `channel: "phone"` with a masked number.
- `POST /api/register/verify-phone` — no longer requires prior email verification for email-less registrations; now enforces the same 5-attempt limit as the email step (previously unlimited — closed brute-force gap).
- `POST /api/login` — `login` field accepts email or phone (tolerant of spacing and missing +995 prefix); legacy `email` field still accepted. Generic 401 message.
- Legacy unverified `POST /api/register` removed — tailors previously registered with **no verification at all**; they now verify via OTP like customers.
- SMS fallback (Georgian) when a tailor has no email: approval, rejection (with reason), and new-order alerts.

**Frontend:**
- `OtpStep` extracted from RegisterCustomer into `components/OtpStep.tsx` (shared).
- RegisterTailor: email marked optional, initiate flow, then SMS-OTP (or email-OTP if email given) step, then the pending-approval screen.
- Login: single "Email or phone number" field; localized invalid-credentials message on 401.
- Admin dashboard + EmailSupportModal fall back to phone where email is null; `AuthUser.email/phone` typed nullable.

**Verified** (headless Chrome + API): phone-only tailor registration end-to-end with OTP read from the SMS log; login by phone in local 9-digit format; customer email-OTP flow; login by email; duplicate phone rejected; wrong password 401; Georgian approval SMS logged for an email-less tailor.

**Before production:** set `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` on Railway (the SDK is already in composer.json) — until then SMS goes to the log only, so phone-only registration cannot complete in prod.

### 2026-07-23 — Men / Women Sections

Split the shopping experience by gender. On entering the marketplace, custom design, or upload flow, a first-time shopper is asked to pick a section (Men or Women); the choice is remembered and switchable, so returning shoppers skip the prompt. Each section shows only its own products plus anything tagged unisex.

**Database:**
- `2026_07_23_000001_...` — `products.gender` (`men` | `women` | `unisex`, default `unisex`, indexed).
- `2026_07_23_000002_...` — `customizer_products.gender` (same). Existing rows default to `unisex` so nothing disappears before re-tagging.

**Backend:**
- `GET /api/products` and `GET /api/customizer/products` accept `?gender=men|women` → `whereIn('gender', [gender, 'unisex'])`. Any other/absent value returns everything (admin/unfiltered).
- `ProductController::store/update` validate `gender` (`in:men,women,unisex`) and persist it; `formatProduct` returns it. `CustomizerAdminController::store/updateProduct` validate + persist; `CustomizerProductResource` exposes it.

**Frontend:**
- `hooks/useSection.ts` — the shopper's section (`men`/`women`) remembered **per flow**: `kere_section_market`, `kere_section_design`, and `kere_section_upload`. Each is independent (picking men in the marketplace does not carry into the design studio). The `upload` scope only applies when the upload flow is launched straight from the home page (`/design?upload=1`); reaching upload from inside the design flow reuses the `design` memory. Carried in the URL as `?gender=`; `scopeForPath()` maps a target path (including the `upload=1` query) to its scope.
- `pages/SectionSelect.tsx` (`/section?next=…`) — branded interstitial; sets the section and bounces to `next` with `?gender=`. The two cards are self-contained editorial tiles (wine radial for women, warm charcoal for men, serif labels + inset frame) needing no image asset; a real photo dropped at `/assets/sections/{men,women}.jpg` layers on top automatically.
- `Marketplace` and `DesignerApp` resolve the section from URL → storage, redirect to `/section` if unset, filter their API calls, and each expose a Men/Women switch (marketplace header; a "Shopping for" pill on the design page) so a remembered choice is always visible and changeable. Entry links are not individually rewritten — the pages self-guard, so every existing `/marketplace` and `/design` link funnels first-timers through the chooser.
- Product forms gained a section selector: tailor `AddProductModal` (Women/Men/Both, defaults to Both/unisex to match the column default) and admin `CustomizerAdminPage` (create form + per-product inline edit).

**Verified** (API + build): `?gender=men` returns men + unisex and excludes women (and vice-versa); no-gender returns all; customizer endpoint filters identically; migrations apply on SQLite; `tsc` clean for all touched files; `vite build` passes. Not yet driven in a browser — the section-select page and header switch should get a visual pass.

### 2026-07-23 — Landing Georgian Copy Pass + 6-Step How-It-Works

Applied a batch of Georgian copy corrections to the landing page (from `corections (1).docx`):
- **How it works** (`howItWorks`): heading → "როგორ მუშაობს Kere?", description trimmed to "დიზაინის არჩევიდან მზა ტანსაცმლამდე.", and the section **expanded from 4 to 6 steps** with new copy (discover → customize → measurements → order → tailor creates → receive) plus a closing line "შენ ირჩევ. მკერავი ქმნის. Kere გაკავშირებთ." `HowItWorksSection.tsx` now renders 6 steps in a 3-col / 2-row grid (icons: Search, Palette, Ruler, ClipboardCheck, Scissors, Package) with a centered closing statement. New keys `s5*/s6*/closing` added to **both** locales (EN steps re-translated to keep the 6-step flow coherent, since the component is shared).
- **CTA** (`cta`, ka only): title → "შენი იდეა — ქართველი მკერავის ხელით შექმნილი", subtitle rewritten.
- **Reviews** (`guarantee.subtitle`, ka only): → "კერეს მომხმარებელთა შეფასებები".

Note: per the request ("Georgian texts"), the EN `cta`/`guarantee` strings were left unchanged, so they now differ in wording from the updated Georgian — revisit if EN parity is wanted. Verified in headless Chrome (KA): all four sections render correctly, 6-step grid + closing line land as intended. Build + typecheck clean.

### 2026-07-23 — Fix hero/marketplace image flash on load

The landing hero gallery (and the marketplace strip below it) rendered the local fallback images immediately, then hard-swapped to real products once `/api/products` resolved (~300ms) — a visible bait-and-switch on every load/refresh, made more noticeable by the hero's 40s marquee. Fixed by gating on a decided state: `productImages`/`products` start as `null` and the gallery is held at `opacity: 0` (space reserved, no layout jump) until the fetch settles, then fades in once with the final image set. Fallback now shows only when it *is* the decided set (no products with images / fetch error). Verified in-browser: fallback opacity stays 0 until content is already the real set, then fades 0→1.

### 2026-07-23 — Mobile navbar + touch/drag interactions

Mobile UX pass on the landing:
- **Navbar (mobile):** language toggle moved into the always-visible top navbar (was buried in the drawer); the drawer's redundant copy was removed (its sign-in CTA now shows for logged-out visitors only). The "for tailors" and "sign in"/account links are all gated to `lg` (matching the burger's `lg:hidden`), so they appear together on desktop and disappear together the moment the burger shows — previously they used `md`/`sm` and lingered at tablet widths.
- **Drawer menu:** switched from a single column to a 2-column grid with soft dividers (bottom line on every item + a vertical line between the columns) so each entry reads distinctly; item type scales for the narrower cells.
- **Marketplace carousel:** was `touch-action: pan-y`, which blocked horizontal finger scrolling on phones. Now `touch-action: auto` for native horizontal touch scroll, and the click-drag handler is gated to `pointerType === 'mouse'` so touch and mouse never fight — finger-swipe on phone, click-drag on desktop.
- **Hero gallery:** replaced the CSS `@keyframes` marquee (paused via `:hover`, which stuck on mobile) with a rAF-driven transform. It auto-slides, **pauses while pressed and resumes the instant you release**, and is draggable left/right by finger (touch, `touch-action: pan-y` so vertical page scroll still works) or mouse (hold + drag). Respects `prefers-reduced-motion` (no auto-advance, drag still works); a post-drag click is swallowed so dragging never navigates. Verified in-browser: auto-slide moves, press freezes it, a drag translates it, release resumes.

### 2026-07-23 — Men-section garment filtering + stale-user fix

- **No women's garments in the men's section:** the custom-design category picker (`DesignerApp`) now hides `dress` and `skirt` when the section is `men` (women still see all six), and the marketplace category filter hides the `dresses` category for men. Products themselves were already gender-filtered server-side; this covers the *options*.
- **Stale signed-out user:** `getAuthUser()` returned the `localStorage` user even after the `sessionStorage` token had cleared (tab close), so a leftover user (e.g. a QA account) showed as signed in across the app. `getAuthUser()` now returns `null` when there's no session token — fixes the marketplace navbar and every other consumer at the source.

### 2026-07-24 — Men-section filter symmetry (skirts)

- **Marketplace/design-studio parity:** the design studio hid both `dress` *and* `skirt` garment keys for men, but the marketplace's women-only category list only had `dresses`. Added `skirts` to `WOMEN_ONLY_CATEGORY_SLUGS` so the two surfaces stay in sync — no live bug today (no `skirts` category exists yet), but prevents men from seeing a skirts category in the marketplace while the studio hides it, if one is ever added. Found in QA (asymmetric hardcoded lists).

### 2026-07-24 — Size options gated on customization ("individual order")

- **Sizes only for individual orders:** size selection now appears only when a product's "Allow Customization" (`is_customizable`) toggle is on. In the tailor `AddProductModal`, the *Available Sizes* block is gated on the toggle and sits directly beneath it (cause and effect adjacent); on the customer product page (`ProductCustomization`), the size picker is hidden unless the product is customizable *and* has sizes. When hidden, the order submits `size: null` (nullable server-side; `SpecRow` skips empty values) so a non-individual order never carries a phantom standard size into the tailor's order view. Reused the existing toggle — no new field/migration.
- **Invariant enforced on write, not just read:** saving a product with customization off now persists `sizes: []` rather than leaving stale chips selected, so stored data can't contradict the "sizes belong only to customizable products" rule.

### 2026-07-24 — Marketplace carousel centers on mobile

- **Products snap to center on phones:** the landing `MarketplaceCarousel` cards used `snap-start`, so on mobile a card snapped flush-left and the next product's lopsided sliver showed on the right. Cards now `snap-center` below `sm`, and the strip goes full-bleed with an 11vw inset (78vw card + 11vw each side = 100vw) so every card — including the first and last — rests dead-center with a small symmetric peek. Tablet/desktop (2-up `sm`, 4-up `lg`) keep the original left-aligned layout.

### 2026-08-07 — Men's garment card previews fit + colored defaults

- **Preview pictures fit the card:** the custom-design product card (`DesignerApp`) rendered previews with `object-cover` in an `aspect-[4/3]` box, which cropped the portrait trouser shots (heads/feet cut off). Switched to `object-contain` on an `#EAE6E4` panel — sampled from the product photos' own studio background — so the whole garment shows regardless of shot aspect and the letterbox space blends seamlessly into the shot instead of framing it as a lighter rectangle. The image box is also aspect-aware: `trousers` products use a portrait `aspect-[3/4]` box (the shots are tall/narrow, so a landscape box left wide empty margins), everything else keeps `aspect-[4/3]`. Verified in-browser across the men's shirt and trouser grids.
- **No more all-white default previews:** every men's garment (`MensGarmentsSeeder`) previously used `white-front.png` for both its card preview and its opening customizer view, which looked flat on the grid. Each garment's colour list now *leads* with a hero colour — Elbow/Short-Sleeve shirts → Navy, Chino/Cargo → Olive, Corduroy → Khaki, Dress → Charcoal — which becomes the default swatch, the card preview, and the base image (all derived from `$colorSlugs[0]` instead of a hardcoded white path). White stays selectable, just no longer the face of each product. Verified end-to-end: API serves the colored `preview_image_url`, images resolve 200, and the customizer opens on the colored default.

### 2026-08-07 — New KERE wordmark on tab + link previews

- **Favicon and social share card refreshed:** replaced the browser-tab icon (`public/favicon.jpg`) and the Open Graph / Twitter share image (`public/assets/og-image.jpg`, referenced in `app.blade.php`) with the new KERE wordmark on the wine brand background. The favicon is the clean `KERE` mark cropped to a 256×256 square; the share card is a purpose-built **1200×630** landscape (matching the declared `og:image` dimensions) with the tagline logo (`KERE — DESIGN IT, WEAR IT, OWN IT.`) centered on a flat wine canvas whose colour was sampled from the source logo (`rgb(99,32,39)`) so there's no seam. Both filenames were kept, so no markup changed and no scraper-cache churn beyond a re-scrape. The in-app brand logo (`assets/brand/kere-logo.png`, used in `MarketplaceCarousel`) was already byte-identical to the new plain mark, so it needed no update.

### 2026-08-07 — Share card + favicon refinements

- **Bigger wordmark on the share card:** the `KERE` mark on `og-image.jpg` read small and distant in link previews (~27% of the card width). Rebuilt the 1200×630 card from the source tagline logo (`Logos/kere.png`) with the wordmark scaled to **~58% width** on a seamless `rgb(99,32,39)` canvas (briefly tried 70%, dialled back to 58% for breathing room).
- **Circular favicon:** swapped the square JPEG favicon for a 256×256 **PNG with a full circular mask** built from the plain KERE mark, shrunk to leave padding so the wide `K`/`E` don't clip at the circle edge. Icon link tags point at `/favicon.png?v=3` (browsers cache favicons hard).
- **Mobile link-preview fix:** the card rendered on desktop chats but not on some phones — the messaging platform's per-URL preview cache had stored an image-less scrape. Hardened the tags with `og:image:secure_url` and `og:image:type` (`image/jpeg`) for stricter mobile scrapers, and bumped the `og:image` URL to `?v=3` to force fresh scrapes. (A cached bare-URL preview still needs a query-string cache-bust or the platform's debugger to refresh.)

### 2026-08-07 — Retire the legacy photo-composite customizer products

- **Removed the three original customizer products** — Classic Shirt (`classic-shirt`), Woman Shirt (`woman-shirt`) and Woman's Top / maika (`womens-top`). These were the first-generation garments built from loose photo composites (`maxi-base.png`, `necklines_*`, `sleeves_long+*`, `Colar1.jpg`, `colar 2.jpg`, the `maika *` set), and they're superseded by the men's garment line + Sleeveless Tank. The ~23 source images under `public/assets/garments/` were deleted, which would have left the seeded products rendering broken 404 previews.
- **Full cleanup, not just a seeder edit:** `CustomizerSeeder` only ever created these three products, so it was deleted outright (and dropped from `DatabaseSeeder`) rather than left as dead code. A data migration (`2026_08_07_000001_retire_legacy_customizer_products`) deletes the three products by slug from **existing** databases (local SQLite + Railway Postgres), since removing the seeder alone would leave the already-seeded rows stranded. `layer_categories`, `layer_options`, `fabrics` and `saved_designs` all cascade on `customizer_product_id`, so the whole tree is cleared. Orders keep `garment_type` as a string snapshot, so historical orders and their i18n label maps (`AvailableDesigns`, `OrderReview`) are untouched.
- **Verified:** migration ran clean, the three slugs are gone from the DB, the remaining catalog (men's line, Sleeveless Tank, demo products) is intact, and a scan of every remaining `LayerOption` found **zero** references to the deleted images.

### 2026-08-07 — Fix Marketplace dead space above the product grid

- **Root cause:** the desktop filter sidebar (category + price, ~220px tall) shared a single grid row with the search bar (`grid lg:grid-cols-[230px_1fr_auto_auto]`), and the product grid was a *separate* block below it nudged rightward with `lg:ml-[245px]`. Because the row stretched to the sidebar's height, the products couldn't rise up beside it — they began below the full sidebar, leaving a large empty rectangle to the right of the sidebar and under the search bar.
- **Fix:** restructured into a real two-column layout (`lg:grid-cols-[230px_1fr]`) — sidebar in the left column, and a right column that stacks the search/sort row, active-filter chips, result count and product grid so they flow from the top directly under the search bar. Removed the fragile `ml-[245px]` / `pl-[245px]` magic-number offsets that the old sibling layout depended on. Mobile is unchanged (sidebar stays `hidden lg:block`; the search row keeps its stacked-below-`lg` behaviour).

### 2026-08-07 — Taller hero gallery band

- **Landing hero curved carousel was too short.** The garment images in the hero arc (`.kere-gallery` / `.kere-gallery-image` in `app.css`) showed only a thin horizontal strip because the white curve masks (`kere-ellipse-top`/`bottom`) each intrude a fixed ~95px over the top and bottom, and the gallery was only `clamp(330px, 42vh, 430px)` tall — leaving a visible band of ~200px. Raised the desktop gallery height and image height to `clamp(430px, 52vh, 540px)`, growing the visible band to ~240–350px (~60% taller) while keeping the same curve. Tablet/mobile (`max-width:991px`/`640px`) values are untouched.

### 2026-08-07 — Normalize customizer-product slugs + admin slug guard

- **Bad slugs fixed:** two admin-created products had raw slugs (`Red Shirt`, `Tank-Top`) because `CustomizerAdminController::createProduct` only ran `Str::slug` when *no* slug was supplied — a hand-typed slug was stored verbatim, and `updateProduct` applied it unmodified too. Spaces/capitals in a slug are fragile in URLs.
- **Guard added:** the supplied slug now always flows through `uniqueProductSlug()` (which slugifies **and** de-duplicates with `-2`, `-3`, …) on both create and update; `uniqueProductSlug` gained an `$ignoreId` param so an update doesn't collide with the product's own row.
- **Existing rows normalized:** a data migration (`2026_08_07_000002_normalize_customizer_product_slugs`) re-slugs any non-normalized slug (`Red Shirt` → `red-shirt`, `Tank-Top` → `tank-top`, local `witeli maika` → `witeli-maika`), skipping already-clean ones and guarding against collisions. `saved_designs` reference the product by id and orders keep a `garment_type` string snapshot, so the change is safe.
- **Marketplace products audited too:** the `products` table needs no guard — `ProductController::store` always machine-generates the slug (`Str::slug(name) . '-' . random`) and `update` doesn't accept a `slug`, so raw input can't get in, and the column isn't used for routing (products link by id). Lowercased the random suffix (`Str::lower(Str::random(6))`) so new slugs are fully lowercase; existing rows left as-is since nothing reads the column by URL.

### 2026-08-07 — SEO: real 404 for deleted products + working favicon.ico

- **Soft-404 on deleted product pages fixed.** `/product/{id}` is an SPA route, so the catch-all served the app shell with **HTTP 200** even for a deleted product — the page renders "product not found" but crawlers see a 200 and keep the stale URL indexed (a Google result linked to exactly such a dead product page). Added a `routes/web.php` route (before the catch-all) that serves the same app shell but with a **404 status** when `Product::whereKey($id)` doesn't exist, so search engines drop gone products. Live products still return 200. The dynamic `sitemap.xml` already lists only existing products, so this only affects previously-indexed URLs.
- **favicon.ico was 0 bytes.** `public/favicon.ico` was an empty placeholder, and Google's search-result favicon crawler prefers `/favicon.ico` — so it stayed on an old cached logo. Generated a real multi-size (16/32/48) `favicon.ico` from the circular KERE mark, and updated the head to declare `favicon.ico` (`sizes="any"`) alongside the PNG + an `apple-touch-icon`, bumped to `?v=4`. (Google refreshes search favicons on its own recrawl cadence — days to weeks — so the result thumbnail updates once it recrawls.)

### 2026-08-07 — Mobile hero action buttons stack full-width

- On phones (`max-width:640px`) the two primary hero buttons were forced to `width:50%` at `font-size:10px`, so the longer Georgian label ("შექმენი შენი დიზაინი") wrapped to two lines and sat unbalanced next to its sibling. Switched `.kere-actions-row` to `flex-direction:column` with full-width buttons (matching the remodel button), single-line labels, and bumped the button to `min-height:44px` / `font-size:12px` / `16px` icons for a proper touch target and legibility.
- **Orphaned dot in FeaturesSection on mobile:** the decorative dot in the "Kere-ს გარანტია" card footer sits at the right end of the subtitle row on desktop (`sm:flex-row sm:justify-between`), but on mobile the row is `flex-col`, dropping the dot below the text as a stray bottom-left circle. Hid it on mobile (`hidden sm:block`) since it only reads as an accent in the horizontal layout.
- **Dead gap below the hero on tall phones:** the mobile hero forced `min-height: calc(100vh - 40px)` with `align-items: flex-start`, so on tall devices (e.g. iPhone 16 Pro Max, 956px) the leftover height dumped as a large empty gap between the action buttons and the marketplace section. Changed the mobile `.kere-hero` to `min-height: auto` so the hero hugs its content and the next section follows immediately (desktop/tablet full-height hero unchanged).
- **Removed the dead search bar from the mobile nav drawer:** the mobile menu opened with a `readOnly`, non-functional search input (placeholder only, went nowhere). Removed it (and its now-unused `Search` import) so the drawer opens straight to the nav links; nudged the nav's top margin to keep the spacing under the header.

### 2026-08-07 — Compress garment images (design/customizer load speed)

- **Garment preview/customizer images loaded slowly.** The `/design` category previews (and customizer layers) are the PNGs under `public/assets/garments/`. They were small in dimensions (~250×370) but hugely over-weight — 24-bit PNGs with no optimization, 90–670KB each (11.83MB total across 90 files). Recompressed every garment PNG in place with palette quantization (`sharp` `png({ palette: true, quality: 85 })`), preserving filenames, dimensions and per-image alpha — **11.83MB → 3.62MB (~69% smaller)** with no visible quality loss (verified the white-shirt worst case for banding). No code/reference changes since filenames are unchanged.
- Added `loading="lazy"` + `decoding="async"` to the `DesignerApp` preview `<img>` so off-screen category previews defer.
- **Note (infra, not code):** every garment asset was serving `cf-cache-status: EXPIRED` (Cloudflare's 4h TTL lapsing and re-hitting the `php artisan serve` origin). These files never change, so a Cloudflare Cache Rule setting a long/immutable edge TTL for `/assets/*` would keep them served from the edge — worth doing in the Cloudflare dashboard.

### 2026-08-07 — Compress the rest of the site's image assets

- **Swept every non-garment image under `public/`** (backgrounds, design-category cutouts, auth/partner art, hero, size-fit): downscaled anything over 2000px and recompressed (JPEG mozjpeg q80 / palette PNG q90), preserving filenames + per-image alpha → **23.5MB → 5.7MB (~76% smaller)** across 32 files. Worst offender: `guarantee-texture.jpg` was a **5159×6878 (35MP) 12.4MB** background → **746KB**.
- **Upload-card background** (`DesignerApp` "ჩემი ესკიზის ატვირთვა"): the `gold-upload-bg` was a 2.7MB photographic PNG with no transparency. Converted to a downscaled JPEG (`gold-upload-bg.jpg`, **148KB**, 95% smaller) and updated its single `bg-[url(...)]` reference; removed the PNG. (Favicon, og-image and source logos were deliberately excluded from the sweep.)

### 2026-08-20 — Women's designer: 8 categories, 17 Tops garments, attribute drill-down

- **The women's design studio was three demo garments deep.** Expanded it into a real taxonomy without adding a parallel architecture: the existing `Section → Category → CustomizerProduct → LayerCategory → LayerOption` chain already models `Category → Garment → Attribute → Option`, so the work was mostly data plus a navigation level.
- **`resources/js/data/garmentTaxonomy.ts` (new)** — the category level, per section. Women get the eight headings (Tops, Bottoms, Skirts, Dresses, Evening & Formal Dresses, Jumpsuits & Playsuits, Suits & Sets, Blazers & Jackets); men keep their four, unchanged. Each entry carries `productCategories` (which `customizer_products.category` values file under it — so regrouping never orphans a catalogued garment: the women's "Tops" covers both `tops` and the legacy `shirt`, "Blazers & Jackets" covers `blazers`/`jacket`/`coat`) and `orderKey` (what lands in `draft.garment_type`, kept on the established keys so tailor matching and the order-review label are untouched).
- **`WomensTopsSeeder` (new)** — 17 Tops garments × 5 attributes (Fit, Length, Neckline, Back Design, Sleeves) = 85 layer categories and 527 options. Attributes are declared once and applied to every garment; a garment narrows one with `only`/`except`, so a Tank Top offers only Sleeveless, a Crop Top only Cropped, a Hoodie only crew/V/high necklines. Adding a garment is one array row. Idempotent (`updateOrCreate`; tightened restrictions deactivate rather than delete, so saved designs stay resolvable).
- **Attribute layers are selector-only** (`is_preview_layer = false`) — they carry a label and a price, not artwork. `layer_options.image_path` is now nullable (migration + `LayerOptionResource` + TS types), `OptionSwatch` renders a text tile when an option has no photo, and `PreviewCanvas` skips layers with nothing to composite. Dropping real art in later turns the same option into a picture tile with no schema or code change.
- **Navigation gained a level.** `/design` now keeps the open category in the URL (`?cat=tops`), so browser back walks garment list → category grid and a link is shareable; an unknown or wrong-section key falls back to the grid instead of a blank screen. New `StudioBreadcrumb` (built on the existing `ui/breadcrumb` primitives, two tones for the paper and white palettes) shows Women › Tops on the garment list and Women › Tops › T-shirt in the customizer, rebuilt from the product so it survives a refresh or a direct link.
- **`OptionPanel` drills down at 3+ attributes.** A garment with five attributes and forty options now shows a list of what can be changed (with each current choice and its price) and opens one at a time, instead of one long scroll. Garments with one or two attributes — every existing men's product — render exactly as before. Option rendering was extracted to `CategoryOptions` so both modes share one implementation.
- **Customizer collapses the preview column** when a garment has no compositable layers, rather than reserving a tall empty canvas; the options take the full width.
- Both locales updated in sync (8 category labels, breadcrumb + drill-down chrome, two new order-review garment labels).
- **Only Tops is populated.** The other seven headings ship as navigable scaffolding — Skirts, Dresses and Blazers & Jackets each surface one legacy garment, and Bottoms, Evening & Formal Dresses, Jumpsuits & Playsuits and Suits & Sets are empty and show the designed empty state. Filling one is a seeder in the shape of `WomensTopsSeeder`, no UI work.
- **Verified in a real browser** (headless, 1440/768/375px, both locales): 8 categories → 20 Tops garments → T-shirt → 5 attributes → Puff sleeve (₾45 → ₾61); the choice survives closing and re-opening an attribute in the panel; Tank Top shows Sleeveless only; men's designer and the photo-composited chino trousers unchanged; no console errors, no broken images, no horizontal overflow. (An earlier revision of this entry claimed the choice also survived browser back/forward — it did not; see the QA round below.)
- **Known gap (pre-existing, now larger):** garment/attribute/option names come from the DB in English and are not translated, so the Georgian UI shows "Blouse", "Neckline", "Crew". This has always been true of customizer content (men's products included), but this change multiplies the surface. Fixing it properly means deciding whether DB catalogue content gets a translations table — flagged rather than patched with a parallel slug→i18n map.

### 2026-08-20 — QA round on the women's studio: real selection persistence, rollback fix, test row retired

- **Selections now survive leaving the garment.** QA found the previous entry overstated persistence: only the *category* persisted (via `?cat=`), while fit/length/neckline/back/sleeves reset to defaults on browser back/forward or reload — which the drill-down made worse, since a customer now makes five choices instead of one before stepping away. New `useCustomizerSelections.ts` (sessionStorage, plain functions, same shape as `useCustomOrderDraft`) stores selections **per product slug**, so comparing two garments keeps both configurations. `useCustomizer` takes an optional `persistKey`; without it the hook behaves exactly as before.
  - Restored ids are validated against the live option tree before use — reseeding the catalogue renumbers everything, so an unrecognised id falls back to that category's default instead of selecting nothing.
  - `Reset` clears the stored copy first, so it genuinely returns to a clean garment rather than immediately restoring.
- **`down()` on the nullable-`image_path` migration would have failed** — it restored `NOT NULL` while 527 selector-only rows held NULL (verified: `NOT NULL constraint failed` on a copy of the database). It now deletes the photo-less options first, which is the honest inverse: those rows could not exist under the old schema. Rollback and re-apply both verified on a database copy.
- **Retired the "red shirt" test row** (slug `witeli-maika`, description "agwera"). It was always customer-visible under the old "Shirt / Top" heading, but the Tops regrouping sat it beside the seeded catalogue where it read as a real product. Deactivated rather than deleted — it still has an uploaded preview and a layer, so one toggle in the customizer admin brings it back. Women's Tops is now 19 garments.
- Dropped a dead `parent_option_id` filter in `useCustomizer.buildDefaults` — the field is neither in the API resource nor the TS type (the relation already filters it server-side), so the filter was a no-op that also produced a standing type error.
- **Verified**: Puff sleeve survives back → forward and a hard reload; two garments hold independent configurations; `Reset` sticks across a revisit; injected stale ids fall back to defaults without breaking the page; men's chino trousers keep their canvas and now persist the chosen colour. Full suite re-run clean — 8 categories, all 17 Tops garments, both locales, 1440/768/375px, no console errors.

### 2026-08-21 — Women's T-shirt photography: 9 colours, 4 views, live preview

- **The women's T-shirt now has a real photo preview**, the same treatment as the men's line: a `style` layer (`is_preview_layer = true`) holding one "Classic" option whose nine colour variants each carry front/back/left/right shots. The canvas composites it, the colour dots swap it, and the view switcher rotates it — no new UI, the customizer already did all of this.
- **Assets normalised and compressed.** The source drop (`public/assets/garments/Woman T-shirts/`) used inconsistent filenames — `Brgnd`/`Burgundy`, `Ba`/`Back`, `Lf`/`Left`, `Classi`/`Classic` — but the leading number encodes the view reliably (01 front, 02 back, 03 three-quarter, 04 left, 05 right), so classification keys off that and matches the colour by token. Rewritten to the established `<colour>-<view>.png` convention under `WomanTshirtClassic/`, resized 1254→700px and palette-quantized like the earlier garment-compression pass: **44MB → 2.2MB across 36 files** (~25KB each, in line with the men's assets). Swatch hexes are sampled from the photographs themselves rather than eyeballed.
- **Seeder extended, not duplicated.** `WomensTopsSeeder` garments take an optional `photos` block (folder, style, colours, and the cut the shots `depicts`); `seedPhotoLayer` builds the layer. Photographing the Blouse or Hoodie next is one more block — no new seeder, no UI work. Attribute `display_order` shifted to 1–5 so the style layer sits at 0, above the tailoring spec.
- **Defaults pinned to what the camera shows.** All 45 images are one cut — body-fitting, cropped, crew neck, cap sleeve — in nine colours, so the T-shirt's Fit/Length/Neckline/Sleeves defaults now match it. Without this the page opened showing a cropped crew cap-sleeve photo while the spec panel claimed Regular / Waist-length / Short. Other garments keep the line-wide defaults.
  - Consequence: the T-shirt customizer opens at **₾49.00**, not ₾45.00, because Cap sleeves carry +₾4 while the card still reads "Starting from ₾45". Either set Cap's modifier to 0 on this garment or leave Short as the sleeve default if the opening price should match the card.
- **The three-quarter shots (9 files) are not used** — `layer_option_colors` stores front/back/left/right only, and adding a fifth camera angle would mean schema, type and `ViewSwitcher` changes. They are untouched in the source folder if that angle is wanted later.
- **Verified**: card preview loads (it is `loading="lazy"` and sits below the fold); canvas paints burgundy on open; colour swap repaints; all four angles resolve to distinct files; spec panel reads Body-Fitting / Cropped / Crew / Cap; hoodie keeps its own defaults and no canvas; men's chino untouched at ₾120; mobile 375px has no overflow and no broken images; no console errors.

### 2026-08-21 — "Coming soon" where the studio has nothing to show yet

- **Empty categories now say it plainly.** The seven women's headings without garments showed a quiet "No styles available yet / Check back soon" pair; they now lead with a serif *Coming soon* in the page's wine, with the explanatory line under it. Dropped `design.checkBackSoon` — in Georgian it read "მალე დაემატება", exactly duplicating the new heading.
- **Attributes with no artwork are labelled, not disabled.** Only the T-shirt's colour layer has photography; Fit, Length, Neckline, Back Design and Sleeves are labelled choices. Each now carries a quiet *Preview coming soon* next to its current value, and again above the option grid — while staying fully selectable, priced and orderable, because a tailor makes those variations today. Attributes that do have artwork (the colour layer, every men's garment) are untouched.
- Driven by `categoryHasArtwork()` in `CategoryOptions`, shared by the drill-down and the flat panel, so the note appears from the data rather than from a hardcoded list of attribute names. A garment gains photography and the note disappears on its own.
- Replaced a hardcoded English "More options coming soon." in `OptionPanel` with a translated key — it was the last untranslated user-facing string in the customizer.
- **Verified** on the production bundle (the dev servers were down, so this exercised the real build): empty category reads Coming soon in both locales; the T-shirt marks exactly its five photo-less attributes and not the colour layer; all ten sleeve options stay enabled, clickable and priced (Puff still ₾61); men's chino trousers unmarked; no console errors; no mobile overflow at 375px.

### 2026-08-21 — Withhold the preview when it would show the wrong garment

- **The photo no longer lies.** The T-shirt photography depicts one cut, so choosing Regular fit / Hip-length / Sleeveless still showed the body-fitting cropped cap-sleeve shot — the customer saw a garment they had not configured. The preview column now checks whether every selector-only attribute is still on the cut that was photographed (the seeder pins those defaults to it) and, when it is not, shows "Preview coming soon" in the canvas footprint instead of the wrong picture. Move back to the photographed cut and the photo returns.
- Colour is a real preview layer and swaps correctly, so changing colour never withholds the photo. The view switcher hides while there is nothing to rotate.
- **The note moved off the detail rows.** Repeating "Preview coming soon" on all five rows crowded the list, especially in Georgian. It now appears once, under the option list, where the customer is looking after choosing. The rows show only the choice and its price.
- **Verified**: photo shown at defaults and withheld after one or two deviations, restored on returning to the photographed cut, price correct throughout (₾45 → ₾50 → ₾45); colour swap keeps the photo; note sits after the option grid (DOM order asserted); men's chino trousers untouched; both locales; no console errors; no mobile overflow.

### 2026-08-21 — Keep the base photo on screen instead of blanking the preview

- **Reverted the preview withholding shipped earlier the same day.** Hiding the photo whenever a selection moved off the photographed cut left the whole left column empty as soon as a customer changed anything — worse than the problem it solved. The preview now always shows the photographed base style ("Classic") in the chosen colour, which is the honest starting point: attribute choices are modifications made to order on top of it.
- The "Preview coming soon" note stays under each photo-less attribute's option list, so the customer is still told that a specific choice is not pictured — the information is kept, the blank panel is not.
- The view switcher works again in all states, and colour swaps keep working regardless of the attribute selections.
- Dropped `customizer.previewCombinationSoon` from both locales — nothing references it now.
- **Verified**: photo holds through Hip-length + V neckline + Sleeveless with the price at ₾50; colour swap and all four camera angles still work while deviated; note still sits after the option grid; men's chino trousers untouched at ₾120; both locales; no console errors; no mobile overflow.

### 2026-08-21 — Preview holds the Classic photo until a choice we have no photo of

Third pass on this, settling it. The rule the studio now follows:

- **Arriving, and while browsing options, the Classic photo stays on screen** in the chosen colour. It is the garment we actually photographed and the honest starting point.
- **Choosing an option inside Fit, Length, Neckline, Back Design or Sleeves swaps the preview for a placeholder**, because no photograph of that combination exists and the image would otherwise show a garment the customer did not configure. Re-selecting the photographed option brings the photo straight back.
- **Colour never triggers it** — it is a real preview layer with its own photos per variant.

The earlier attempt applied the same rule but rendered as a bare empty box, which read as a page that had failed rather than a deliberate state. The placeholder now carries a dashed frame, an `ImageOff` icon and a serif "Preview coming soon" over a line explaining that the choices are still made to order, so it is legible as intentional. The view switcher hides while there is nothing to rotate; the colour dots stay, since the colour choice remains real.

Driven by comparing each selector-only attribute against its photographed default (the seeder pins those defaults to what was shot), so it needs no new schema and resolves itself as garments are photographed.

**Verified**: photo on arrival and while browsing an attribute without choosing; placeholder after choosing in each of the five attributes independently; photo returns on re-selecting the photographed option (₾45 → ₾54 → ₾45); colour swap keeps the photo; view switcher hides and returns; men's chino trousers and the hoodie untouched; both locales; mobile 375px; no console errors.

### 2026-08-21 — Preview follows the attribute being viewed

Final shape of the preview rule, after two wrong turns recorded above.

**Bug fixed:** with a photo-less choice made anywhere (e.g. Neckline: High), the preview was suppressed globally — so opening the Style attribute, where "Classic" is selected and *does* have photography, still showed a placeholder. The customer could not see the garment they had selected.

**The rule now:** the preview answers whatever the customer is currently looking at.

| Where they are | Left panel |
| --- | --- |
| Details list | Classic photo, in the chosen colour |
| Style (photographed) | Classic photo |
| Fit / Length / Neckline / Back Design / Sleeves | "Preview coming soon" placeholder |
| Back on the details list | Classic photo, whatever is selected |

Colour swaps and the four camera angles work wherever the photo is showing; the view switcher hides while the placeholder is up, since there is nothing to rotate.

Implementation: the open attribute moved from local state inside `AttributeNavigator` up to `Customizer` (controlled through `OptionPanel` as `openAttributeId` / `onOpenAttribute`), because the preview and the panel now have to agree on it. The photo/placeholder choice is `categoryHasArtwork(openAttribute)` — the same data-driven predicate the option grid uses — so photographing an attribute makes its placeholder disappear on its own, with no code change. Flat-panel garments (every men's product) never open an attribute, so they always show the photo, exactly as before.

**Verified**: photo on the details list and on the Style screen, including with Neckline: High selected (the reported case); placeholder inside each of the five photo-less attributes independently; photo returns on going back to the list; price correct throughout (₾45 → ₾50); colour swap and view switcher behave; men's chino trousers untouched at ₾120; both locales; mobile 375px; no console errors. All five earlier suites re-run green.

### 2026-08-22 — Every garment gets a left panel, photographed or not

- **The 16 unphotographed Tops had no preview column at all.** An earlier entry collapsed it to a single column when a garment had nothing to composite, so Bodysuit, Blouse, Hoodie and the rest opened with the options card floating against empty space. The two-column layout is now unconditional and the column carries the "Preview coming soon" placeholder whenever there is no photo to show.
- The placeholder wording follows what is actually missing: a garment with no photography at all reads *"We haven't photographed this garment yet — it is still made to your measurements"*, while the photographed T-shirt inside a photo-less attribute reads *"We haven't photographed these options yet — your choice is still made to order."* An unphotographed garment keeps the garment-level wording inside its attributes too, since claiming only "these options" are missing would imply the rest had been shot.
- Garments with no layer categories at all (the leftover demo dress and skirt) now show the placeholder rather than a bare page.
- The T-shirt is unchanged: photo on the details list and on Style, placeholder inside the five photo-less attributes.
- **Verified**: all 17 Tops render a left panel with the correct content — photo for the T-shirt, placeholder for the other 16 — with no broken images; Bodysuit shows the garment-level wording on the list and inside an attribute, price intact at ₾80; men's chino trousers keep photo and two columns at ₾120; a layer-less demo garment shows the placeholder; both locales; mobile 375px with no overflow; no console errors. All six earlier suites re-run green.

### 2026-08-22 — Colour picker sits under the photo on phones

- **Tapping a colour on a phone showed you nothing.** Measured on the customizer: the preview canvas ends 360px down the page while the colour dots started at 1020px — a 660px gap, so the garment and its colours could never be on screen at once on any phone (360×640, 375×667, 390×844, 414×896 all failed). The customer changed a colour and had to scroll back up to see the result.
- The options column now orders its children explicitly, putting the colour picker directly beneath the photo on phones and restoring the original order (details before colour) from `lg` up, where the two columns sit side by side anyway. Colour dots moved from 1020px to **539px** — a 179px gap — and photo plus colours now fit one screen on every device tested, including 360×640.
- Every child of that column carries an explicit `order-*`, because an unset one collapses to `order: 0` and jumps to the top. The `ViewSwitcher` gained a length guard alongside its ordered wrapper so the wrapper never becomes an empty flex item contributing a stray 20px gap.
- **Colour dots were 36px, below the 44px minimum touch target.** Now `h-11 w-11` on phones, returning to the tighter `h-9 w-9` from `sm` up where pointers are precise.
- Benefits the men's line too — chino trousers and the rest use the same column.
- **Verified**: photo and colour dots on screen together at 360×640, 375×667, 390×844 and 414×896, all with 44px dots and no horizontal overflow; tapping a colour repaints the photo that is visible; desktop keeps DETAILS above COLOR while phones put COLOR first; a garment with no colours (Bodysuit) keeps its placeholder and correct spacing; Georgian phone layout matches; men's chino trousers correct; no console errors. All six earlier suites re-run green.

### 2026-08-22 — Pin the preview on phones so changes are always seen

- **The garment scrolled out of view while you configured it.** The page runs ~1319px on a phone, so as soon as a customer moved down the details list the photo was gone and every change happened off screen. Putting the colour picker under the photo (previous entry) fixed the colour case but nothing below it.
- The preview column is now `sticky top-16` on phones — pinned directly under the 4rem navbar — and stays there through the whole page. Verified pinned at `top: 64` while scrolled to the very bottom on 360×640, 375×667 and 390×844, with a colour tap from that position repainting the pinned photo. From `lg` the existing `top-24` sidebar behaviour is unchanged.
- Two details the sticky needs: the page colour behind it (`bg-[var(--kere-page)]`), or scrolling content shows through the transparent canvas; and `z-10`, to sit under the `z-50` navbar but above the options panel.
- **The canvas shrank on phones from `h-56` to `h-40`** (224px → 160px) to pay for the pinning, which also cut the page from 1375px to 1319px. The placeholder box follows the same footprint, with its icon, heading and body scaled down at that size so nothing clips — measured `scrollHeight` 158 inside a 160px box. Tablet and desktop sizes are untouched.
- **Verified**: preview visible at the top and still visible scrolled to the bottom on three phone sizes; colour tap from the bottom repaints the pinned photo; placeholder garment fits without clipping; attribute-open state keeps the preview on screen; desktop preview still 740px tall with no overflow; no console errors. All eight earlier suites re-run green.
- Test-harness note: two suites detected the placeholder by selecting the preview column via its Tailwind class, which this change renamed — turning every placeholder assertion into a silent false negative. They now key off the placeholder's body copy, which no other element carries. Same class of mistake as the `screenshot()` helper clearing the viewport; both are fixed at the source rather than worked around.

### 2026-08-22 — Attribute list becomes a wrapping row of tiles

- **Six full-width rows were the last thing eating the phone screen.** The stacked details list ran ~370px, which is why the garment and the choices still could not sit together. The attributes are now a wrapping flex row of tiles, two to a row, each showing the attribute name above its current value and price delta.
- Measured: the list dropped from ~370px to **198px at 360×640 and 179px at 390×844**, taking the whole page from 1319px to **1138px / 1118px**. With the pinned preview above, the photo, the colour picker, all six attributes, the view switcher and the price bar are effectively on one screen.
- Desktop benefits too — in the 420px column the tiles land two to a row at 189px each, so the panel is denser without changing the interaction. Tapping a tile still opens that attribute's options exactly as before.
- The chevron affordance went with the rows; the bordered tile carries it now, matching `OptionSwatch`, which is already a bordered tappable tile. Removed the then-unused `ChevronRight` import.
- **Verified**: no horizontal overflow at 360, 390 or 1440; six tiles in three rows at every width; drill-down, colour swap, persistence and the placeholder states all unchanged; men's chino trousers unaffected. All eight earlier suites re-run green.

### 2026-08-22 — View switcher moves above the colours and loses its chrome

- The front/back/side control sat below the details list in its own white card with two outlined buttons. It now sits **directly above the colour picker**, so on phones it reads as a caption under the pinned garment rather than a stray widget further down the page.
- Stripped to a chrome-free row: ghost arrow buttons and a small uppercase label, no card, no borders. It captions the photo instead of competing with it. Buttons remain `<Button variant size>` per the project convention.
- Phone page height fell again, 1118px → **1072px**.
- **Verified**: the switcher renders above COLOR on both phone and desktop; all four angles still cycle (front → back → left → right, each loading its own file); the longest Georgian label (`მარჯვენა მხარე`, 111px) does not wrap and causes no overflow at 360px; the control still hides while the preview is a placeholder. All nine suites re-run green.

### 2026-08-22 — Cookie banner stops covering the order bar

- **The consent banner sat on top of the customizer's order bar on phones**, hiding the running total and the Order button until a visitor dismissed it — a conversion problem, not a cosmetic one, and it appeared on every first visit.
- The banner is global and fixed to the viewport bottom, while the order bar is page-level, so the banner had no way to know it was there. The Customizer now publishes the bar's measured height as `--kere-bottom-bar` on the document element, and the banner offsets itself with `bottom-[var(--kere-bottom-bar,0px)]`. Measured, not hardcoded, so it survives changes to the bar's contents or padding.
- The bar is `lg:hidden`, so on desktop it measures 0 and the banner sits flush exactly as before. The variable is removed when the customizer unmounts, so no other page inherits an offset.
- Also tightened the banner on phones — smaller padding, smaller text, tighter gaps — so it takes less of a small screen while it is up.
- **Verified**: bar measures 65px and the CSS variable matches; the banner's bottom edge lands exactly on the bar's top edge at 360×640 and 390×844, with no overlap; desktop resolves to `0px`; the variable is cleared after navigating away. Analytics is unconfigured locally so the real banner cannot mount — the mechanism was proved with a stand-in using the banner's exact positioning, then the real banner was verified against production, where Clarity is configured.

*End of README. Update the Evolution Log every time a feature is added or a significant bug is fixed.*
