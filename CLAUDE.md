# CLAUDE.md — Kere (kereforyou.com) knowledge base

**Read this first, before exploring code.** It describes the whole system as verified against the code on **2026-10-04** (commit `4868366`): what exists, where it lives, how it behaves, which rules apply, and what is known to be broken. Open the code only to confirm a detail or to change it.

- Detailed history (why things are the way they are): `README.md` §9 "Project Evolution & Logic Log", newest first. README §1–8 are partly stale (they still describe `context/CartContext.tsx`, an oklch brand colour and an old file map). Where README §1–8 and this file disagree, this file and the code win.
- **Keep this file true.** When a change makes a statement here wrong, update it in the same commit. Changing it is part of the task, not an optional extra.
- The original source briefs (customizer design handoff zips, tailor and customer registration specs as `.docx`) are in `/.claude/`, which is gitignored.

## Contents
1. Quick facts
2. Working rules (conventions, protocol, QA and reviewer roles)
3. Commands and local development
4. Architecture
5. Repository map
6. Database schema
7. API reference
8. Business flows
9. Design studio / customizer engine
10. Frontend reference (routes, storage keys, pages, components)
11. Design system and CSS gotchas
12. Third-party services and environment variables
13. Deployment and production
14. Tests and quality gates
15. Known issues and tech debt (verified)
16. Branches, collaborators, pending work
17. History timeline

---

## 1. Quick facts

| | |
|---|---|
| Product | **Kere**: a marketplace that connects customers with local Georgian (Tbilisi) tailors for made-to-measure clothing |
| Live site | https://kereforyou.com (Railway, behind Cloudflare) |
| Legal entity | შპს კერე შენთვის, identification code **406562376**. Phone **+995 597 03 23 48**, email **kereforyou@gmail.com**, Instagram **@kereforyou**. These constants live in `resources/js/data/company.ts`; the legal name and address are translated (`company.*`, `footer.*` in the locales). |
| Repo | `github.com/datoi/Lara-React-Crud`, default branch `main` |
| People | **datoi** is the owner and developer, and the person giving instructions. **Mariami** (git author `mbadzaghua`) is the designer; she pushes design work to `mariam-*` branches, which are imported selectively. |
| Stack | Laravel **12.56** JSON API (PHP ^8.2; local 8.2.12, production php83) and a React **19** SPA (TypeScript 5.7, React Router 7 `createBrowserRouter`, Tailwind CSS v4, Radix, Motion 12, i18next) built with Vite 6. **Not Inertia**: the Inertia starter-kit files are dead code. |
| Database | SQLite locally (`database/database.sqlite`), **PostgreSQL in production** (Railway). Tests use in-memory SQLite. |
| Language and currency | Georgian `ka` is the default, English `en` the fallback. All prices are Georgian Lari (₾, GEL). |
| Customer offerings | (1) **Marketplace**: ready designs that tailors list. (2) **Design studio**: a 5-step guided designer at `/design`, plus "upload your own design". (3) **Remodel**: alter a garment the customer already owns. |
| Other roles | Tailor (dashboard, products, offers on open requests); admin (orders, users, tailor approval, customizer catalogue admin) |
| Payments | **Flitt** (formerly Fondy) hosted checkout, merchant **4057819**, live since 2026-09-25. Only marketplace orders are paid by card. Custom and remodel orders are settled offline (`payment_status = not_required`). |
| Health on 2026-10-04 | **165 Pest tests pass** (496 assertions, about 13 s). `tsc --noEmit` is clean. ESLint: 0 errors, 7 pre-existing `exhaustive-deps` warnings. Locales: 1,628 keys each, in parity. 67 migrations, all run locally. 96 API routes. |

---

## 2. Working rules

These carry forward the owner's standing instructions from the previous CLAUDE.md. The full original text is in git history (`git show 4868366:CLAUDE.md`).

### 2.1 How to work
- **Inspect first, implement second.** Understand what exists, why, what depends on it and what could break. Think through the whole chain: UI → state → API → validation → DB → response → UI. Investigate the code rather than assuming.
- Plan the smallest clean change. Reuse existing components and helpers. Do not duplicate logic, add parallel paths, hardcode IDs, add hidden state, or suppress errors and warnings. Fix root causes.
- The backend enforces business rules and permissions. Hiding something in the UI is never security.
- Handle every state: loading, empty, error (API and network), validation, and success. Never fail silently.
- Treat existing code with respect: extend it safely and refactor only what blocks the requirement. Flag unrelated problems you notice, but do not refactor them without asking.
- No dead code, speculative abstractions or unnecessary comments. Avoid `any`; keep TypeScript and API contracts typed.
- Before declaring done, self-review architecture, UX (mobile and Georgian), validation, authorization and regressions.

### 2.2 Non-negotiable conventions
- **Imports**: `react-router`, never `react-router-dom`. `motion/react`, never `framer-motion`. Icons from `lucide-react`.
- **Currency**: always ₾ (Georgian Lari). Never `$`, never an unlabeled number.
- **Brand colour**: wine `#631e26` (`bg-brand`, `text-brand`, `border-brand`), hover `#4f1820` (`bg-brand-dark`). **Never blue, purple or indigo.**
- **Buttons**: use `<Button variant size>` from `resources/js/components/ui/button.tsx` for actions. Read §11.3 first: global CSS restyles it heavily. Selection surfaces (tiles, chips, swatches, radio-style choices) are deliberately raw `<button>`s or radio inputs, because `outline` Buttons render as underlined links.
- **Animations**: only the five patterns (fade-up, fade-in, scale-in, stagger, hover-scale). Duration `0.5` or `0.6` only. Delays in steps of `0.1` or `0.2`. No spring and no bounce. Approved exceptions: the HowItWorks scroll-linked timeline, `ease: [0.22, 1, 0.36, 1]` on landing fade-ups, `0.2s` popovers and micro-interactions, and the `0.2s` tween for admin drag-reorder.
- **i18n**: no hardcoded user-facing strings. `resources/js/locales/en.json` and `ka.json` must stay key-for-key identical, and both languages must render correctly. Never render a raw server message: the API sends a `code`, and `resources/js/lib/serverMessage.ts` maps it to a translation key.
- **Design**: do not redesign unless asked. New UI must look like it belongs to Kere. When importing Mariami's design branches, the owner's rule is that **her design wins on layout and CSS, while `main`'s logic and shipped fixes are kept.** Import design only, keep every function her branch would remove, and accept the functions it adds.
- The storefront header is **single-tone cream** with dark text. Mariami confirmed this on 2026-09-29. Do not reintroduce the dark-section inversion.

### 2.3 Protocol
- **Living docs**: every shipped feature or fix gets a README §9 Evolution Log entry, added at the top of §9 and dated `### [YYYY-MM-DD] Title`. Use plain sentences in this structure: **What was done** (bullets), **Verified** (exactly what was run and observed), and **Not covered / Noticed**. Also update this CLAUDE.md when it is affected.
- **Verify before claiming done.** For backend work, run `php artisan test` and add feature tests. For frontend work, run `npm run typecheck`, `npx eslint <files>`, `npm run build` and check locale parity. **For UI changes, drive the real page in a browser**: Georgian and English, about 390px and desktop width, no console errors, and no horizontal overflow measured against `document.documentElement.clientWidth` (not `innerWidth`). Typecheck alone is not verification. If you cannot test something, say so plainly.
- **QA data hygiene**: delete any QA accounts, orders and products you create, and restore stock.
- **Never send real email, SMS or payments during QA.** The local `.env` holds live credentials (see §3.3).
- **Commits**: use a plain-English sentence that describes the outcome, for example "Let remodel customers say when they need the garment back" or "Keep saved measurements safe when the profile fails to load". Do not use conventional-commit prefixes. Commit and push only when asked.

### 2.4 QA engineer role (when asked to QA)
Verify independently; treat every "done" as a hypothesis. Drive the golden path in the browser, then probe edges: empty states, long text, missing images, failed or slow network, mobile widths, keyboard. For APIs, hit the real endpoint and check status codes, error shapes, unauthorized access and boundary values. Treat violations of §2.2 as bugs. Check adjacent features for regressions. Look for silent failures in the console and network tab. Report concrete repro steps (expected vs actual). Do not fix unless asked, and never call untested things verified.

### 2.5 Senior code reviewer role (when asked to review)
Review the actual diff line by line, including paths the author did not mention. Order findings by severity: correctness, security and data loss first, then regressions and edge cases, then convention violations, then style. Treat §2.2 as review gates. Watch for drift: two lists that must agree, copy-pasted logic, a new pattern where one already exists. Flag dead code, swallowed errors and a missing Evolution Log entry. For each finding give file and line, the failure scenario and the fix direction, and mark it blocking or a nit. Do not rewrite unless asked.

---

## 3. Commands and local development

### 3.1 Everyday commands
| Purpose | Command |
|---|---|
| Run the app | `php artisan serve` (http://127.0.0.1:8000) and `npm run dev` (Vite, port 5173), in two terminals. `composer dev` also runs `queue:listen`, but Composer is not installed on the owner's PC. |
| PHP tests | `php artisan test` (Pest 3). Filter with `php artisan test --filter=Payment`. |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) |
| Lint | `npx eslint .` or `npx eslint <files>`. **Do not use `npm run lint`**: it runs `eslint . --fix` and rewrites files. |
| Build | `npm run build` (`vite build`, writes the gitignored `public/build`) |
| Format | `npm run format` runs Prettier over all of `resources/` and causes huge churn. Avoid it. `.prettierrc`: 4 spaces, single quotes, `printWidth` 150, organize-imports and tailwind plugins. `components/ui/*` is ignored. |
| Locale parity | `node -e "const f=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?f(v,p+k+'.'):[p+k]);const e=new Set(f(require('./resources/js/locales/en.json'))),k=new Set(f(require('./resources/js/locales/ka.json')));console.log(e.size,k.size,[...e].filter(x=>!k.has(x)),[...k].filter(x=>!e.has(x)))"` |
| Migrate | `php artisan migrate`. `migrate:fresh --seed` is **local only** and wipes data; run `php artisan storage:link` afterwards. |
| Seed one catalogue | `php artisan db:seed --class=WomensTopsSeeder` (all garment seeders are idempotent) |
| Inspect data | `php artisan tinker --execute="..."`, `php artisan db:table orders`, `php artisan route:list --path=api` |
| Catalogue command | `php artisan catalogue:enrich-descriptions [--apply] [--threshold=40]`. Dry run by default. Appends fabric, sizes and the made-to-order sentence (Georgian) to thin product descriptions. Idempotent through the marker `მზადდება 7–14 სამუშაო დღეში`. Already run on production on 2026-09-25. |

### 3.2 Seeders (`database/seeders`)
| Seeder | What it does |
|---|---|
| `DatabaseSeeder` | Test user `test@example.com` (factory), then Clothing, SleevelessTank, MensGarments and WomensTops |
| `ClothingSeeder` | Six categories (IDs 1 dresses, 2 shirts, 3 pants, 4 jackets, 5 scarves, 6 hats) and 13 demo products with no tailor, some with Unsplash images. **Only runs when `categories` is empty.** |
| `SleevelessTankSeeder` | `sleeveless-tank` (unisex, ₾90, category `shirt`): one "Style your own" layer, one `Sleeveless` option, nine colours from `/assets/garments/shirts/`; White has four views. **Not run by `start.sh`.** |
| `MensGarmentsSeeder` | Six men's garments: elbow shirt ₾95, short-sleeve tee ₾45, chino, corduroy, dress and cargo trousers ₾120 each. Each has a single `style` layer with colour variants; the first colour slug is the default (a "hero" colour, not white). Extra views are picked up only when the file exists. |
| `WomensTopsSeeder` | 17 women's Tops garments (`womens-*`, category `tops`), each with five attributes (fit, length, neckline, back-design, sleeves), plus the T-shirt photography. See §9. |

### 3.3 Local environment gotchas
- **The local `.env` holds real credentials.** `MAIL_MAILER=smtp` sends real mail through `smtp.gmail.com`. `SMSOFFICE_KEY` is real, so SMS costs money and reaches real phones. The `FLITT_*` keys are the real merchant 4057819, so checkout tokens are real (never complete a payment in QA). For QA, start the server with overrides: `MAIL_MAILER=log SMSOFFICE_KEY= php artisan serve --no-reload`. Real environment variables beat `.env`, and `--no-reload` matters because without it `artisan serve` strips most variables from its worker processes when PHP's `variables_order` includes `E` (this PC uses `GPCS`). Confirm that the first OTP lands in the log before trusting the setup, or temporarily edit `.env` and restore it afterwards.
- When SMS is unconfigured, `SmsService` logs each message to the **daily** log, `storage/logs/laravel-YYYY-MM-DD.log` (`SMS [+995…]: Kere: …კოდია 123456`). Mail with the `log` mailer goes to `storage/logs/laravel.log`.
- `DB_DATABASE` must be an **absolute** path; `config/database.php` falls back to `/tmp/database.sqlite`. `config/database.php` also defaults `DB_CONNECTION` to `pgsql`, so `.env` must set `sqlite` locally.
- `public/storage` must be a symlink or junction to `storage/app/public` (`php artisan storage:link`), or uploads return 404.
- The support email uses `Mail::queue()` (`QUEUE_CONNECTION=database`). It sits in `jobs` until `php artisan queue:work` runs. Production runs a worker from `start.sh`.
- The owner's PC runs Windows 10 with XAMPP PHP 8.2.12 at `E:\xampp\php` (MySQL unused), Node 24 and npm 11. **Composer is not installed** (`vendor/` was copied from the old PC), so any `composer.json` change needs Composer first. Git Bash and PowerShell are both available. Machine-specific notes are in Claude's memory.
- The photo scripts need **`sharp`**, which is not in `package.json`: run `npm i --no-save sharp` first.
- Browser verification has been done with headless Chrome or Edge over CDP, or `playwright-core` installed in a scratch directory (never in the project). There is **no frontend test runner**.
- Dev servers may already be running (ports 8000 and 5173). Check before starting new ones.

---

## 4. Architecture

```
Browser ── GET /anything ─────────► routes/web.php ──► resources/views/app.blade.php (SPA shell, <div id="app">)
   │                                   ├─ GET /robots.txt   (shadowed by static public/robots.txt; see §15)
   │                                   ├─ GET /sitemap.xml  (static pages + every product)
   │                                   ├─ GET /product/{id} (same shell, HTTP 404 if the product is gone)
   │                                   └─ POST /checkout/complete (Flitt return; CSRF-exempt in bootstrap/app.php)
   └── fetch('/api/…', {Authorization: Bearer <token>}) ──► routes/api.php ──► Controllers ──► Eloquent ──► SQLite / Postgres
```

- **Auth model**: the custom bearer-token middleware `auth.bearer` (`app/Http/Middleware/BearerTokenAuth.php`). Login and registration return a 60-character random token. Only its SHA-256 hash is stored in `users.api_token` (unique, hidden). There is **one token per user**: each login replaces it, which signs out other devices. Tokens never expire. A suspended user gets 403. The middleware implements `AuthenticatesRequests` purely so Laravel runs it before throttling, which makes throttles per-user instead of per-IP. Do not remove that interface.
- **Middleware aliases** (`bootstrap/app.php`): `auth.bearer`; `auth.admin` (`role === 'admin'`, otherwise 403); and `role:<roles>` (`EnsureRole`, 403 `{code:'role_not_allowed'}`). `trustProxies(at: '*')`. Production forces HTTPS in `AppServiceProvider`.
- **Roles**: `users.role` is `customer` (default), `tailor` or `admin`. Admin seeding: migration `2026_05_19_082242_seed_admin_user` and `start.sh` create or sync `admin@kere.ge`.
- **Frontend**: `resources/js/App.tsx` renders `HelmetProvider`, then `RouterProvider` (`routes.tsx`) and `<AnalyticsConsent/>`. There is no global state library. Small module stores use `useSyncExternalStore` (cart), and plain helper modules wrap `localStorage`/`sessionStorage` (auth, drafts, sections). Every request is a raw `fetch` with `Authorization: Bearer ${getAuthToken()}` and `Accept: application/json`; there is no shared API client.
- **i18n**: `resources/js/i18n.ts` initialises i18next with `lng = localStorage.kere_lang ?? 'ka'` and `fallbackLng: 'en'`. The header's language toggle writes `kere_lang`.
- **Notifications and chat poll; there are no websockets.** The bell polls every 30 s, order chat every 4 s while mounted, and a pending or rejected tailor polls `/api/me` every 15 s.
- **Mail and SMS are sent synchronously inside requests**, wrapped in try/catch that logs failures. The exception is the support email, which is queued.

---

## 5. Repository map

### 5.1 Backend (`app/`)
| Path | Responsibility |
|---|---|
| `Http/Controllers/Api/AuthController.php` | Registration (`registerInitiate`, `registerVerifyEmail`, `registerVerifyPhone`, `registerResend`, `availability`), `login` (email or phone), `adminLogin`, `me`. Also `attributesFor()` (shared user builder), `EXPERIENCE_YEARS` band→years, `findByLogin`, `maskPhone`. |
| `Api/CustomerOnboardingController.php` | `completeProfile` (date of birth, terms, guardian), `resendConsent`, public `showConsent`/`recordConsent` (guardian link) |
| `Api/CustomerMeasurementController.php` | GET/PUT the signed-in customer's saved measurements |
| `Api/OrderController.php` | `store`, which dispatches to `storeMarketplaceOrder`, `storeCustomOrder` or `storeRemodelOrder`. Tailor side: `tailorOrders`, `openOrders` (bid feed with privacy stripping), `requestOrder` (offer), `updateStatus`. Also `formatOrder`, `openOrderTypesFor`, `withMeasurementSnapshot`, `randomTailor`. |
| `Api/CustomerOrderController.php` | `index` (customer's orders), `requests` (offers with tailor ratings), `chooseTailor` |
| `Api/PaymentController.php` | `pay` (mints a checkout URL), `verify` (client poll), `callback` (Flitt webhook), `markPaid` (idempotent conditional update), `announcePaidOrder` |
| `Api/AdminController.php` | Orders list, order chat (read-only), users, assign tailor, mark delivered, suspend toggle, pending tailors, approve, reject |
| `Api/TailorController.php` | Public tailor list and profile (`tailorData`), `updateProfile` |
| `Api/MessageController.php` | Order chat: `index`, `store` (notifies the other party), `counts` |
| `Api/NotificationController.php` | List (latest 50 plus unread count), mark read, mark all read, delete one, delete all |
| `Api/ReviewController.php` | `store` (delivered orders only, one per order), `productReviews`, `landing` (latest 5-star reviews), `orderReviewStatus` (unused) |
| `Api/UploadController.php` | `design` (customer file), `image` and `profileImage` (tailor), `tailorIdDocument` (private disk). Resolves disks through `config('filesystems.uploads_disk'/'documents_disk')`. |
| `Api/WishlistController.php` | Index, add (`syncWithoutDetaching`), remove |
| `Api/SupportEmailController.php` | Stores a `support_messages` row and queues `SupportRequest` to `SUPPORT_EMAIL` (503 if unset) |
| `Api/CustomizerProductController.php` | Public customizer catalogue: `index` (active and showable), `show` (options filtered to what photography can show), `preview` (unused) |
| `Api/SavedDesignController.php` | CRUD for the customer's saved designs |
| `Api/CustomizerAdminController.php` | Admin CRUD for customizer products, layer categories, options, option colours, fabrics, and the three reorder endpoints. **Writes to the `public` disk directly** (see §15). |
| `Http/Controllers/ProductController.php` | (Not in the `Api` namespace, but serves `/api`.) Catalogue `index`/`show`/`meta`, `platformStats`, `tailorStats`, `tailorProducts`, tailor product create, update, status and delete; `formatProduct` |
| `Http/Controllers/CategoryController.php` | `/api/categories` with `products_count` and a random `sample_image` |
| `Http/Middleware/` | `BearerTokenAuth`, `AdminMiddleware`, `EnsureRole` (live); `HandleInertiaRequests` (dead, not registered) |
| `Http/Requests/` | `StoreDesignRequest` (validates saved-design ownership), `StoreLayerOptionRequest` (admin), `PreviewDesignRequest` (live); `Auth/LoginRequest`, `Settings/ProfileUpdateRequest` (dead) |
| `Http/Resources/` | `CustomizerProductResource`, `LayerCategoryResource`, `LayerOptionResource`, `LayerOptionColorResource`, `FabricResource`, `SavedDesignResource` (`preserveMaps()` keeps integer-keyed maps as JSON objects). Paths starting with `/` are public assets; others resolve to `asset('storage/…')`; each path segment is `rawurlencode`d. |
| `Models/` | `User`, `Order`, `OrderItem`, `Product`, `Category`, `Review`, `Message`, `KereNotification` (`kere_notifications` table), `TailorRequest`, `Verification` (UUID primary key), `CustomizerProduct`, `LayerCategory`, `LayerOption`, `LayerOptionColor`, `Fabric`, `SavedDesign`, `CartItem` (dead) |
| `Services/` | `FlittService` (signature, tokens, status, language), `SmsService` (SMSOffice.ge; logs when unconfigured), `OtpService` (6-digit code, email or SMS), `Notifier::dual()` (SMS always when a phone exists, plus email when present; never throws) |
| `Support/Measurements.php` | Reads `resources/js/data/measurements.json`: `keys()`, `profileKeys()`, `rules($path, profile)`, `normalize()`, `known()` |
| `Mail/` | `OtpCode`, `OrderConfirmation`, `NewOrderAlert`, `OrderStatusUpdated`, `TailorApproved`, `TailorRejected`, `TailorRequestReceived`, `GuardianConsentRequest`, `SupportRequest`. Views are in `resources/views/emails/*.blade.php`: English only, slate styling with a dark header and a "Kere" text logo. |
| `Console/Commands/EnrichProductDescriptions.php` | `catalogue:enrich-descriptions` |
| `Providers/AppServiceProvider.php` | Forces HTTPS in production. Rate limiters `login` (10/min keyed `email\|ip`) and `admin-login` (5/hour keyed `email\|ip`). |
| **Dead backend code** | `CartController`, `DesignerController`, root `Http/Controllers/OrderController.php`, everything in `Controllers/Auth/*` and `Controllers/Settings/*`, `HandleInertiaRequests`, `routes/auth.php`, `routes/settings.php` (never loaded), the `CartItem` model and `cart_items` table. Unused Composer packages: `inertiajs/inertia-laravel`, `tightenco/ziggy`, `twilio/sdk`. |

Other backend files: `routes/console.php` (only `inspire`; **no scheduler**), `config/services.php` (`smsoffice`, `flitt`, `support`, `resend`), `config/filesystems.php` (`uploads`/`documents` R2 disks plus the switch), `config/app.php` (`shipping_cost` = `SHIPPING_COST`, default 15).

### 5.2 Frontend (`resources/js/`)
| Path | Responsibility |
|---|---|
| `App.tsx`, `routes.tsx`, `i18n.ts` | Entry, router (see §10.1), i18n |
| `pages/` | One file per route (see §10.3) |
| `components/landing/` | `Navigation` (the site header on almost every page, which also mounts `CartDrawer`), `HeroSection`, `MarketplaceCarousel`, `BrandStorySection`, `FeaturesSection`, `HowItWorksSection`, `SizeFitSection`, `GuaranteeSection`, `CTASection`, `FAQSection`, `JoinSection`, `NewsletterPopup`, `Footer` |
| `components/customizer/` | The guided designer: `DesignerWizard`, `StepRail`, `StagePanel`, `PreviewCanvas`, `ViewSwitcher`, `ReviewSheet`, `WizardTiles`, `SaveDesignModal`, `PatternPaper`, `GarmentIcons`, plus `designPhoto.ts`, `depicts.ts`, `garmentColors.ts`, `money.ts`, `submitDesign.ts` |
| `components/tailor/` | `DashboardHeader`, `StatsCards`, `OnboardingPanel` (the "Start here" checklist), `TailorProfileEditor`, `ProductManager`, `AddProductModal`, `AvailableDesigns` (open-request picture grid), `OpenDesignDialog` (offer pop-up, Radix), `OpenDesignPicture`, `OrdersList` (order table and detail modal with status action buttons and chat), `openOrders.ts` (types, `readStudioChoices`, `GARMENT_KEYS`) |
| `components/measurements/` | `MeasurementFields`, `MeasurementList` (snapshot display), `MyMeasurements` (dashboard card), `OrderMeasurements` (per-order step) |
| `components/marketplace/` | `ProductImage` (shows an "image unavailable" mark on a missing or failed image), `ProductCardSkeleton` |
| Other components | `CartDrawer`, `NotificationBell`, `OrderChat`, `ReviewModal`, `EmailSupportModal`, `MeasurementGuideModal`, `AnalyticsConsent`, `ErrorBoundary`, `ErrorFallback`, `RouteGuard` (`RouteGuard` and `TailorScope`), `OtpStep`, `CustomerProfileSteps`, `PhoneInput`, `PaymentMarks`, `DesignSpecList`, `skeletons/*`, `ui/button.tsx` |
| `hooks/` | `useAuth` (auth, return-to and pending-order storage helpers), `useCart` (cart store and drawer state), `useSection`, `useCustomOrderDraft`, `useCustomizerSelections`, `useCustomizer`, `useProductData`, `useCategoryProducts`, `useProfileMeasurements`, `useOrderMeasurements` |
| `lib/` | `tailorAccess.ts` (`TAILOR_PAGES`, `TAILOR_HOME`), `serverMessage.ts` (code→i18n), `analytics.ts` (Clarity), `dates.ts` (`formatCalendarDay`, `tomorrowCalendarDay`), `measurements.ts`, `utils.ts` (`cn`) |
| `data/` | `garmentTaxonomy.ts` (studio headings per section), `measurements.json` (shared with PHP), `company.ts`, `countries.ts` (phone dial codes, Georgia first), `privacyPolicy.ts` (privacy policy text for both languages, kept outside the locales) |
| `types/customizer.ts` | API shapes for the customizer, `DesignConfiguration`, `DesignSpecLine` |
| `locales/en.json`, `locales/ka.json` | 60 namespaces, 1,628 keys each |
| **Dead frontend code** (unreachable from `App.tsx`, verified by import-graph analysis) | `components/ClothingTypeSelector`, `CustomizationPanel`, `FinalPreview`, `GarmentPreview`, `StudioBreadcrumb`, `SubcategorySelector`, `TailorSelector`, `designer/GarmentSVG`, `designer/config.ts`, `designer/engine.ts`, `landing/CategoriesSection`, `landing/LocalTailorsSection`, `marketplace/MarketplaceFilterRail`; the starter-kit `app-*`, `appearance-*`, `breadcrumbs`, `heading*`, `icon`, `input-error`, `nav-footer`; **every `components/ui/*` except `button.tsx`**; `hooks/use-appearance`, `use-initials`, `use-mobile*`; `types/index.ts`. Unused npm packages: `@inertiajs/react`, `@headlessui/react`, and the Radix packages used only by dead `ui/*` files (avatar, checkbox, collapsible, dropdown-menu, label, navigation-menu, select, separator, toggle, toggle-group, tooltip). Live Radix packages: `react-dialog` and `react-slot`. |

### 5.3 Other
- `resources/css/app.css` (2,196 lines): Tailwind v4 theme and every custom class (see §11).
- `resources/views/app.blade.php`: `<html lang="ka">`, default SEO, Open Graph and Twitter tags (`og-image.jpg?v=3`), favicons `?v=5`, the Google Fonts `<link>`, and `@vite`.
- `public/assets/`: brand, hero, garments (`ManElbowShirts`, `ManShortSleeve`, `ManTrousers{Cargo,Chino,Curdory,Dress}`, `shirts` (the tank), `WomanTshirtStudio` (688 derived T-shirt photos), `WomanTshirtClassic` (legacy, unreferenced), `WomanTshirtKere`, `WomanSweaterKere`), design-categories (cut-outs), partners, size-fit, payment (`visa.png`, `mastercard.png`), backgrounds, textures, catalog, editorial. **Gitignored masters**: `/garment-masters/`, `public/assets/garments/{Woman T-shirts,WomanTshirtCassic2,New Tshirts,01. Fitted-*,drive-download-*}`.
- `scripts/import-studio-drop.mjs` and `scripts/prepare-tshirt-photos.mjs`: the T-shirt photo pipeline (§9.6).
- `docs/qa-report-2026-07-23.md`: an old QA report.
- Deploy files: `nixpacks.toml`, `Procfile`, `start.sh`, `Dockerfile`, `render-start.sh` (legacy Render plus SQLite), `.devcontainer/` (Codespaces with Postgres 16), `.github/workflows/{lint,tests}.yml`.

---

## 6. Database schema

Production is PostgreSQL and local is SQLite. JSON columns are cast to arrays in the models.

**Enum gotcha:** `orders.status` and `users.approval_status` carry **PostgreSQL CHECK constraints** that SQLite does not enforce. A new status value passes local tests and **fails in production** unless a migration drops and re-adds the check on `pgsql`; copy the pattern in `2026_06_03_000001_extend_orders_custom_flow.php`. `role`, `order_type`, `payment_status`, `products.status`, `gender` and `tailor_requests.status` are plain strings.

### users
`id, name` (full name, legacy) · `first_name, last_name` · `email` (nullable, unique) · `phone` (nullable, unique, `+<digits>` such as `+995555…`) · `password` (`hashed` cast) · `role` (customer, tailor or admin; default customer) · `api_token` (SHA-256, unique, hidden) · `remember_token` · `email_verified_at` (unused) · tailor profile: `bio, specialty, years_experience (int), profile_image (URL), is_available (bool, default 1), turnaround_days (string), approval_status` (pending, approved or rejected; **null means a customer or a legacy tailor, treated as approved**) · tailor registration: `business_type` (independent, atelier, workshop or designer), `workspace_address`, `legal_status` (individual, sole_trader, llc or other), `national_id` (hidden), `id_document_path` (hidden), `does_remodeling` (nullable bool; null for non-tailors) · `is_suspended` (bool) · customer onboarding: `terms_accepted_at, date_of_birth, marketing_opt_in, guardian_name, guardian_email, guardian_phone, guardian_relationship` (parent or legal_guardian), `guardian_consent_token` (SHA-256, hidden, indexed), `guardian_consent_at` · `measurements` (JSON, **hidden**) · timestamps.
Model rules (`app/Models/User.php`): `PUBLIC_TAILOR_COLUMNS` is the **only** set of columns that may be eager-loaded on a tailor in public responses. `MINIMUM_AGE = 16`, `ADULT_AGE = 18`, and `AGE_TIMEZONE = 'Asia/Tbilisi'` (ages are counted in Georgia, not UTC). `registrationComplete()` is true for non-customers and otherwise requires `terms_accepted_at`. `needsGuardianConsent()` is true for ages 16–17. `mayPlaceOrders()` returns `registrationComplete() && (!needsGuardianConsent() || guardian_consent_at)`. `getFullName()`, `wishlistProducts()`.

### orders
`id` · `user_id` (FK users, **cascade**) · `tailor_id` (FK users, set null, indexed) · `order_number` (unique; `ORD-XXXXXXXX` for marketplace and custom, `RMD-XXXXXXXX` for remodel; 8 uppercase alphanumerics, never an underscore) · `order_type` (marketplace, custom or remodel) · `status` (pending_assignment, pending, processing, shipped, finished, delivered or cancelled; indexed) · `tailor_assignment_mode` (manual or random) · `payment_status` (unpaid, paid, expired or not_required) · `payment_id` (Flitt) · `payment_reference` (unique; `<order_number>_<8 random lowercase>`, the latest checkout attempt) · `paid_at` · `subtotal, shipping, total` (decimals cast to float) · `expected_price` (remodel budget) · `needed_by` (date, cast `date:Y-m-d`; remodel) · `custom_design_data` (JSON) · `delivered_at` · `first_name, last_name, email, phone, address, city, state, zip, country` · `notes` · timestamps.
**Marketplace and custom orders store a placeholder address** (`address 'N/A'`, `city 'Tbilisi'`, `zip '0100'`, `country 'GE'`). Only remodel collects a real pickup and return address.

### order_items
`order_id` (cascade) · `product_id` (**nullable, set null** since 2026-09-28, so lines outlive deleted products) · `product_name` (snapshot; always display this) · `color` (a hex string) · `size` · `quantity` · `price` (unit price snapshot) · `custom_design` (unused) · `cm_measurements` (JSON snapshot) · `customization_note`.

### products (marketplace)
`category_id` (FK, **cascade**: deleting a category deletes its products) · `tailor_id` (FK, set null) · `name` · `slug` (unique, `str-slug-xxxxxx`; not used for routing, which uses the ID) · `description` · `price` · `colors` (JSON hex strings) · `sizes` (JSON) · `images` (JSON; tailor uploads are stored as **absolute URLs**, seeded demo products use `/assets/...` paths or Unsplash URLs) · `is_customizable` (default 1) · `is_featured` · `stock` (default 100) · `fabric` · `texture` · `required_measurements` (JSON measurement keys) · `status` (active or paused; **only cosmetic**, see §15) · `gender` (men, women or unisex; default unisex, indexed).

### categories
`name` (English), `slug` (unique), `description`, `image`. Seeded IDs: 1 dresses, 2 shirts, 3 pants, 4 jackets, 5 scarves, 6 hats.

### Social and support tables
- `kere_notifications`: `user_id` (cascade), `type`, `title`, `body`, `data` (JSON, usually `{order_id, …}`), `is_read`; index `(user_id, is_read)`. Types: `new_order`, `open_order`, `order_status`, `tailor_request`, `request_accepted`, `request_declined`, `new_message`, `account_approved`, `order_finished` (to admins). Titles and bodies are stored as English text (some admin-triggered ones in Georgian) and shown as stored.
- `messages`: `order_id` (cascade, indexed), `sender_id` (cascade), `message` (at most 2,000 characters).
- `reviews`: `order_id` (**unique**, cascade), `user_id`, `product_id` (nullable, set null; set only for marketplace orders, from the first item), `rating` (1–5), `comment`.
- `tailor_requests` (offers): `order_id`, `tailor_id` (unique pair), `message` (at most 500), `offered_price`, `status` (pending, accepted or declined).
- `wishlist_items`: `user_id`, `product_id` (unique pair, cascade).
- `support_messages`: `user_id`, `from_email`, `subject`, `message`, `resolved`.
- `verifications` (pending registrations): `id` (UUID string), `email`, `phone`, `otp_email`, `otp_phone`, `registration_data` (JSON: the hashed password and every registration answer), `email_resend_count`, `phone_resend_count`, `email_attempts`, `phone_attempts`, `expires_at` (+30 min), and `*_verified_at` (unused). Deleted on success.
- `cart_items`: **legacy and unused** (the cart lives in `localStorage`).
- Framework tables: `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `sessions`, `password_reset_tokens`, `migrations`.

### Customizer tables (one garment = `CustomizerProduct`)
- `customizer_products`: `name`, `slug` (unique, normalised by `uniqueProductSlug`), `category` (string such as shirt, tops, trousers, jacket, coat, dress or skirt; default shirt), `gender`, `description`, `base_price`, `is_active`, `preview_image_path` (a `/assets/...` public path or a storage-relative path).
- `layer_categories` (an **attribute** such as Fit or Sleeves): `customizer_product_id` (cascade), `name`, `slug` (unique per product), `z_index`, `is_required`, `is_colorable`, `is_preview_layer` (default true; false means a labelled selector that paints nothing), `display_order`, `children_label`.
- `layer_options` (an **option**): `layer_category_id` (cascade), `parent_option_id` (self, set null; sub-options such as collar variants), `name`, `slug` (unique per category), `image_path` (nullable), `thumbnail_path`, `alt_image_path`, `back/left/right_image_path`, `color_hex`, `depicts` (JSON `attribute-slug → option-slug`; the cut the photo shows), `display_scale`, `price_modifier`, `is_default`, `is_active`, `display_order`.
- `layer_option_colors` (a **colourway** of an option, with its own photos): `layer_option_id` (cascade), `name`, `color_hex`, `image_path` (required), `back/left/right_image_path`, `is_default`, `display_order`.
- `fabrics`: `customizer_product_id` (null means global), `name`, `texture_image_path`, `color_hex`, `price_modifier`, `is_active`, `display_order`. Seeded garments have no fabrics.
- `saved_designs`: `user_id`, `customizer_product_id` (cascade), `name`, `configuration` (JSON `DesignConfiguration`), `preview_image_path`.

### Notable migrations
There are 67 in total, and production runs `migrate --force` on every deploy. Data migrations: `2026_05_19_082242_seed_admin_user`; `2026_08_07_000001_retire_legacy_customizer_products` (classic-shirt, woman-shirt and womens-top deleted); `2026_08_07_000002_normalize_customizer_product_slugs`; `2026_08_20_000002_deactivate_test_customizer_product` (`witeli-maika`); `2026_08_24_000001/000002` (retire style and sleeve-fit layers, remove women's sleeve sub-options); `2026_09_15_000001_backfill_payment_status_for_offline_orders`; `2026_09_17_000003_grandfather_existing_customer_registrations` (backfilled `terms_accepted_at`); `2026_09_24_000001_add_does_remodeling` (existing tailors set to true); `2026_09_28_000001_keep_order_items_when_product_deleted`. **Two files were once missing while recorded as run, and were restored under their original names**: `2026_08_07_000003_add_payment_fields` and `2026_08_24_000001_retire_style_and_sleeve_fit_layers`. Never delete or rename a migration that has run.

---

## 7. API reference

Base path `/api`. JSON in and out (send `Accept: application/json` so validation returns 422 JSON). Auth header: `Authorization: Bearer <raw token>`. Errors are `{message, code?, errors?}`; the frontend translates `code` and never shows `message`.

### 7.1 Throttle buckets
Every group has its **own named prefix**. Without one, inline throttles share a single counter, and 4-second chat polling used to starve order writes.

| Bucket | Limit | Applies to |
|---|---|---|
| inline per IP | 10, 20, 20, 10, 30 per min | `register/initiate`, `verify-email`, `verify-phone`, `resend`, `availability` |
| inline | 20 and 10 per min | guardian consent GET and POST |
| `login` limiter | 10/min keyed `email\|ip` | `POST /login` (**bug: the client sends `login`, not `email`**, see §15) |
| `admin-login` limiter | 5 per hour | `POST /admin/auth` |
| `api-flitt` | 120/min | Flitt callback |
| `api-reads` | 60/min per user | the authenticated read group |
| `api-payments` | 40/min | pay and verify-payment (`verify` is polled) |
| `api-writes` | 10/min per user | the authenticated write group (checkout sends one request per tailor; a 429 shows `cart.errorThrottled`) |
| `api-consent-resend` | 3 per 10 min | guardian consent resend |
| `api-customizer` | 30/min | saved designs |
| `api-admin` | 30/min | everything under `/admin` |

### 7.2 Public endpoints
| Method and path | Notes |
|---|---|
| `POST /register/initiate` | Body: `first_name, last_name, email` (required for customers), `phone` (`^\+\d{8,15}$`, unique), `password` (at least 8 characters and a digit) and `password_confirmation`, `role` (customer or tailor), `verify_via` (customers only: email or phone). Tailors also send `business_type, does_remodeling (bool), workspace_address, experience_band (under_1, 1_3, 3_5, 5_10 or over_10), legal_status, national_id` and the three `accept_*`/`confirm_*` consents (`exclude_unless:role,tailor`). Uniqueness failures return the codes `phone_taken` and `email_taken` inside `errors`. Creates a `verifications` row and sends a 6-digit OTP: **tailors always by SMS**, customers by their chosen channel. Returns `{verification_id, channel: 'email'\|'phone', email\|phone(masked)}`. |
| `POST /register/verify-email`, `POST /register/verify-phone` | `{verification_id, code}`. Five attempts; 410 if expired. Creates the user (tailor: `approval_status=pending`, `terms_accepted_at=now`) and returns `{token, user}` (email answers 200, phone 201). |
| `POST /register/resend` | `{verification_id, type}`. Only on the channel that was originally used (422 otherwise). At most 3 resends per type (429). Resets the attempt counter. |
| `POST /register/availability` | `{email?, phone?}` returns `{email_taken, phone_taken}`, used by the tailor wizard. |
| `GET` and `POST /guardian-consent/{token}` | Show `{customer_name, guardian_name, relationship}`, or record consent, which spends the token. An invalid or spent token returns 404 `consent_link_invalid`. |
| `POST /login` | `{login (email or phone; tolerant of spaces; a 9-digit local number gets +995), password, role}`. Returns 401 on bad credentials, 403 when suspended or when the role does not match (**admins may log in through any role page**). Issues a new token. |
| `POST /admin/auth` | `{email, password}` for admin accounts only |
| `GET /products` | Filters: `category` (slug), `customizable=1`, `size[]`, `colour[]` (exact JSON-contains on hex), `fabric[]` (LIKE), `gender=men\|women` (plus unisex), `search` (product name, category, tailor names), `min_price`, `max_price`, `sort` (default newest; price_asc, price_desc, name, popular, rating), `page` (at most 500). **Fixed 24 per page; `per_page` is ignored.** Returns a Laravel paginator. Each product has `category`, `tailor` (PUBLIC_TAILOR_COLUMNS only), `tailor_name`, `reviews_count`, `average_rating`. **Paused products are not filtered out.** |
| `GET /products/{id}` | `{product, related (up to 4 in the same category), shipping_cost}`. 404 when missing. |
| `GET /products/{id}/meta` | `{title, description, image}`. **Unused by the frontend.** |
| `GET /products/{id}/reviews` | Paginated (`per_page` at most 50): `{reviews[], average_rating, total, current_page, last_page}` |
| `GET /categories` | A plain array `[{id, name, slug, products_count, sample_image}]` (one random query per category) |
| `GET /tailors` | `?category=` or `?garment_type=` (fuzzy match against the categories of a tailor's products). Returns `{tailors:[{id, name, bio, specialty, years_experience, profile_image, products_count, reviews_count, avg_rating, is_available, turnaround_days, does_remodeling, starting_price}]}`. **Includes pending, rejected and suspended tailors** (see §15). |
| `GET /tailors/{id}` | `{tailor, products}` |
| `GET /reviews/landing` | Latest five 5-star reviews (the landing carousel falls back to static testimonials) |
| `GET /platform/stats` | `{tailors_count, customers_count, orders_count, avg_rating, reviews_count}` |
| `POST /payments/flitt/callback` | Flitt webhook; the signature is the trust boundary. **Always answers 200** (`{status: ok\|ignored}`) so Flitt does not retry. |
| `GET /customizer/products?gender=` | Active garments **that have at least one photographed colourway** (`isShowable`) |
| `GET /customizer/products/{slug}` | `{product, layer_categories, fabrics}`. Options are filtered to `availableOptionSlugs()` (§9.2). Fabrics are product-specific first, then global. |
| `POST /customizer/preview` | Server-side price check. **Unused (dead).** |

### 7.3 Authenticated reads (`auth.bearer`, `api-reads`)
| Endpoint | Who | Notes |
|---|---|---|
| `GET /me` | any | The user plus `may_place_orders`, `registration_complete`, `guardian_consent_pending`, `guardian_email` |
| `GET /customer/orders` | customer | Orders with items (`product_name` is the snapshot), `payment_status`, `custom_design_data`, `expected_price`, `needed_by`, `has_review`, `tailor_requests_count`, `tailor_name` |
| `GET /customer/orders/{id}/requests` | customer | Offers with the tailor's profile, `avg_rating`, `reviews_count` and `offered_price` |
| `GET /customer/orders/{id}/review-status` | customer | Unused |
| `GET /wishlist` | customer | `{products}` |
| `GET /customer/measurements` | customer | `{measurements: {}}` |
| `GET /notifications`; `POST /notifications/read-all`; `PATCH /notifications/{id}/read`; `DELETE /notifications/{id}`; `DELETE /notifications` | any | Latest 50 plus `unread_count`; mutations are scoped to the owner |
| `GET /tailor/orders` | tailor (approved) | Assigned orders through `formatOrder`, with the full measurement snapshot. **No `payment_status` is included** (see §15). |
| `GET /tailor/open-orders` | tailor (approved) | `pending_assignment` orders with no tailor. Custom orders go to everyone; remodels only when `does_remodeling`. **Privacy**: measurement values are stripped (only `measurements_count` is sent) and the customer appears by first name only. Each order carries `requests_count` and `my_request_status`. |
| `GET /tailor/stats` | tailor | `{avg_rating, reviews_count, profile_complete}` (complete means bio and specialty are filled) |
| `GET /tailor/products` | tailor | Their products through `formatProduct` (no order count) |
| `GET /orders/{id}/messages`; `GET /messages/counts` | the order's customer or tailor | Chat history, oldest first; per-order counts of messages from the other party (drives unread badges) |

### 7.4 Payments (`auth.bearer`, `role:customer`, `api-payments`)
- `POST /orders/{id}/pay` `{lang}`: the order must belong to the caller, be `marketplace`, be `unpaid` and have status in `PAYABLE_STATUSES = [pending, pending_assignment, processing]`. Returns `{token, checkout_url, order_number, amount, currency:'GEL'}`. Error codes: `order_not_payable_online` (422), `order_already_paid` (409), `order_not_payable` (409), `payment_start_failed` (502).
- `POST /orders/{id}/verify-payment`: asks Flitt about `payment_reference`; if approved, calls `markPaid`. Returns `{payment_status}`.

### 7.5 Authenticated writes (`auth.bearer`, `api-writes`)
| Endpoint | Who | Notes |
|---|---|---|
| `POST /register/profile` | customer (unfinished) | `date_of_birth` (before today), `accept_terms`, `accept_privacy`, optional `marketing_opt_in`; plus `guardian_name, guardian_email, guardian_phone, guardian_relationship` when aged 16–17 (these must not equal the account's own email or phone: `guardian_contact_is_own`). Under 16 returns 422 `below_minimum_age`; already complete returns 409. |
| `POST /register/guardian-consent/resend` | customer (minor) | Optional corrected `guardian_email`. Mints a new token and retires the old link. Also throttled 3 per 10 min. |
| `POST /orders` | customer | Gated by `mayPlaceOrders()`: 403 `registration_incomplete` or `guardian_consent_pending`. Body depends on `order_type` (§8.3–8.5). |
| `POST /customer/orders/{id}/choose-tailor` | customer | `{request_id}`; see §8.4 |
| `POST /reviews` | customer | `{order_id, rating 1–5, comment ≤1000}`. Only when the order is `delivered`; one per order (409 on a repeat). |
| `POST /uploads` | customer | `file` (jpg, jpeg, png, pdf or svg, at most 10 MB) stored under `designs/`; returns `{file_url}` |
| `POST /wishlist/{product}`, `DELETE /wishlist/{product}` | customer | Idempotent add and remove (**no UI adds**) |
| `PUT /customer/measurements` | customer | `{measurements}` replaces the whole set; an empty set clears it. Garment `length` is refused here. |
| `PATCH /tailor/orders/{id}/status` | the assigned tailor (approved) | `{status}`. Allowed transitions: pending→processing or cancelled; processing→finished or cancelled. Anything else returns 422. |
| `POST /tailor/orders/{id}/request` | tailor (approved) | `{message?, offered_price}`. The price is **required for remodels**. 409 when the order is closed, already offered on, or a remodel offered by a no-remodel tailor. |
| `PATCH /tailor/profile` | tailor (approved) | `bio, specialty, years_experience (0..year−1960), profile_image (URL), does_remodeling (sometimes, bool)` |
| `POST /tailor/products`; `PATCH /tailor/products/{id}`; `PATCH /tailor/products/{id}/status`; `DELETE /tailor/products/{id}` | the tailor who owns it | Fields: `name, description, price ≥1, category_id, gender, images[] (URLs), colors[], sizes[], fabric, texture, required_measurements[] (known keys), is_customizable, stock`. Saving with customization off stores `sizes=[]`. Status takes `{active\|paused}`. Delete returns 204, and order lines survive. |
| `POST /support-email` | any | `{subject, message ≤5000}`. 503 if `SUPPORT_EMAIL` is unset; 202 when stored but the mail failed. |
| `POST /upload/image`; `POST /upload/profile-image` | tailor | `image` (jpeg, png or webp, at most 5 MB) stored under `products/` or `profiles/`; returns `{url}` |
| `POST /tailor/id-document` | tailor | `document` (jpeg, png, webp or pdf, at most 10 MB) on the **private** documents disk. No URL is returned and any previous file is deleted. **There is no UI.** |
| `POST /orders/{id}/messages` | the order's customer or tailor | `{message ≤2000}`. Notifies the other party with `new_message`. |

### 7.6 Saved designs (`auth.bearer`, `role:customer`, `api-customizer`)
`GET`/`POST /customizer/designs` and `GET`/`PUT`/`DELETE /customizer/designs/{id}`. `StoreDesignRequest` validates that every option, sub-option and colour ID in `configuration` belongs to `product_id`, and that each colour belongs to the option it is keyed under. Selections are capped at 30.

### 7.7 Admin (`auth.bearer`, `auth.admin`, `api-admin`)
- `GET /admin/orders` (with `message_count` and `delivered_at`); `GET /admin/orders/{id}/messages` (read-only chat); `GET /admin/users` (including `guardian_consent_pending`).
- `PATCH /admin/orders/{id}/assign {tailor_id}`: a `pending_assignment` order becomes `pending` and the customer is notified. It also reassigns an order that already has a tailor; that keeps the status and notifies nobody.
- `PATCH /admin/orders/{id}/deliver`: only from `finished`; sets `delivered_at`, notifies the customer in Georgian and sends a status email.
- `PATCH /admin/users/{id}/suspend`: toggles suspension; admins cannot be suspended.
- `GET /admin/tailors/pending`: returns name, email, phone and date only, **not** the registration answers. `POST /admin/tailors/{id}/approve` sends an in-app `account_approved` notification and a dual SMS and email. `POST /admin/tailors/{id}/reject {reason?}` sends a dual SMS and email.
- **Customizer** (`/admin/customizer`): products CRUD (multipart `preview`, slug normalised); `categories` CRUD and `PUT categories/{id}/options/reorder`; `options` (`POST` multipart with `image` required, `back_image`, `left_image`, `right_image`; for updates send `POST …/options/{id}` with `_method=PUT` because the body is multipart); `PUT options/{id}/children/reorder`; `POST options/{id}/colors`; `PUT options/{id}/colors/reorder`; `PUT`/`DELETE options/colors/{colorId}`; `fabrics` CRUD. Reorder payloads are `{order:[ids]}`, which must be an exact permutation (422 otherwise).

---

## 8. Business flows

### 8.1 Customer registration (`/register/customer`)
1. Form (name, email, phone, password, and a verification channel of email or SMS) → `POST /register/initiate`. Server error codes are mapped back to the field they belong to.
2. `OtpStep` (6 digits, 60 s resend cooldown) → verify-email or verify-phone. The account is created, signed in, and `saveAuth` runs.
3. `CustomerProfileSteps`: date of birth as three fields → under 16 is refused; 16–17 shows the guardian block; terms and privacy are required, marketing is optional → `POST /register/profile`.
4. A minor gets a guardian email with the link `/guardian-consent/{token}` (page `GuardianConsent.tsx`). The token is stored only as a SHA-256 hash and is single-use. Asking again retires the old link. **Links never expire.** Until consent, `POST /orders` returns 403, and the customer dashboard shows a banner with a resend button (it reads `/api/me`, not the stored user).
The phone is used only for the one verification code; afterwards customers are contacted by email.

### 8.2 Tailor registration and approval (`/register/tailor`)
- A three-page wizard: (1) name, optional email, phone (`PhoneInput`, Georgia first), password; (2) business type, "do you take remodel work" (required yes/no radio), workspace address, years-of-experience band; (3) legal status, national ID, three consents. Before leaving page 1 the form calls `POST /register/availability`. Then initiate → **SMS** OTP → the account is created with `approval_status=pending`, and the page shows "Application submitted".
- `TailorDashboard` shows a pending or rejected gate screen and polls `/api/me` every 15 s. A rejected tailor's only button signs them out and goes home. An admin approves (in-app notification and dual SMS and email) or rejects with a reason (dual).
- The bank account in the original spec is deliberately not collected. The ID-document upload endpoint exists but nothing in the UI uses it, and no admin screen shows documents.
- The experience band is stored as the lower bound of its range in `years_experience`: under_1=0, 1_3=1, 3_5=3, 5_10=5, over_10=10.

### 8.3 Marketplace order (card-paid)
- **Single product** (`/product/:id` "place order", or `/product/:id/customize` with a customization note and measurements): `POST /orders {order_type:'marketplace', product_id, color, size, quantity, cm_measurements, customization_note, tailor_id}`. The size is sent only when the product is customizable and has sizes.
- **Cart checkout** (`/cart`): one request **per tailor group**, `{order_type:'marketplace', tailor_id, items:[{product_id, color, size, quantity}]}`. Each group's lines are removed from the cart as soon as that group succeeds, so retrying cannot double-order. The server rejects mixed tailors in one order (422).
- Server (`storeMarketplaceOrder`): normalises both payload shapes into `$lines`. **Recomputes prices from the database**, so cart prices are display only. Enforces `required_measurements` (422 `measurements_required` with `missing`; cart lines carry no measurements, so made-to-measure products must be bought from their own page). Totals stock per product and decrements it atomically inside a transaction (422 when out of stock). The tailor is the chosen `tailor_id`, otherwise the product's tailor, otherwise `randomTailor()` for demo products without a tailor (503 when none exists). Creates the order as `pending` and `unpaid`. **Nobody is notified at creation.**
- **Payment**: the product page immediately calls `POST /orders/{id}/pay` and redirects to Flitt's hosted page. If payment cannot start, the customer sees "order placed, pay from the dashboard". The **cart does not start payment**: the customer must use the "Pay" button on the dashboard. Flitt returns the customer with a POST to `/checkout/complete?order=…&id=…` → `PaymentComplete.tsx` calls `verify-payment` up to five times, 2 s apart.
- `markPaid` (from the webhook or the poll) checks order type, `payment_status=unpaid`, amount in tetri and currency `GEL`, then runs a conditional update (`where payment_status='unpaid'`). **Exactly one caller wins** and announces the order: the customer's `OrderConfirmation` email, the tailor's in-app `new_order`, and a dual SMS and email `NewOrderAlert`. A payment that lands on a non-unpaid order is logged for manual review, not credited.
- Cancelling an unpaid order sets `payment_status=expired`.

### 8.4 Custom design order (studio or upload)
- Studio path: `/design` wizard (§9) → `submitDesign()` writes the session draft (`garment_type` = the taxonomy `orderKey`, `customization` = `DesignConfiguration` plus `product_name`/`product_slug`, `estimated_price` = the configured total) → `/design/tailor-select` → `/design/review`.
- Upload path: `/design?upload=1` → pick a garment heading → `UploadPanel` (file through `POST /uploads`, optional customization request up to 1,000 characters, notes up to 500) → the same tailor-select and review steps.
- `TailorSelectStep`: either "Let Kere choose" (sets `assignment_mode=random`, which really means the open pool) or a specific available tailor from `GET /tailors?garment_type=`.
- `OrderReview`: shows the spec, collects measurements (prefilled from the profile, see §8.7) → `POST /orders {order_type:'custom', tailor_assignment_mode, tailor_id, custom_design_data:{garment_type, customization, design_file_url, tailor_notes, measurements?, customization_request?}}`.
- Server (`storeCustomOrder`): `payment_status=not_required`, `subtotal=0`, `total=shipping`. The price is agreed in chat and settled offline. **Every nested `customization.*` key needs its own validation rule**, because `validate()` drops unruled keys; this caused real data loss once. With a manually chosen and available tailor the order becomes `pending`, the tailor gets an in-app `new_order` and a dual SMS and email, and 409 means "tailor no longer available". Otherwise the order becomes **`pending_assignment`** and every approved, non-suspended tailor receives an in-app `open_order`. The customer always receives an `OrderConfirmation` email.
- **Offers**: a tailor sees the order in `AvailableDesigns` (picture cards; a studio design is re-photographed from its stored choices through `designPhoto.ts`) → `POST /tailor/orders/{id}/request` → the customer gets an in-app `tailor_request` and an email (SMS when there is no email) → in the customer dashboard modal (`TailorOffers`) the customer picks one → `choose-tailor` assigns the tailor, sets the order to `pending`, marks the chosen offer accepted and all others declined, notifies everyone in-app, and sends the chosen tailor a dual alert. It re-checks the tailor's approval and suspension (409).

### 8.5 Remodel order (`/remodel`)
- The form collects 1–6 photos (`POST /uploads`, at most 10 MB each; the browser accepts jpeg, png or webp, but the server rejects webp, see §15), the change request (required), name, phone, pickup and return address, city (default თბილისი), zip, an optional budget in ₾ (`expected_price`), an optional `needed_by` date (at least tomorrow; the server rule is `after:today`, and Georgia is UTC+4, so a date the form allows is never rejected), and body measurements (the profile keys, no garment length).
- Server: `RMD-` number, always `pending_assignment`, `not_required`. The `open_order` notification goes **only to tailors with `does_remodeling=true`**. Offers require a price. On `choose-tailor`, `subtotal = offered_price` and `total = offered_price + shipping`. Until then the customer sees "quoted by tailor".

### 8.6 Order status lifecycle
```
marketplace: pending(unpaid) ──pay──► pending(paid) ─┐
custom/remodel: pending_assignment ──offer chosen / admin assigns──► pending ─┤
                                                                              ▼
                     tailor: pending ──► processing ──► finished ──admin──► delivered ──► customer may review
                                 └──────────┴──► cancelled (from pending or processing)
```
- The tailor changes status with action buttons in the `OrdersList` order modal: **Accept** (pending→processing), **Mark finished** (processing→finished) and **Cancel** (from pending or processing). The customer is notified (in-app and `OrderStatusUpdated` email) on processing, finished and cancelled. `finished` also notifies every admin (`order_finished`, "ready for delivery").
- `shipped` exists in the schema and in UI label maps, but nothing sets it. Delivery is manual or off-platform: there is no courier integration, and an admin presses "mark delivered".
- Shipping is a flat `config('app.shipping_cost')` (`SHIPPING_COST`, default **₾15**) per order; a cart with several tailors pays it once per tailor. `OrderReview.tsx` hardcodes 15.

### 8.7 Measurements (one definition, `resources/js/data/measurements.json`)
- Fields in cm: chest 55–175, waist 45–165, hips 55–175, shoulder 30–65, sleeve 40–90 and inseam 25–110 (these six are kept on the profile); `length` 25–155 (garment length, asked per order only).
- Garment groups: top = chest, waist, shoulder, sleeve, length · bottom = waist, hips, inseam, length · skirt = waist, hips, length · dress = chest, waist, hips, shoulder, length · onepiece = chest, waist, hips, shoulder, inseam, length. `garmentTypes` maps keys such as shirt, tops, trousers, dresses, jumpsuits and suits to groups. A product's own `required_measurements` wins. Anything unknown asks for every profile field.
- Profile: `users.measurements` (hidden), through GET/PUT `/customer/measurements` and the `MyMeasurements` dashboard card. Every fitted order (studio, upload, remodel, made-to-measure marketplace product) prefills from it (`useOrderMeasurements`) and stores **its own snapshot**: `order_items.cm_measurements` for marketplace, `custom_design_data.measurements` for custom and remodel, normalised numbers, and the key omitted when empty. "Save to my profile" merges only the fields this garment asked for, is offered only once the profile has loaded, and a failed save stops the order.
- Privacy: bidding tailors see only `measurements_count` and the customer's first name. The assigned tailor sees the values. `MeasurementList` shows "No measurements provided — ask the customer in the chat" when there are none.
- `MeasurementGuideModal` has diagrams for chest, waist, hips and length plus a size chart. Shoulder, sleeve and inseam open on the first step.

### 8.8 Tailor/customer boundary
A signed-in tailor may only open `TAILOR_PAGES` = `/tailor-dashboard`, `/about`, `/partners`, `/become-a-tailor`, `/terms`, `/privacy`, `/refund-policy` (`lib/tailorAccess.ts`). `TailorScope` wraps **every** route and redirects anywhere else to `/tailor-dashboard`, so new pages are closed to tailors by default. The header hides the marketplace menu, search, bag and cart drawer for tailors. The API enforces the same boundary with `role:customer` on every buying route. The footer is Mariami's and is **not** tailor-filtered: a tailor clicking a shop link bounces back, which was accepted on 2026-09-28.

### 8.9 Notifications, chat and email
- `KereNotification` rows are created inline in controllers; there is no event system. Adding a trigger means calling `KereNotification::create` (or `OrderController::notify`) yourself.
- `NotificationBell` lives in the header (signed-in users only) and polls every 30 s. Opening it marks the shown items read. Items can be deleted individually or all at once.
- `OrderChat` sits inside the order modals of both dashboards and polls every 4 s. Unread badges come from `/api/messages/counts` minus `localStorage` `kere_chat_others_seen_<orderId>`. Admins read chats through the read-only endpoint.
- Emails go through Resend in production (HTTP API, because Railway blocks SMTP ports 465 and 587), from `noreply@kereforyou.com`. Tailor-facing alerts use `Notifier::dual`, because many tailors register without email.

### 8.10 Reviews, wishlist, saved designs, support
- Reviews: the dashboard's "★ Review" button appears on `delivered` orders without a review. `has_review` comes with `/customer/orders`. The product page shows only the average and count; review text appears nowhere since 2026-09-07, by the owner's choice. The landing `GuaranteeSection` shows the latest 5-star reviews or static fallbacks.
- Wishlist: the backend and the `/wishlist` page exist, but **nothing links to the page and nothing can add to it.**
- Saved designs: `SaveDesignModal` in the wizard calls `POST /customizer/designs`. `/my-designs` lists them, and "Edit" links to `/customize/{slug}?design={id}`, which redirects into the wizard with the saved configuration. **Nothing links to `/my-designs`.**
- Support: `POST /support-email` is used by the FAQ "ask a question" form and `EmailSupportModal`. The footer mounts that modal, but no link opens it. `/contact`'s form is **UI only** (it only sets `sent=true`). The newsletter popup and banner are **UI only** (no endpoint).

---

## 9. Design studio / customizer engine

### 9.1 Data model
`Section (men|women) → studio heading (garmentTaxonomy.ts) → garment (customizer_products) → attribute (layer_categories) → option (layer_options) → colourway (layer_option_colors)`
- `resources/js/data/garmentTaxonomy.ts` holds the only frontend-held level. Women's headings: tops (`tops`, `shirt`), bottoms, skirts, dresses, evening-dresses, jumpsuits, suits, blazers (`blazers`, `jacket`, `coat`). Men's: shirt, trousers, jacket, coat. Each entry has `productCategories` (which `customizer_products.category` values file under it) and `orderKey` (written to `draft.garment_type`; drives tailor matching and order labels).
- A men's or women's shopper sees their own gender plus `unisex` (server-side `whereIn`).

### 9.2 What is offered: availability comes from the photography
- `CustomizerProduct::isShowable()`: the garment has at least one option with colourways. `/customizer/products` lists only showable garments, so unphotographed garments are hidden and reappear automatically once photographed.
- `CustomizerProduct::availableOptionSlugs()`: a photographed option is available, and each photographed option's `depicts` pins the other attributes to the cut it shows. `show` filters options to that set. An attribute no photo speaks to is left whole ("silence is not absence").
- **Live catalogue as served (2026-10-04)**: women see `womens-t-shirt` (₾45) and `sleeveless-tank` (unisex). Men see the six `mens-*` garments and the tank. The T-shirt offers fit=body-fitting, length=cropped, neckline=crew and back-design=normal (one option each), plus **eight photographed sleeves** (sleeveless, cap, wide, dropped, oversized, puff, bell, balloon; all at +₾0, cap the default, burgundy the cover colour) and a 24-colour union. The other 16 women's Tops are seeded with full attribute lists but stay hidden until photographed.

### 9.3 Seeding rules (`WomensTopsSeeder`)
- `ATTRIBUTES` holds line-wide options and price modifiers (for example Longline +12, Turtle +8, Lace-up +20, Puff +16). `GARMENTS` narrows them per garment with `only`/`except`. The `photos` block holds the T-shirt shoot: `attribute: sleeves`, `TSHIRT_SLEEVES` (per sleeve: colour slugs, names and sampled hexes), `default: cap`, `cover: burgundy`, and `depicts`.
- Photographed options cost +₾0 on their garment (`$free`), so the opening total equals the "starting from" card price. Modifiers are rebased on the cheapest surviving option (`$cheapest`), so the advertised base price is always reachable.
- `TSHIRT_PALETTE` fixes the colour order (`display_order`). An unlisted colour **throws**. `PHOTO_VIEWS = front, back, left, right`. Today every colourway of all eight sleeves has all four angles (688 files in `WomanTshirtStudio/`: 23 colours each for sleeveless, cap, wide, oversized, puff and balloon; 20 for dropped; 14 for bell). `photoPath()` still returns null for any file that is absent, and the view switcher then offers only the angles that exist.
- Re-runs converge: `updateOrCreate`, retired options are deactivated (not deleted), and un-seeded attributes and colours **are deleted**. `start.sh` runs this on every deploy (see §15 about admin edits).

### 9.4 The wizard (`/design`, `pages/DesignerApp.tsx` and `components/customizer/DesignerWizard.tsx`)
- Steps: **01 Garment** (heading grid plus that heading's garments), **02 Shape** (attributes in `SHAPE_SLUGS` = fit, length, silhouette, rise, waist), **03 Details** (all other attributes except `collar`), **04 Colour** (colours, or fabrics when there are no colours), **05 Review** (`ReviewSheet`, Save and Reset). The i18n keys are still named `designer.stepFabric` and `designer.stepFit`, but they read "Colour" and "Review".
- `liveStepsFor()` drops a step that offers no real choice: 02 or 03 stay only while some attribute there has more than one option, and 04 only while there is more than one colour or fabric. The T-shirt therefore has four steps, and men's garments three. The rail (`StepRail`) carries explicit step indices. Continue and Back move to the next and previous live step.
- URL state: `?gender=`, `?cat=` (heading), `?garment=` (slug; arriving with it opens on step 02), `?design=` (reopen a saved design), `?upload=1`. `/customize/:slug` redirects to `/design?garment=…`.
- `useCustomizer` holds `selections` (category→option), `subSelections`, `colorSelections` (option→colour), `colorName` (**the garment's colour by name**, applied to every option shot in it), `fabricId` and `totalPrice` (base plus modifiers, computed client-side). Selections persist per slug in `sessionStorage` (`kere_customizer_selections`); a reopened saved design outranks the session copy. `getConfiguration()` returns the ID maps plus a readable `spec` snapshot (`[{attribute, option, price_modifier}]`, with colour as its own `Colour` line), which is what tailors read.
- The stage (`StagePanel` and `PreviewCanvas`) shows the photograph **only when it depicts the specified garment** (`designPhoto.ts → showsDesign()`): each painting layer has a photo, `depictsSelection()` matches the cut, and the colour matches `colorName`. Otherwise a "not photographed yet — still made to your measurements" placeholder appears on pattern paper. Everything stays orderable: photography is a preview, never a gate (owner decision, 2026-09-01).
- The tailor's view of a studio order re-photographs it through the same `designPhoto.ts` and `openOrders.ts → readStudioChoices()`. Older orders recover their colour from the spec's `Colour` line.
- Prices use `money()` (always two decimals, `+₾5.00` for modifiers). Cormorant Garamond has no ₾ glyph; `ProductCustomization` renders the sign in the UI face through `Lari()`.

### 9.5 Admin catalogue (`/admin/customizer`, `CustomizerAdminPage.tsx`)
Products (with preview image, category, gender, active flag), layer categories, styles (options) with rotation-view uploads, colour variants (front, back, left and right photos), sub-styles, and fabrics. Drag-reorder uses Motion `Reorder` with handles (`useDragControls`). Uploads go to the local `public` disk (see §15).

### 9.6 Photo pipeline (women's T-shirt)
Raw studio drop → `node scripts/import-studio-drop.mjs <drop-root> <sleeve>... [--dry-run]` renames files into masters at `public/assets/garments/New Tshirts/` (gitignored) using the convention `<fit>_<length>_<neckline>_<back-design>_<sleeve>_<colour>_<view>.png`. Views come from the numbered prefix 01–05, and unknown folder names throw. Then `node scripts/prepare-tshirt-photos.mjs [--dry-run|--hexes]` writes `WomanTshirtStudio/<sleeve>-<colour>-<view>.png` at 700×700, framed so the garment is 411 px tall and the shoulder line sits 38 px from the top, quantised; three-quarter views are dropped. `--hexes` prints sampled swatch hexes for the seeder. Then update `TSHIRT_SLEEVES` and re-seed. Both scripts need `sharp` (`npm i --no-save sharp`). Known photography caveats are in the seeder docblocks: the Fitted drop has a trimmer body, sleeveless neutrals were shot on a longer tank, and side views are less consistent.

---

## 10. Frontend reference

### 10.1 Routes (`resources/js/routes.tsx`)
Every route is wrapped in `ErrorBoundary → ScrollToTop (pathname only) → TailorScope`. `guard()` adds `RouteGuard`: it redirects to `/signin` when there is no token or user, and sends a user with the wrong role to their own dashboard.

| Path | Page | Guard |
|---|---|---|
| `/` | Landing | none |
| `/section?next=` | SectionSelect (men or women chooser; `next` must be a same-origin path) | none |
| `/design`, `/design/tailor-select`, `/design/review` | DesignerApp, TailorSelectStep, OrderReview (the last two redirect to login without a session) | none |
| `/marketplace` | Marketplace | none |
| `/cart` | CartPage (checkout redirects to `/signin` with return-to `/cart`) | none |
| `/wishlist` | WishlistPage | any signed-in user |
| `/remodel` | RemodelRequest | none (upload or submit sends you to login) |
| `/product/:id`, `/product/:id/customize` | ProductCustomization (`customize` prop) | none |
| `/signin`, `/login/:role`, `/register/customer`, `/register/tailor` | RoleSelection, Login, RegisterCustomer, RegisterTailor | none |
| `/tailor-dashboard`, `/customer-dashboard`, `/admin-dashboard` | dashboards | tailor, customer, admin |
| `/customize/:slug` | CustomizePage (redirect into the wizard) | none |
| `/checkout/complete` | PaymentComplete | none |
| `/guardian-consent/:token` | GuardianConsent | none |
| `/my-designs` | MyDesignsPage | any signed-in user |
| `/admin/login`, `/admin/customizer` | AdminLogin, CustomizerAdminPage | none, admin |
| `/about`, `/our-tailors`, `/help`, `/privacy`, `/terms`, `/refund-policy`, `/contact`, `/tailor/:id`, `/partners` (alias `/become-a-tailor`) | info pages | none |
| `*` | NotFound | none |
There is **no `/how-it-works` route**; it is a landing section with `#how-it-works`.

### 10.2 Browser storage keys
| Key | Store | Purpose |
|---|---|---|
| `kere_token` | **sessionStorage** | Raw API token. Cleared when the tab closes, and a new tab is signed out. |
| `kere_user` | localStorage | `AuthUser` JSON. `getAuthUser()` returns null when there is no token. |
| `kere_return_to` | localStorage | Where to go after a customer logs in |
| `kere_pending_order` | localStorage | A product-page order frozen across the login redirect |
| `kere_cart` | localStorage | Cart lines `{productId, name, price, image, size, color, quantity (≤99), tailorId, tailorName}`; a line is identified by product, size and colour. Synced across tabs. |
| `kere_custom_order_draft` | sessionStorage | The custom-order draft (`CustomOrderDraft`) |
| `kere_customizer_selections` | sessionStorage | Wizard selections per garment slug |
| `kere_section_market`, `kere_section_design`, `kere_section_upload` | localStorage | Remembered men or women choice per flow |
| `kere_lang` | localStorage | `ka` or `en` |
| `kere_analytics_consent` | localStorage | `granted` or `denied` |
| `kere_newsletter_seen` | localStorage | Newsletter popup dismissed (the Join banner's `kere:open-newsletter` event ignores it) |
| `kere_chat_others_seen_<orderId>` | localStorage | Chat unread tracking |
| `kere-profile-draft-<tailorId>` | sessionStorage | Tailor profile editor input kept across a 401 |
CSS variable published at runtime: `--kere-consent-h` (the consent banner's measured height; `body` reserves it).

### 10.3 Pages
| Page | What it does |
|---|---|
| `Landing` | `.kere-landing`. Sections in order: NewsletterPopup (opens after 450 ms once), Navigation, Hero (headline, draggable auto-scrolling gallery of **static** hero images, and three CTAs: Start your design → `/design`, Upload your design → `/design?upload=1`, Remodel → `/remodel`), MarketplaceCarousel (`#categories`; first 8 of `/api/products`; hidden entirely when there are no products), BrandStory, Features (sticky image, three guarantees), HowItWorks (`#how-it-works`, three steps, scroll-linked line), SizeFit (opens the measurement guide), Guarantee (testimonials), CTA, FAQ (`#faq`, plus an ask-a-question form through support-email), Join (newsletter banner), Footer. JSON-LD LocalBusiness. |
| `Marketplace` | `.marketplace-catalog-page`. The section is required (otherwise redirect to `/section`). Tabs All, Women, Men. Filter menus for category, colour, size, fabric and "more" (customizable, max price ₾50–500); sort; chips; "load more" pagination; skeletons; an error state with retry. Cards show a hover "quick buy" size strip that adds to the cart, or opens the product page when measurements are required. URL state: `gender`, `category`, `sort`. `WOMEN_ONLY_CATEGORY_SLUGS = ['dresses','skirts']` are hidden for men. |
| `ProductCustomization` | `.kere-product`, warm palette. A 4:5 gallery with a maker and rating strip; colour swatches; sizes (only when customizable); quantity; "Place order" (primary, goes straight to payment) and "Add to bag". Made-to-measure products cannot go in the bag. `/customize` adds a customization note (up to 1,000) and measurements. A signed-out order opens a login modal and saves the pending order. Distinct 404 and error branches. |
| `CartPage` | Groups lines by tailor, re-fetches each product for stock (flags deleted items), adds shipping per tailor, places orders sequentially (see §8.3), and shows a success list. `PaymentMarks` sit under the button. |
| `DesignerApp` / `DesignerWizard` | §9.4. The upload branch (`UploadTypeStep`, `UploadPanel`) keeps its own form chrome. |
| `TailorSelectStep`, `OrderReview` | Custom-order steps (§8.4). **Still on the old slate design** with a text "Kere" nav. |
| `RemodelRequest` | §8.5. `.remodel-page` with a gold texture hero. |
| `RoleSelection`, `Login`, `RegisterCustomer`, `RegisterTailor`, `AdminLogin`, `GuardianConsent` | Auth (§8.1, §8.2). Login sends `{login, password, role}`. After login: admin → `/admin-dashboard`, tailor → `/tailor-dashboard`, customer → return-to or `/customer-dashboard`. |
| `CustomerDashboard` | Orders list with status badges, an "awaiting payment" chip and a Pay button (`PAYABLE_STATUSES` mirrors the server). Order detail modal (details tab: spec, measurements, remodel photos, `needed_by`, offers through `TailorOffers`; messages tab: `OrderChat`). Review button, guardian consent banner, `MyMeasurements`, sign out. Slate styling. (`OrderReview` and `RemodelRequest` navigate here with `state.pendingAssignment`, but the dashboard never reads it.) |
| `TailorDashboard` | Approval gate screens. Profile card, `StatsCards` ("Total order value — all orders; not a payout balance"), `OnboardingPanel` "Start here" checklist, `TailorProfileEditor`, `ProductManager` (pause, edit, delete with an inline confirm and error state), `AvailableDesigns` (open requests as picture cards plus `OpenDesignDialog` offer form), `OrdersList`. Uses `.tailor-dashboard-page` and `.studio-*` classes. |
| `AdminDashboard` | Tabs: orders (assign a tailor, mark delivered when finished, read-only chat), unassigned (`pending_assignment`), pending tailors (approve, or reject with a reason), users (suspend toggle, guardian-pending marker). Links to `/admin/customizer`. |
| `CustomizerAdminPage` | §9.5 |
| `AboutUs`, `OurTailors` (`/api/tailors`), `HelpCenter`, `Contact` (company constants; UI-only form plus `EmailSupportModal`), `TailorProfile` (`/api/tailors/{id}`), `BecomePartner` (recruiting page: stats, tailor list, process; a signed-in tailor's CTAs go to the dashboard), `PrivacyPolicy` (`data/privacyPolicy.ts`), `TermsOfService` (merchant details block: name, ID code, address, phone, email), `RefundPolicy`, `NotFound`, `SectionSelect`, `PaymentComplete`, `MyDesignsPage` (slate), `WishlistPage` | Info and utility pages |

### 10.4 Key component notes
- `Navigation` (`.store-header`, fixed, 50 px, cream `--store-paper`): a burger menu below 1100 px (Radix Dialog), logo (`.kere-nav-logo`, a CSS mask of `/assets/brand/kere-wordmark.png` painted in `currentColor`), desktop nav (Marketplace mega-menu with `/api/categories` links and four products, Start designing, Remodel, About, For tailors), search dialog (`/api/products?search=`, 250 ms debounce), account icon, `NotificationBell` when signed in, bag with count, and EN/ქართ toggle. Mounts `CartDrawer`. Category names in the mega-menu are the English names from the API.
- `CartDrawer`: global, opened through `openCart()`; Esc closes it and body scroll is locked. Shows "you may also like" (`/api/products?per_page=8`). Exports `isHex()`, which renders hex colours as swatches.
- `AnalyticsConsent`: the bottom banner shows only when Clarity is configured and no choice is stored. ✕ records a refusal. It uses a `ResizeObserver` to publish `--kere-consent-h`.
- `ErrorBoundary` wraps every route. `ErrorFallback` is the shared retry block.
- `PaymentMarks`: the real Visa and Mastercard images (`/assets/payment/`). The caller supplies the label (`footer.weAccept`).
- `DesignSpecList` with `readSpec()` and `readProductName()` renders the studio spec for tailors and on the review page.

---

## 11. Design system and CSS gotchas

### 11.1 Tokens (current values in `resources/css/app.css`; README §8 is stale)
- Brand: `--color-brand: #631e26`, `--color-brand-dark: #4f1820` (Tailwind `bg-brand` and so on). `--primary` is still `oklch(0.42 0.13 25)`. `--destructive` is a red `hsl(0 84% 60%)`.
- Storefront (`:root`): `--store-paper #faf5ef` (cream page and header), `--store-ink #2a1418`, `--store-brand #6f1d24`, `--store-muted #715951`, `--store-rule #d9c9be`, `--store-gutter` and `--store-space` (clamps).
- `.kere-product` (the same block also names `.kere-market`, which no component uses any more): `--kd-burgundy #6f1d24`, `--kd-stage #f4ebe3`, `--kd-tile #fffcf8`, `--kd-ink #2a1418`, `--kd-body #6b4a4a`, `--kd-muted #9c7a73`, `--kd-hairline`, `--kd-rule`, `--kd-rule-soft`, and `.kd-display` in Cormorant Garamond.
- `.kere-designer` overrides the same tokens with ink and ivory: `--kd-burgundy #631e26`, `--kd-stage #eeeae0`, `--kd-tile #f4f0e9`, `--kd-ink #111111`, `--kd-body #514843`.
- Other families: `--kere-brand #631e26`, `--kere-panel*`, `--kere-ink`, `--kere-muted`, `--kere-burgundy #6F1D24`. The landing page uses `#E4E0D7` and `#F4F0E9` backgrounds with `#111111` text.
- Fonts, loaded in `app.blade.php`: `--font-sans` = Instrument Sans then Noto Sans Georgian; `--font-serif` = Newsreader then Noto Serif Georgian; Cormorant Garamond for `.kd-display`. Latin gets the editorial faces and Georgian falls back to Noto.
- Surfaces and class scopes: `.kere-landing`, `.marketplace-catalog-page` and `market-*`, `.kere-product`, `.kere-designer` and `designer-*`, `.design-page`, `.remodel-page`, `.kere-auth-page` and `kere-login-*`, `.kere-info-page`, `.kere-workflow-page` (the old slate pages), `.tailor-dashboard-page` and `studio-*`, `store-*` (header, menus, story), `kere-footer*`, `kere-hero*` and `kere-gallery*`.

### 11.2 Class conventions
Most newer UI uses hairline borders, square corners (`rounded-none`), uppercase eyebrow labels with letter-spacing, and serif display headings. The older generic pattern (white card `rounded-lg shadow-sm border-slate-200`, container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) survives on dashboards and workflow pages. Match the surface you are working on.

### 11.3 CSS gotchas (they change how components render)
1. **Every `<Button>` is sized to its label**: `[data-kere-button]:not([data-size=icon]), button[type=submit], .kere-button` get `width: fit-content !important; flex: 0 1 auto !important`. `w-full` on a Button loses unless you override it deliberately with a more specific rule.
2. **`variant="outline" | "secondary" | "link"` Buttons are restyled site-wide into underlined text links**: no border, transparent background, `#111` text, brand colour on hover. Use the `default` variant (wine fill) for a real filled button. Selected-state controls are raw `<button>`s or radios for this reason.
3. CTA sizing must key off the button contract (`data-kere-button`, `.kere-button`, submit), **never off `bg-brand`**. That once collapsed every selected tile and chip.
4. `button:not(:disabled)` gets `cursor: pointer` globally (Tailwind v4 Preflight dropped it).
5. Focus ring: `:where(a, button, summary):focus-visible` has a 1px brand outline.
6. Z-index ladder: header 100, cart drawer 110/120, newsletter overlay 130, store overlays and menus 160/161, consent banner 200, skip link 200.
7. The `.kere-site-header` rules (about lines 600–700 of `app.css`) style a header that no longer exists. They are dead CSS.

---

## 12. Third-party services and environment variables

| Service | Use | Configuration |
|---|---|---|
| **Railway** | Hosting: PHP server, PostgreSQL, and a queue worker started from `start.sh` | Nixpacks; `DATABASE_URL` is parsed into `DB_*` by `start.sh` |
| **Cloudflare** | Registrar, DNS and proxy for kereforyou.com, plus Resend DNS records | A long edge TTL for `/assets/*` was suggested but not confirmed |
| **Cloudflare R2** (S3 API) | User uploads. Disk `uploads` (public, served from `R2_PUBLIC_URL`) and `documents` (private, `private/` prefix). Without `R2_BUCKET`, the code falls back to the local `public` and `local` disks. | `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`, `R2_REGION` (default auto). The Evolution Log on 2026-09-24 treats production as already on R2. |
| **Resend** | Production email over HTTP (Railway blocks SMTP), from `noreply@kereforyou.com` | `MAIL_MAILER=resend`, `RESEND_KEY`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` |
| Gmail SMTP | **Local** `.env` mailer (real mail) | `MAIL_*` |
| **SMSOffice.ge** | SMS: OTPs, tailor alerts, the customer fallback. Sender "Kere". The API returns HTTP 200 even on rejection, so `SmsService` parses the body and logs `Success:false`. The balance must stay funded; it read 0 on 2026-09-24. | `SMSOFFICE_KEY` (empty means log only), `SMSOFFICE_SENDER=Kere`, `SMSOFFICE_URL` (default `https://smsoffice.ge/api/v2/send/`) |
| **Flitt** (pay.flitt.com) | Card, Google Pay and Apple Pay hosted checkout. Signature: `sha1(secret + '\|' + non-empty values sorted by key, joined by '\|')`, excluding `signature` and `response_signature_string`. Amounts in tetri, currency GEL, `lang` ka or en (default ka), reference `<order_number>_<random>`. | `FLITT_MERCHANT_ID` (4057819), `FLITT_SECRET_KEY` (the portal "Payment key"; **no fallback**: when unset, `isConfigured()` is false and pay returns 502), `FLITT_API_URL` (default `https://pay.flitt.com/api`) |
| **Microsoft Clarity** | Heatmaps and session replay **after consent** | The production project ID `xpi6r0az95` is baked into `lib/analytics.ts` and activates only on kereforyou.com. `VITE_CLARITY_PROJECT_ID` overrides it and is inlined at build time. |
| Google Fonts | Instrument Sans, Newsreader, Cormorant Garamond, Noto Sans and Serif Georgian | `<link>` in `app.blade.php` |
| Unsplash | Some `ClothingSeeder` demo images and a testimonial avatar (hotlinked; one is ORB-blocked) | |
| Twilio | Legacy and unused (the package is still in composer.json) | |

Other environment variables: `APP_KEY`, `APP_ENV`, `APP_URL` (used for consent links, the Flitt `response_url` and callback, and local upload URLs; production `https://kereforyou.com`, local `http://127.0.0.1:8000`), `APP_TIMEZONE=UTC`, `TRUSTED_PROXIES`, `SHIPPING_COST=15`, `SUPPORT_EMAIL` (support form recipient), `ADMIN_PASSWORD` (synced to `admin@kere.ge` on every deploy; `start.sh` has a hardcoded fallback if it is unset, so make sure it is set), `QUEUE_CONNECTION=database`, `SESSION_DRIVER=database`, `CACHE_STORE=database`. The local `.env` also contains `PRERENDER_TOKEN` and `PRERENDER_SERVICE_URL`, which no code reads.

---

## 13. Deployment and production

- **Railway via Nixpacks** (`nixpacks.toml`): php83 with pdo_pgsql and friends, nodejs_20 and composer. Install runs `composer install --no-dev --optimize-autoloader`, `npm ci` and `npm run build`. Start runs `bash start.sh` (the `Procfile` says the same).
- **`start.sh` on every deploy**: force `DB_CONNECTION=pgsql` and parse `DATABASE_URL` → `config:clear` → **`migrate --force`** → create or sync the admin `admin@kere.ge` (password `ADMIN_PASSWORD`, role admin) → `db:seed --class=ClothingSeeder` (a no-op when categories exist) → **`MensGarmentsSeeder` and `WomensTopsSeeder` (they converge the catalogue on every deploy)** → `storage:link --force` → `queue:work` in the background (sleep 3, tries 3, max time 3600) → `php artisan serve` on `$PORT` with `PHP_CLI_SERVER_WORKERS=8`.
- The container filesystem is replaced on every deploy, so anything written to local disk (`storage/app/public`) is lost. That is why uploads use R2; customizer admin uploads still do not (§15).
- Alternatives that are not used for production: `Dockerfile` (php:8.2-cli-alpine plus node, runs start.sh), `render-start.sh` (an old Render plus SQLite setup), `.devcontainer` (Codespaces: PHP 8.3 and Postgres 16, `migrate:fresh --seed`).
- CI (`.github/workflows`): `tests.yml` runs on PHP 8.4 and Node 22 (`npm ci`, build, `cp .env.example .env`, key:generate, `./vendor/bin/pest`). `lint.yml` runs `vendor/bin/pint`, `npm run format` and `npm run lint` (with auto-fix, but the commit step is commented out). Both run on pushes and PRs to `main` and `develop`.
- **Flitt go-live status**: live payments are on merchant 4057819, and card, Google Pay and Apple Pay were each confirmed with a real payment. **Still open**: switch Google Pay from TEST in the Flitt portal at go-live; regenerate the Payment key and Credit private key (both have been on screen); confirm that the checkout page renders in Georgian. **Not built**: the `orders:expire-unpaid` job (there is no scheduler at all); refunds and reversals (no path or state); distinguishing a gateway outage from a decline on `/checkout/complete`.
- SEO: `/sitemap.xml` (static URLs plus every product), real 404s for deleted products, Open Graph and Twitter tags in the blade shell, and JSON-LD (LocalBusiness on the landing page, Product on product pages). Per-page `<Helmet>` titles exist on most storefront and workflow pages, but these keep the default blade title: AboutUs, BecomePartner, Contact, HelpCenter, OurTailors, the three legal pages, NotFound, Login, RoleSelection, both Register pages and TailorDashboard.

---

## 14. Tests and quality gates

- Pest 3, `tests/Pest.php` (`RefreshDatabase` on `Feature`, plus the global helper `tailorPayload($override)`). `phpunit.xml` sets `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync` and **`SMSOFFICE_KEY=""`**, so tests never send real SMS.
- Test files. The counts are `it()` blocks; datasets in `MeasurementsTest`, `TailorCustomerBoundaryTest` and `TailorRemodelingTest` expand the run to 165. `CustomerOnboardingTest` (25: ages, guardian, hash-only token, spent link, gates, Tbilisi time), `PaymentControllerTest` (22: ownership, 409s, callback guards, amount and currency, POST return, language), `MeasurementsTest` (13), `FlittSignatureTest` (12), `TailorRegistrationTest` (11), `TailorRemodelingTest` (9: routing by `does_remodeling`, `needed_by`, studio order keeps `color_name`), `FlittPaymentReferenceTest` (7), `UploadStorageTest` (7: disk switch, private documents), `CustomerRegistrationTest` (6: channel choice), `PaymentNotificationTest` (5: announced once, on payment), `CatalogueTailorPrivacyTest` (4), `ProductDeletionTest` (3), `TailorCustomerBoundaryTest` (3 tests with datasets covering 14+ routes), `StorefrontSearchTest` (2), plus the two example tests.
- Gates that must stay green: `php artisan test`, `npm run typecheck`, `npx eslint` (0 errors; the 7 `exhaustive-deps` warnings in `CustomizerAdminPage`, `MyDesignsPage`, `OrderReview` and `TailorSelectStep` predate this file), `npm run build`, and locale parity. Then the browser check (§2.3).
- Testing tips: register flows read the OTP from the test or the SMS log; to exercise CSRF, make real HTTP requests outside the test harness; `Storage::fake` covers only the local-disk fallback, not R2 behaviour.

---

## 15. Known issues and tech debt (verified 2026-10-04)

None of these have been fixed. Fix them only when asked, or when they are directly in scope.

**Correctness, security and privacy**
1. **The login throttle keys on the wrong field.** `RateLimiter::for('login')` (`AppServiceProvider`) keys on `email|ip`, but `Login.tsx` posts `login`, so the key collapses to `|ip`: one shared bucket of 10 per minute for everyone behind an IP, and no per-account limit.
2. **Unapproved tailors leak and can be hired.** `GET /api/tailors` and `/tailors/{id}` (`TailorController`) return every tailor, including pending, rejected and suspended ones. They appear publicly on Our Tailors, Become a Partner and the tailor-select step. `storeCustomOrder`'s manual path checks only role and `is_available`, so an unapproved or suspended tailor can be assigned a custom order. `randomTailor()` (for demo products without a tailor) checks neither approval nor suspension.
3. **"Pause product" is cosmetic.** `products.status` is ignored by `/api/products`, the product page, related products, the tailor profile, the sitemap, the wishlist and `POST /orders`.
4. **Unpaid marketplace orders appear in the tailor's order list immediately** (`formatOrder` has no `payment_status`). A tailor can accept one before payment, even though their notification waits for payment.
5. Customizer admin uploads (`CustomizerAdminController`, `storeOption` and similar) write to the **`public` disk directly**, not `uploads_disk`, so they are lost on redeploy. `FabricResource` and the saved-design preview build `asset('storage/…')` URLs.
6. **`start.sh` re-seeds Mens and WomensTops on every deploy**: admin edits to seeded garments (name, description, price, preview, defaults, colours) are overwritten, and a seeded garment an admin deactivated is re-activated (`is_active => true`). `WomensTopsSeeder` also deletes attributes and colours that an admin added to its garments.
7. `ProductController::store` checks only `role === tailor`, not approval. A pending tailor could create products through the API.
8. There is **no password reset, change-password, customer profile edit or account deletion** anywhere.
9. Tokens never expire, there is one session per user, and the token lives in `sessionStorage`, so a 3-D Secure return into a new tab arrives signed out (`PaymentComplete` handles this).
10. Guardian consent links never expire, and an admin cannot resend one on a customer's behalf.
11. Tailor ID documents: the endpoint exists but has no UI, and no admin screen shows documents or the registration answers. On R2 the `private/` separation relies on bucket configuration, not code. Product image URLs are stored absolute, so changing `APP_URL` or `R2_PUBLIC_URL` breaks old rows.
12. In the designer's upload branch, `UploadPanel.handleFile` skips the upload when signed out but still enables Continue. After login, the order can go through with `design_file_url: null`.
13. **Remodel webp photos fail.** `RemodelRequest` accepts `image/webp` in the browser, but `POST /api/uploads` (`UploadController::design`) allows only jpg, jpeg, png, pdf and svg, so a webp photo is refused with Laravel's English 422 message.

**UX, i18n and design drift**
14. **Marketplace i18n regression**: colour, fabric and category labels render in English (`COLOUR_OPTIONS` labels, `FABRIC_OPTIONS`, API category names), although `marketplace.colours.*`, `.fabrics.*` and `.categories.*` exist in both locales and are unused. The Navigation mega-menu also shows English category names. Catalogue content (product names and descriptions, customizer attribute and option names, notification text) is English-only data.
15. **The marketplace colour filter cannot match**: its eight hex values (`#1B1B1B` and so on) are not in the tailor form's `PRESET_COLORS`, and no local product matches any of them. The size lists also disagree: the marketplace offers XXS and 3XL, while the tailor form has Custom.
16. `AddProductModal` hardcodes category IDs 1–6.
17. The cart never starts payment, and the success screen does not mention that payment is owed (the product page does go to payment).
18. Raw server `message` text can still reach the page in English: the `ProductCustomization` and `CartPage` fallbacks, `OrderReview`, Login 403 (suspended or wrong role), and upload errors in `DesignerApp` and `RemodelRequest`.
19. Dates other than `needed_by` use `toLocaleDateString`, which Chrome renders in English for Georgian. Use `formatCalendarDay` for new date displays.
20. Old slate styling and the text "Kere" logo remain on `TailorSelectStep`, `OrderReview`, `MyDesignsPage`, the customer, tailor and admin dashboards, and the email templates. Since the redesign, auth-form errors render in ink (`#2a1418`) rather than red.
21. Marketplace cards are `div onClick` rather than links, and their stagger delay is `0.04` (off-spec). Many raw styled `<button>`s come from Mariami's class-driven markup. There is no search input below `sm`.
22. Emails are English-only. The OTP email says "expires in 10 minutes", but codes live 30 minutes. Mail and SMS are sent synchronously (checkout took about 6 s per tailor order when measured).
23. Orphan routes and features: `/wishlist` (and there is no add button), `/my-designs`. The footer mounts `EmailSupportModal` but nothing opens it. `OrderReview` and `RemodelRequest` pass a `pendingAssignment` navigation state that the customer dashboard ignores. The contact form and both newsletter forms are UI-only. Unused endpoints: `/products/{id}/meta`, `/customizer/preview`, `/customer/orders/{id}/review-status`.
24. SEO: the static `public/robots.txt` (allow everything) shadows the dynamic `/robots.txt` route, so crawlers never get the sitemap pointer or the disallows. `sitemap.xml` lists `/how-it-works` (which shows the SPA NotFound page with HTTP 200) and includes paused products. Fifteen pages have no `<Helmet>` title (§13).
25. `/api/products` ignores `per_page`. `CategoryController` runs one random query per category.

**Housekeeping**
26. Dead code and dependencies are listed in §5.1 and §5.2. `public/images/garments/dress-maxi.png` and `WomanTshirtClassic/` are unreferenced. The `.kere-site-header` CSS is dead, and the `.kere-market` token scope has no users.
27. README §1–8 are stale; this file supersedes them.
28. There are seven ESLint `exhaustive-deps` warnings.

---

## 16. Branches, collaborators, pending work

- `main` is the only live branch and deploys to production. Local branches: `backup/main-before-mariami-merge`, `design/mariam-import`, `feature/customer-measurements` (merged), `flitt-payments`, `integrate-mariami-design`, `mariam-design-import`, `mariami` (stale).
- Remote design branches from Mariami (`mbadzaghua`):
  - **`origin/mariam-october`**, commit **`e5e4c31`, 2026-09-30, "Update Kere UI"**, is **not yet in `main`**. It changes only `app.css`: the mobile (640px and below) hero gallery gets a taller band (`clamp(320px, 82vw, 400px)`), larger images (`clamp(190px, 54vw, 280px)` wide) and new ellipse offsets. Its parent `b6e6ae6` was already imported on 2026-09-28 as `ec41042` plus the follow-up `11f263f`.
  - `origin/mariam-changes` (2026-09-22) was imported selectively on 2026-09-22. `origin/mariam-latest-update` (`b6e6ae6`) has been imported. `origin/mariami` is stale.
- `flitt-payments` (2026-08-11) holds the original embedded-checkout version and the `orders:expire-unpaid` job. `main` uses the hosted redirect instead, and the expiry job was never ported.
- Owner decisions on record: photography is a preview and never a gate on what can be ordered; review text was removed from product pages; legal pages stay readable to tailors; a tailor's home is the dashboard, not `/partners`; colour is one garment-wide choice; the navbar is single-tone; Mariami's footer is kept as she wrote it.

---

## 17. History timeline (details in README §9)

| Date (2026) | Milestone |
|---|---|
| 04-05 to 04-06 | Initial Laravel and React app, role auth with bearer tokens, marketplace, product page, tailor dashboard, custom design orders, Railway deploy |
| 04-10 to 04-11 | Notifications, reviews, cart (localStorage), persistent login with pending orders, measurement guide, move to PostgreSQL, transactional emails, SEO and sitemap, tailor public profiles, skeletons and error boundaries |
| 05-02 | Layer-based 2D customizer engine (customizer tables, admin, saved designs) |
| 06-03 | End-to-end custom order flow: tailor select, review, upload path, draft persistence |
| 06-07 | Resend email, kereforyou.com on Cloudflare |
| 06-27 | Tailor approval flow, brand overhaul (wine and Newsreader), live order chat, mobile customizer, legal pages translated |
| 07-12 | Phone-only tailor registration and phone login; red auth errors |
| 07-13 | Open order pool with tailor offers |
| 07-19 to 07-22 | Colour variants and rotation views in the customizer; per-group throttle buckets; Clarity behind consent; SMSOffice SMS and dual notifications; marketplace customization note |
| 07-23 | Men and Women sections |
| 08-01 to 08-12 | Mariami design imports, navbar and hero work, remodel service (08-04), men's garments, retired legacy customizer products, image compression, SEO fixes (08-07) |
| 08-13 | Real shopping cart: guest bag, drawer, `/cart`, checkout grouped by tailor |
| 08-20 to 08-31 | Women's designer (17 Tops), T-shirt photography and studio shoot, `depicts`, masters renamed to option slugs |
| 09-04 to 09-06 | `/design` becomes the 5-step guided wizard; typecheck fixed and wired (`npm run typecheck`) |
| 09-07 to 09-08 | Marketplace, product page and landing redesigns on the warm palette; QA and i18n pass |
| 09-13 / 09-22 | The "Fitted" drop: sleeveless and puff completed to 23 colours, then bell and balloon added; the designer offers only what photography covers |
| 09-14 / 09-25 | Flitt payments restored, then switched on for merchant 4057819 (405 on the return fixed, `lang` sent) |
| 09-17 | Customer age and guardian consent; three-page tailor registration wizard; English-leak fixes through server codes |
| 09-18 | Uploads to R2 object storage |
| 09-22 | Mariami's storefront redesign imported; wishlist backend; catalogue tailor-privacy fix (`PUBLIC_TAILOR_COLUMNS`) |
| 09-23 to 09-24 | Steps with nothing to choose are skipped; verify by email or SMS; tailor/customer boundary; tailors opt in to remodels; merchant identity published; open requests shown as pictures |
| 09-25 | Customer measurement profile and snapshots (released 09-28); catalogue descriptions enriched |
| 09-28 | Product deletion fixed on phones (order lines kept); Mariami's tailor studio redesign; empty marketplace hides the home strip |
| 09-29 | Storefront navbar single-tone, as Mariami designed it |
| 10-04 | Remodel requests take an optional "needed by" date (`lib/dates.ts`, `formatCalendarDay`) |
