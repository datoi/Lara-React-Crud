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
│   ├── AuthController.php          # Register, login, token issuance
│   ├── OrderController.php         # Order creation, tailor order mgmt, status updates
│   ├── CustomerOrderController.php # Customer fetches own orders
│   ├── NotificationController.php  # Fetch, mark-read, mark-all-read
│   └── UploadController.php        # Product image uploads
├── Models/
│   ├── User.php                    # Customer & Tailor unified model (role field)
│   ├── Product.php                 # Marketplace products, tailor-owned
│   ├── Order.php                   # Both marketplace & custom orders
│   ├── OrderItem.php               # Line items inside an Order
│   ├── CartItem.php                # Persisted cart items per user
│   ├── Category.php                # Product categories
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
└── hooks/
    └── useAuth.ts                  # Token storage, pending order preservation, sign out
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

### Railway via Nixpacks

**Files involved:**
- `nixpacks.toml` — PHP 8.3, Node.js 20, required extensions
- `Procfile` — `web: bash start.sh`
- `start.sh` — Runs migrations, starts server

**Required PHP extensions:** `pdo`, `pdo_sqlite`, `pdo_mysql`, `mbstring`, `tokenizer`, `xml`, `ctype`, `fileinfo`, `openssl`, `curl`

**Build phases:**
1. `composer install --no-dev --optimize-autoloader`
2. `npm ci && npm run build`
3. `php artisan migrate --force`

**Key env vars for Railway:**

| Variable | Purpose |
|---|---|
| `APP_KEY` | Laravel encryption key (required) |
| `APP_ENV` | Set to `production` |
| `APP_URL` | Full Railway URL (for HTTPS termination) |
| `DB_CONNECTION` | `sqlite` (default) or `mysql` |
| `TRUSTED_PROXIES` | `*` — Railway terminates HTTPS at proxy layer |

**HTTPS Note:** Railway terminates SSL at the load balancer. The app must trust all proxies (`TRUSTED_PROXIES=*`) to correctly detect HTTPS and generate correct URLs. Set in `TrustProxies` middleware or `AppServiceProvider`.

---

## 8. Design System Rules

**These rules are non-negotiable. Do not deviate without explicit user instruction.**

### Colors
Slate palette only: `slate-900 / 700 / 600 / 500 / 400 / 200 / 100 / 50`
Never use: blue, purple, indigo, or any other color family.

### Class Patterns

```
Card:      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-lg transition-all"
Container: className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
Section:   className="py-16 md:py-24"
Grid:      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Buttons
Always use `<Button variant="default|outline|ghost" size="sm|default|lg">` from `components/ui/button.tsx`.
Never write custom button classes.

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

*End of README. Update the Evolution Log every time a feature is added or a significant bug is fixed.*
