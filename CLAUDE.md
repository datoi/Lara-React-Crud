# CLAUDE.md — Kere (kereforyou.com) knowledge base

**Read this first, before exploring code.** It describes the whole system as verified against the code on **2026-10-04** (commit `4868366`): what exists, where it lives, how it behaves, which rules apply, and what is known to be broken. Open the code only to confirm a detail or to change it.

- Detailed history (why things are the way they are): `CHANGELOG.md`, newest first. Until 2026-10-04 it was README §9, the "Project Evolution & Logic Log". `README.md` is now a conventional project introduction: overview, setup, commands, deployment and contributing. This file is the deep technical reference.
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
| Repo | `github.com/datoi/Lara-React-Crud`, **public**, default branch `main` (pushing to `main` deploys to production) |
| People | **datoi** is the owner and developer, and the person giving instructions. **Mariami** (git author `mbadzaghua`) is the designer; she pushes design work to `mariam-*` branches, which are imported selectively. |
| Stack | Laravel **12.56** JSON API (PHP ^8.2; local 8.2.12, production php83) and a React **19** SPA (TypeScript 5.7, React Router 7 `createBrowserRouter`, Tailwind CSS v4, Radix, Motion 12, i18next) built with Vite 6. **Not Inertia**: the Inertia starter-kit files are dead code. |
| Database | SQLite locally (`database/database.sqlite`), **PostgreSQL in production** (Railway). Tests use in-memory SQLite. |
| Language and currency | Georgian `ka` is the default, English `en` the fallback. All prices are Georgian Lari (₾, GEL). |
| Customer offerings | (1) **Marketplace**: ready-made pieces that Kere sells (tailors list them, unnamed). (2) **Design studio**: a 5-step guided designer at `/design`, plus "upload your own design". **Ordering from it is paused** until the terms cover custom orders (`CUSTOM_ORDERS_OPEN`); designing and saving stay open. (3) **Remodel**: alter a garment the customer already owns. |
| Seller model | **Kere is the only seller** (terms v1.1 and the privacy policy of 26 October 2026, revised for Flitt's merchant review). Tailors are Kere's contractors: never published, never chosen by the customer, no public ratings. Customers review delivered orders; Kere publishes a review only after an admin approves it, anonymously and as feedback on Kere (terms §20). Each tailor's score is internal: admins and the tailor alone. A tailor's price is an internal estimate; Kere makes the customer its own offer. The customer and the tailor each talk only to Kere. |
| Other roles | Tailor (dashboard, products, estimates for Kere on open requests); admin (orders, Kere's offers, both conversations of every order, users, tailor approval, customizer catalogue admin) |
| Payments | **Flitt** (formerly Fondy) hosted checkout, merchant **4057819**, live since 2026-09-25. Marketplace orders are paid in full; remodels in two halves (the first with the delivery fee when Kere's offer is accepted, the second when the work is finished). Custom orders (paused), and remodels accepted before 2026-10-13, are settled offline (`payment_status = not_required`). Admins refund through Flitt from the admin panel. |
| Health on 2026-10-29 | **239 Pest tests pass** (1,120 assertions), on SQLite and on PostgreSQL. `tsc --noEmit` is clean. ESLint: 0 errors, 4 pre-existing `exhaustive-deps` warnings. Locales: 1,663 keys each, in parity. 72 migrations, all run locally. 109 API routes. |

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
- **Emails** to customers and tailors are written in Georgian only, subject included (owner's rule, 2026-10-14). New ones extend `emails/layout.blade.php`.
- **i18n**: no hardcoded user-facing strings. `resources/js/locales/en.json` and `ka.json` must stay key-for-key identical, and both languages must render correctly. Never render a raw server message: the API sends a `code`, and `resources/js/lib/serverMessage.ts` maps it to a translation key.
- **Wording**: the person who orders is a **customer** (Georgian **მომხმარებელი**), never "client" or კლიენტი (owner's rule, 2026-10-11). Inflect the Georgian word by case: the stem drops its ე before a vowel ending (მომხმარებლის, მომხმარებლად, მომხმარებლები). An offer is **შეთავაზება**, never შემოთავაზება, in every form (შეთავაზებები, შეთავაზებული; owner's rule, 2026-10-14). The verb forms შემოგთავაზებენ / შემოგთავაზათ are a different word and were left as they are.
- **Design**: do not redesign unless asked. New UI must look like it belongs to Kere. When importing Mariami's design branches, the owner's rule is that **her design wins on layout and CSS, while `main`'s logic and shipped fixes are kept.** Import design only, keep every function her branch would remove, and accept the functions it adds.
- The storefront header is **single-tone cream** with dark text. Mariami confirmed this on 2026-09-29. Do not reintroduce the dark-section inversion.

### 2.3 Protocol
- **Living docs**: every shipped feature or fix gets a `CHANGELOG.md` entry at the top, headed `## YYYY-MM-DD — Title`. Use plain sentences in this structure: **What was done** (bullets), **Verified** (exactly what was run and observed), and **Not covered / Noticed**. Also update this CLAUDE.md when it is affected, and `README.md` when setup, commands, configuration or deployment change.
- **Verify before claiming done.** For backend work, run `php artisan test` and add feature tests. For frontend work, run `npm run typecheck`, `npx eslint <files>`, `npm run build` and check locale parity. **For UI changes, drive the real page in a browser**: Georgian and English, about 390px and desktop width, no console errors, and no horizontal overflow measured against `document.documentElement.clientWidth` (not `innerWidth`). Typecheck alone is not verification. If you cannot test something, say so plainly.
- **QA data hygiene**: delete any QA accounts, orders and products you create, and restore stock.
- **Never send real email, SMS or payments during QA.** The local `.env` holds live credentials (see §3.3).
- **Commits**: use a plain-English sentence that describes the outcome, for example "Let remodel customers say when they need the garment back" or "Keep saved measurements safe when the profile fails to load". Do not use conventional-commit prefixes. Commit and push only when asked.

### 2.4 QA engineer role (when asked to QA)
Verify independently; treat every "done" as a hypothesis. Drive the golden path in the browser, then probe edges: empty states, long text, missing images, failed or slow network, mobile widths, keyboard. For APIs, hit the real endpoint and check status codes, error shapes, unauthorized access and boundary values. Treat violations of §2.2 as bugs. Check adjacent features for regressions. Look for silent failures in the console and network tab. Report concrete repro steps (expected vs actual). Do not fix unless asked, and never call untested things verified.

### 2.5 Senior code reviewer role (when asked to review)
Review the actual diff line by line, including paths the author did not mention. Order findings by severity: correctness, security and data loss first, then regressions and edge cases, then convention violations, then style. Treat §2.2 as review gates. Watch for drift: two lists that must agree, copy-pasted logic, a new pattern where one already exists. Flag dead code, swallowed errors and a missing CHANGELOG entry. For each finding give file and line, the failure scenario and the fix direction, and mark it blocking or a nit. Do not rewrite unless asked.

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
| `DatabaseSeeder` | Test user `test@example.com` / `password` (factory; it has not completed onboarding, so it cannot order, see §15), then Clothing, SleevelessTank, MensGarments and WomensTops |
| `ClothingSeeder` | Six categories (IDs 1 dresses, 2 shirts, 3 pants, 4 jackets, 5 scarves, 6 hats) and 13 demo products with no tailor, some with Unsplash images. **Only runs when `categories` is empty.** |
| `SleevelessTankSeeder` | `sleeveless-tank` (men, ₾90, category `shirt`; photographed on a man, so menswear only since 2026-10-28): one "Style your own" layer, one `Sleeveless` option, nine colours from `/assets/garments/shirts/`; White has four views. **Not run by `start.sh`.** |
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
- **Frontend**: `resources/js/App.tsx` renders `HelmetProvider`, then `RouterProvider` (`routes.tsx`). Before that it expires the `_clck`/`_clsk` cookies and the `kere_analytics_consent` answer that Microsoft Clarity (removed 2026-10-28) left with returning visitors. There is no global state library. Small module stores use `useSyncExternalStore` (cart), and plain helper modules wrap `localStorage`/`sessionStorage` (auth, drafts, sections). Every request is a raw `fetch` with `Authorization: Bearer ${getAuthToken()}` and `Accept: application/json`; there is no shared API client.
- **i18n**: `resources/js/i18n.ts` initialises i18next with `lng = localStorage.kere_lang ?? 'ka'` and `fallbackLng: 'en'`. The header's language toggle writes `kere_lang`.
- **Notifications and chat poll; there are no websockets.** The bell polls every 30 s, order chat every 4 s while mounted, and a pending or rejected tailor polls `/api/me` every 15 s.
- **Mail and SMS are sent synchronously inside requests**, wrapped in try/catch that logs failures. The exception is the support email, which is queued.

---

## 5. Repository map

### 5.1 Backend (`app/`)
| Path | Responsibility |
|---|---|
| `Http/Controllers/Api/AuthController.php` | Registration (`registerInitiate`, `registerVerifyEmail`, `registerVerifyPhone`, `registerResend`, `availability`), `login` (email or phone), `adminLogin`, `me`. Also `attributesFor()` (shared user builder), `announceRegistration()` (queues `NewRegistration` to `REGISTRATION_ALERT_EMAIL` once an account is created, by either code), `EXPERIENCE_YEARS` band→years, `findByLogin`, `maskPhone`. |
| `Api/CustomerOnboardingController.php` | `completeProfile` (date of birth, terms, guardian), `resendConsent`, public `showConsent`/`recordConsent` (guardian link) |
| `Api/CustomerMeasurementController.php` | GET/PUT the signed-in customer's saved measurements |
| `Api/OrderController.php` | `store`, which dispatches to `storeMarketplaceOrder`, `storeCustomOrder` or `storeRemodelOrder`. Tailor side: `tailorOrders` (marketplace orders only once paid or settled offline: `Order::releasedToTailor`, which `tailorOrder()` applies to every step below too), `openOrders` (bid feed with privacy stripping), `requestOrder` (a tailor's estimate for Kere: price and `ready_in_days` both required; admins get `estimate_received`, the customer hears nothing), `updateStatus` (a paid remodel starts only after `received_at` and finishes with photos; cancelling goes through `Order::cancel`), `markReceived` (garment arrived: intake photos and notes, sets `due_date`), `proposeDueDate`. Also `formatOrder`, `openOrderTypesFor`, `withMeasurementSnapshot`, `randomTailor`. `storeCustomOrder` refuses with 409 `custom_orders_paused` unless `config('app.custom_orders_open')`, and always goes to the open pool; `storeMarketplaceOrder` takes the tailor from the product, never from the request. |
| `Api/CustomerOrderController.php` | `index` (customer's orders, with `payment_due`, the remodel steps, `cancellable`, `returnable_until`, `reportable` and claims), `acceptOffer` (Kere's offer: assigns the tailor behind it at Kere's price; a remodel becomes payable: deposit, total, `turnaround_days`), `declineOffer` (both name the offer by its `sent_at`: `refuseUnseenOffer`), `cancel` (through `Order::cancel`), `respondToDueDate`, `storeClaim` (return or problem) |
| `Api/PaymentController.php` | `pay` (mints a checkout URL for the stage `Order::paymentStageDue()` names), `verify` (client poll; answers `{payment_status, stage, settled}`), `callback` (Flitt webhook), `markPaid` (credits the stage the reference names, once, and records an `OrderPayment`), `recordLatePayment` (a payment the order no longer wanted: recorded for a refund, never credited), `announcePaidOrder`, `announceDeposit`, `announceBalance` |
| `Api/AdminController.php` | Orders list (with money, courier step, claims, tailors' `estimates` and Kere's `offer`), both order conversations (`orderMessages` by `channel`, `postMessage`), `sendOffer` (Kere's offer from one estimate), users, assign tailor (not a pending remodel: 409 `use_offer`), courier steps (`markPickedUp`, `shipOrder`, `deliverOrder`, all keyed off `nextCourierStep`), `refundOrder`, `claims`, `resolveClaim`, `reviews` and `updateReview` (publish or hide a review), suspend toggle, pending tailors, approve, reject |
| `Api/TailorController.php` | `updateProfile` only. There is no public tailor list or profile any more (terms §3). |
| `Api/MessageController.php` | Order chat, two conversations per order: the customer's with Kere and the tailor's with Kere (`messages.channel`). `index` and `store` work in the caller's own conversation, showing only the caller's messages and Kere's (`Message::visibleTo`), so a reassigned tailor never reads the previous one's; Kere's messages come back named "Kere"; a new message notifies the admins. A tailor has no conversation on an unpaid marketplace order. `counts` (Kere's messages only) |
| `Api/NotificationController.php` | List (latest 50 plus unread count), mark read, mark all read, delete one, delete all |
| `Api/ReviewController.php` | `store` (delivered orders only, one per order; starts `pending` and notifies the admins with `review_received`), `productReviews` (published reviews only, with no name; the average and count cover every review), `landing` (the latest six published reviews: text, rating and what was made, never the customer or the tailor), `orderReviewStatus` (unused) |
| `Api/UploadController.php` | `design` (customer file), `image`, `profileImage` and `orderPhoto` (tailor; a remodel's arrival and finished photos, under `order-photos/`), `tailorIdDocument` (private disk). Resolves disks through `config('filesystems.uploads_disk'/'documents_disk')`. |
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
| `Models/` | `User`, `Order`, `OrderItem`, `Product`, `Category`, `Review`, `Message`, `KereNotification` (`kere_notifications` table), `TailorRequest`, `Verification` (UUID primary key), `CustomizerProduct`, `LayerCategory`, `LayerOption`, `LayerOptionColor`, `Fabric`, `SavedDesign`, `OrderPayment` (one per card payment that went through: stage, gateway reference, amount, `refunded_amount`), `OrderRefund` (each refund request and Flitt's answer), `OrderClaim` (a return or problem report), `CartItem` (dead). `Review` holds `STATUSES` (pending, published, hidden), the `published()` scope, `publicSubject()` (order kind and, for a ready-made piece, its name) and `scoresForTailors()`, the one query behind every tailor score (average and count over all of a tailor's reviewed orders, joined through `orders.tailor_id`, published or not). `Order` holds the payment and aftercare rules: `isPaidRemodel`, `paymentStageDue`, `amountDue`, `isMadeToMeasure`, `returnableUntil`, `isCancellableByCustomer`, and Kere's offer: `hasOpenOffer`, `offerSummary`, `firstPaymentFor`, `clearOffer`. `Order::isReleasedToTailor()` and the `releasedToTailor()` scope are the one rule for what a tailor may see (a marketplace order only when `paid` or `not_required`). `Order::cancel($by)` is the one way to cancel: conditional on the status it was loaded with, `unpaid` becomes `expired` in SQL, a marketplace order's stock goes back, and admins get `refund_due` when money or a garment must go back. `User::canTakeWork()` (approved and not suspended) decides whether an estimate can become or stay Kere's offer. `Message::fromKere()` and `visibleTo()` scope the chat. `KereNotification::aboutOrder` and `toAdmins` send order notifications without throwing. |
| `Services/` | `FlittService` (signature, tokens per payment stage, status, `reverse` for refunds, language), `RefundService` (spreads an admin's refund over the order's payments, latest first, each reversed by its own reference, under a cache lock; a request Flitt never answered stays `pending` and is asked about again with its own `reverse_id` before anything new is sent), `SmsService` (SMSOffice.ge; logs when unconfigured), `OtpService` (6-digit code, email or SMS), `Notifier::dual()` (SMS always when a phone exists, plus email when present; never throws) |
| `Support/Measurements.php` | Reads `resources/js/data/measurements.json`: `keys()`, `profileKeys()`, `rules($path, profile)`, `normalize()`, `known()` |
| `Mail/` | `OtpCode`, `OrderConfirmation`, `NewOrderAlert`, `OrderStatusUpdated`, `TailorApproved`, `TailorRejected`, `OfferSent` (Kere's offer to the customer; names no tailor), `GuardianConsentRequest`, `SupportRequest`, `NewRegistration` (to Kere: a new customer or tailor, by name and role only, Georgian). Views are in `resources/views/emails/*.blade.php`. Every email to a customer or tailor is **Georgian only** and extends `emails/layout.blade.php` (`lang="ka"`, shared styles, slate header with a "Kere" text logo, a footer saying replies are not read and naming kereforyou@gmail.com). Subjects are Georgian too; status words match the dashboards. `SupportRequest` goes to Kere's own inbox and stays English. `OtpCode` states `Verification::LIFETIME_MINUTES`, the same constant the code's expiry uses. |
| `Console/Commands/EnrichProductDescriptions.php` | `catalogue:enrich-descriptions` |
| `Console/Commands/PurgeExpiredPersonalData.php` | `privacy:purge [--dry-run]`: the privacy policy's 90 days (§8.7) |
| `Providers/AppServiceProvider.php` | Forces HTTPS in production. Rate limiters `login` (10/min keyed `email\|ip`) and `admin-login` (5/hour keyed `email\|ip`). |
| **Dead backend code** | `CartController`, `DesignerController`, root `Http/Controllers/OrderController.php`, everything in `Controllers/Auth/*` and `Controllers/Settings/*`, `HandleInertiaRequests`, `routes/auth.php`, `routes/settings.php` (never loaded), the `CartItem` model and `cart_items` table. Unused Composer packages: `inertiajs/inertia-laravel`, `tightenco/ziggy`, `twilio/sdk`. |

Other backend files: `routes/console.php` (`inspire`, and the schedule: `privacy:purge` daily at 03:30 UTC; `start.sh` runs `schedule:work`), `config/services.php` (`smsoffice`, `flitt`, `support`, `resend`), `config/filesystems.php` (`uploads`/`documents` R2 disks plus the switch), `config/app.php` (`shipping_cost` = `SHIPPING_COST`, default 15).

### 5.2 Frontend (`resources/js/`)
| Path | Responsibility |
|---|---|
| `App.tsx`, `routes.tsx`, `i18n.ts` | Entry, router (see §10.1), i18n |
| `pages/` | One file per route (see §10.3) |
| `components/landing/` | `Navigation` (the site header on almost every page, which also mounts `CartDrawer`), `HeroSection`, `MarketplaceCarousel`, `BrandStorySection`, `FeaturesSection`, `HowItWorksSection`, `SizeFitSection`, `GuaranteeSection`, `CTASection`, `FAQSection`, `JoinSection`, `NewsletterPopup`, `Footer` |
| `components/customizer/` | The guided designer: `DesignerWizard`, `StepRail`, `StagePanel`, `PreviewCanvas`, `ViewSwitcher`, `ReviewSheet`, `WizardTiles`, `SaveDesignModal`, `PatternPaper`, `GarmentIcons`, plus `designPhoto.ts`, `depicts.ts`, `garmentColors.ts`, `money.ts`, `submitDesign.ts` |
| `components/tailor/` | `DashboardHeader`, `StatsCards`, `OnboardingPanel` (the "Start here" checklist), `TailorProfileEditor`, `ProductManager`, `AddProductModal`, `AvailableDesigns` (open-request picture grid), `OpenDesignDialog` (the estimate pop-up for Kere, Radix: price and days), `RemodelSteps` (a paid remodel from the tailor's side: arrival form, later-date form, `FinishWithPhotos`), `OpenDesignPicture`, `OrdersList` (order table and detail modal with status action buttons and chat), `openOrders.ts` (types, `readStudioChoices`, `GARMENT_KEYS`) |
| `components/measurements/` | `MeasurementFields`, `MeasurementList` (snapshot display), `MyMeasurements` (dashboard card), `OrderMeasurements` (per-order step) |
| `components/marketplace/` | `ProductImage` (shows an "image unavailable" mark on a missing or failed image), `ProductCardSkeleton` |
| Other components | `CartDrawer`, `NotificationBell`, `OrderChat`, `ReviewModal`, `EmailSupportModal`, `MeasurementGuideModal`, `ErrorBoundary`, `ErrorFallback`, `RouteGuard` (`RouteGuard` and `TailorScope`), `OtpStep`, `CustomerProfileSteps`, `PhoneInput`, `PaymentMarks`, `DesignSpecList`, `LegalDocumentPage`, `PhotoPicker` (pick, shrink and upload photos one by one; `onChange` is the parent's state setter, so updates apply to the latest list; also exports `PhotoGrid`), `customer/OrderAftercare` (`RemodelProgress`, `DueDateProposal`, `CancelOrder`, `ClaimsPanel`), `admin/OrderOperations` (`OrderOperations`: courier step, refund form; `ClaimsTab`), `admin/KereOffer` (`KereOfferForm`: the estimates, each with its tailor's score, and Kere's offer; `AdminOrderChat`: both conversations), `admin/ReviewsTab` (`ReviewsTab`: publish or hide reviews; `TailorScore`), `skeletons/*`, `ui/button.tsx` |
| `hooks/` | `useAuth` (auth, return-to and pending-order storage helpers), `useCart` (cart store and drawer state), `useSection`, `useCustomOrderDraft`, `useCustomizerSelections`, `useCustomizer`, `useProductData`, `useSectionGarments` (the studio catalogue for one section), `useProfileMeasurements`, `useOrderMeasurements` |
| `lib/` | `tailorAccess.ts` (`TAILOR_PAGES`, `TAILOR_HOME`), `reviewSubject.ts` (what a review is about, worded for the public and the admin tab), `serverMessage.ts` (code→i18n), `customOrders.ts` (`customOrdersOpen()`, read from the shell's `kere-custom-orders` meta tag), `dates.ts` (`formatCalendarDay`, `formatTimestampDay`, `tomorrowCalendarDay`), `photoUpload.ts` (`uploadPhoto`), `measurements.ts`, `shrinkPhoto.ts` (redraws a photo as a JPEG of at most 2000px before upload), `utils.ts` (`cn`) |
| `data/` | `garmentTaxonomy.ts` (studio headings per section), `measurements.json` (shared with PHP), `company.ts`, `countries.ts` (phone dial codes, Georgia first), `termsOfService.ts` and `privacyPolicy.ts` (the legal texts in both languages, kept outside the locales; see §10.4) |
| `types/customizer.ts` | API shapes for the customizer, `DesignConfiguration`, `DesignSpecLine` |
| `types/legal.ts` | `LegalDocument`, `LegalSection`, `LegalBlock`: the shape of the legal texts |
| `locales/en.json`, `locales/ka.json` | 61 namespaces, 1,663 keys each (2026-10-30) |
| **Dead frontend code** (unreachable from `App.tsx`, verified by import-graph analysis) | `components/ClothingTypeSelector`, `CustomizationPanel`, `FinalPreview`, `GarmentPreview`, `StudioBreadcrumb`, `SubcategorySelector`, `designer/GarmentSVG`, `designer/config.ts`, `designer/engine.ts`, `landing/CategoriesSection`, `marketplace/MarketplaceFilterRail`; the starter-kit `app-*`, `appearance-*`, `breadcrumbs`, `heading*`, `icon`, `input-error`, `nav-footer`; **every `components/ui/*` except `button.tsx`**; `hooks/use-appearance`, `use-initials`, `use-mobile*`; `types/index.ts`. Unused npm packages: `@inertiajs/react`, `@headlessui/react`, and the Radix packages used only by dead `ui/*` files (avatar, checkbox, collapsible, dropdown-menu, label, navigation-menu, select, separator, toggle, toggle-group, tooltip). Live Radix packages: `react-dialog` and `react-slot`. |

### 5.3 Other
- `resources/css/app.css` (2,171 lines): Tailwind v4 theme and every custom class (see §11).
- `resources/views/app.blade.php`: `<html lang="ka">`, default SEO, Open Graph and Twitter tags (`og-image.jpg?v=3`), favicons `?v=5`, the Google Fonts `<link>`, and `@vite`.
- `public/assets/`: brand, hero, garments (`ManElbowShirts`, `ManShortSleeve`, `ManTrousers{Cargo,Chino,Curdory,Dress}`, `shirts` (the tank), `WomanTshirtStudio` (868 derived T-shirt photos), `WomanTshirtClassic` (legacy, unreferenced), `WomanTshirtKere`, `WomanSweaterKere`), design-categories (cut-outs), partners, size-fit, payment (`visa.png`, `mastercard.png`), backgrounds, textures, catalog, editorial. **Gitignored masters**: `/garment-masters/`, `public/assets/garments/{Woman T-shirts,WomanTshirtCassic2,New Tshirts,01. Fitted-*,drive-download-*}`.
- `scripts/import-studio-drop.mjs` and `scripts/prepare-tshirt-photos.mjs`: the T-shirt photo pipeline (§9.6).
- `README.md`: the project introduction (overview, setup, commands, configuration, deployment, contributing checklist). `CHANGELOG.md`: the full history, newest first.
- `docs/qa-report-2026-07-23.md`: an old QA report.
- Deploy files: `nixpacks.toml`, `Procfile`, `start.sh`, `Dockerfile`, `render-start.sh` (legacy Render plus SQLite), `.devcontainer/` (Codespaces with Postgres 16), `.github/workflows/{lint,tests}.yml`.

---

## 6. Database schema

Production is PostgreSQL and local is SQLite. JSON columns are cast to arrays in the models.

**Enum gotcha:** `orders.status` and `users.approval_status` carry **PostgreSQL CHECK constraints** that SQLite does not enforce. A new status value passes local tests and **fails in production** unless a migration drops and re-adds the check on `pgsql`; copy the pattern in `2026_06_03_000001_extend_orders_custom_flow.php`. `role`, `order_type`, `payment_status`, `products.status`, `gender` and `tailor_requests.status` are plain strings.

### users
`id, name` (full name, legacy) · `first_name, last_name` · `email` (nullable, unique) · `phone` (nullable, unique, `+<digits>` such as `+995555…`) · `password` (`hashed` cast) · `role` (customer, tailor or admin; default customer) · `api_token` (SHA-256, unique, hidden) · `remember_token` · `email_verified_at` (unused) · tailor profile: `bio, specialty, years_experience (int), profile_image (URL), is_available (bool, default 1), turnaround_days (string), approval_status` (pending, approved or rejected; **null means a customer or a legacy tailor, treated as approved**) · tailor registration: `business_type` (independent, atelier, workshop or designer), `workspace_address`, `legal_status` (individual, sole_trader, llc or other), `national_id` (hidden), `id_document_path` (hidden), `does_remodeling` (nullable bool; null for non-tailors) · `is_suspended` (bool) · customer onboarding: `terms_accepted_at, date_of_birth, marketing_opt_in, guardian_name, guardian_email, guardian_phone, guardian_relationship` (parent or legal_guardian), `guardian_consent_token` (SHA-256, hidden, indexed), `guardian_consent_at` · `measurements` (JSON, **hidden**) · timestamps.
Model rules (`app/Models/User.php`): no public response carries a tailor at all (products send only the bare `tailor_id`, which the cart groups deliveries by); `PUBLIC_TAILOR_COLUMNS` was removed on 2026-10-28. `MINIMUM_AGE = 16`, `ADULT_AGE = 18`, and `AGE_TIMEZONE = 'Asia/Tbilisi'` (ages are counted in Georgia, not UTC). `registrationComplete()` is true for non-customers and otherwise requires `terms_accepted_at`. `needsGuardianConsent()` is true for ages 16–17. `mayPlaceOrders()` returns `registrationComplete() && (!needsGuardianConsent() || guardian_consent_at)`. `getFullName()`, `wishlistProducts()`.

### orders
`id` · `user_id` (FK users, **cascade**) · `tailor_id` (FK users, set null, indexed) · `order_number` (unique; `ORD-XXXXXXXX` for marketplace and custom, `RMD-XXXXXXXX` for remodel; 8 uppercase alphanumerics, never an underscore) · `order_type` (marketplace, custom or remodel) · `status` (pending_assignment, pending, processing, shipped, finished, delivered or cancelled; indexed) · `tailor_assignment_mode` (manual or random) · Kere's offer (terms §8): `offer_request_id` (the estimate it rests on; not a foreign key), `offer_price`, `offer_days`, `offer_note`, `offer_sent_at`, cleared when the customer declines · `payment_status` (unpaid, deposit_paid, paid, expired or not_required) · `payment_id` (Flitt) · `payment_reference` (unique; the latest checkout attempt: `<order_number>_<8 random lowercase>` for a full payment, `<order_number>_d-<8>` / `_b-<8>` for a remodel's first and second half) · `paid_at` · `deposit_amount` (remodel: half the price plus shipping) · `deposit_paid_at` · `subtotal, shipping, total` (decimals cast to float) · `expected_price` (remodel budget) · `needed_by` (date, cast `date:Y-m-d`; remodel) · remodel steps: `turnaround_days` (from the accepted offer), `due_date` (set on arrival), `proposed_due_date` (awaiting the customer), `picked_up_at`, `received_at`, `intake_photos` (JSON), `intake_notes`, `finished_photos` (JSON), `shipped_at` · `custom_design_data` (JSON) · `delivered_at` · `cancelled_at` · `measurements_purged_at` · `first_name, last_name, email, phone, address, city, state, zip, country` · `notes` · timestamps.
**Marketplace and custom orders store a placeholder address** (`address 'N/A'`, `city 'Tbilisi'`, `zip '0100'`, `country 'GE'`). Only remodel collects a real pickup and return address.

### order_items
`order_id` (cascade) · `product_id` (**nullable, set null** since 2026-09-28, so lines outlive deleted products) · `product_name` (snapshot; always display this) · `color` (a hex string) · `size` · `quantity` · `price` (unit price snapshot) · `custom_design` (unused) · `cm_measurements` (JSON snapshot) · `customization_note`.

### products (marketplace)
`category_id` (FK, **cascade**: deleting a category deletes its products) · `tailor_id` (FK, set null) · `name` · `slug` (unique, `str-slug-xxxxxx`; not used for routing, which uses the ID) · `description` · `price` · `colors` (JSON hex strings) · `sizes` (JSON) · `images` (JSON; tailor uploads are stored as **absolute URLs**, seeded demo products use `/assets/...` paths or Unsplash URLs) · `is_customizable` (default 1) · `is_featured` · `stock` (default 100) · `fabric` · `texture` · `required_measurements` (JSON measurement keys) · `status` (active or paused; **only cosmetic**, see §15) · `gender` (men, women or unisex; default unisex, indexed).

### categories
`name` (English), `slug` (unique), `description`, `image`. Seeded IDs: 1 dresses, 2 shirts, 3 pants, 4 jackets, 5 scarves, 6 hats.

### Social and support tables
- `kere_notifications`: `user_id` (cascade), `type`, `title`, `body`, `data` (JSON, usually `{order_id, …}`), `is_read`; index `(user_id, is_read)`. Types: `new_order`, `open_order`, `order_status`, `kere_offer` (to the customer), `request_accepted`, `request_declined`, `new_message`, `account_approved`; to admins: `order_finished`, `estimate_received`, `offer_accepted`, `offer_declined`, `offer_lapsed`, `courier_pickup`, `courier_return`, `refund_due`, `claim`, `review_received`. `tailor_request` is no longer created. Titles and bodies are stored as English text (some admin-triggered ones in Georgian) and shown as stored.
- `messages`: `order_id` (cascade, indexed), `sender_id` (cascade), `channel` (`customer`: the customer and Kere; `tailor`: the tailor and Kere; index `(order_id, channel)`), `message` (at most 2,000 characters).
- `reviews`: `order_id` (**unique**, cascade), `user_id`, `product_id` (nullable, set null; set only for marketplace orders, from the first item), `rating` (1–5), `comment`, `status` (pending, published or hidden; a plain string, indexed; reviews written before 2026-10-28 became pending, so none stayed public without approval).
- `tailor_requests` (tailors' internal estimates for Kere; the model and table keep the old name): `order_id`, `tailor_id` (unique pair), `message` (at most 500, for Kere), `offered_price`, `ready_in_days`, `status` (pending, accepted or declined).
- `order_payments`: `order_id` (cascade), `stage` (full, deposit or balance), `reference` (unique gateway order id), `gateway_payment_id`, `amount`, `refunded_amount`, `paid_at`. Paid marketplace orders from before 2026-10-13 were backfilled with their latest reference.
- `order_refunds`: `order_id`, `order_payment_id`, `amount`, `status` (pending, approved, processing or failed; pending means Flitt has not answered yet, and blocks new refunds on the order until it is settled), `reverse_id` (unique idempotency key, reused when a pending request is asked about again), `admin_id`, `note`, `response_code`.
- `order_claims`: `order_id`, `user_id`, `type` (return or problem), `message`, `photos` (JSON), `status` (open, resolved or rejected; indexed), `resolution_note`, `resolved_at`.
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
There are 72 in total, and production runs `migrate --force` on every deploy. Data migrations: `2026_05_19_082242_seed_admin_user`; `2026_08_07_000001_retire_legacy_customizer_products` (classic-shirt, woman-shirt and womens-top deleted); `2026_08_07_000002_normalize_customizer_product_slugs`; `2026_08_20_000002_deactivate_test_customizer_product` (`witeli-maika`); `2026_08_24_000001/000002` (retire style and sleeve-fit layers, remove women's sleeve sub-options); `2026_09_15_000001_backfill_payment_status_for_offline_orders`; `2026_09_17_000003_grandfather_existing_customer_registrations` (backfilled `terms_accepted_at`); `2026_09_24_000001_add_does_remodeling` (existing tailors set to true); `2026_09_28_000001_keep_order_items_when_product_deleted`; `2026_10_13_000001_add_remodel_payments_and_aftercare` (backfills `order_payments`); `2026_10_28_000001_add_kere_offers_and_chat_channels` (puts each existing message in its writer's conversation); `2026_10_28_000002_make_sleeveless_tank_menswear` (`sleeveless-tank` from unisex to men, because `start.sh` does not run its seeder); `2026_10_28_000003_add_status_to_reviews` (every existing review pending); `2026_10_29_000001_settle_pre_payment_marketplace_orders_offline` (unpaid marketplace orders created before 2026-09-25, when card payment went live, that a tailor had already taken on (processing, finished, shipped or delivered) become `not_required`; one still `pending` stays `unpaid` with its Pay button). **Two files were once missing while recorded as run, and were restored under their original names**: `2026_08_07_000003_add_payment_fields` and `2026_08_24_000001_retire_style_and_sleeve_fit_layers`. Never delete or rename a migration that has run.

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
| `api-tailor-uploads`, `api-tailor-uploads-daily` | 20/min and 100/day per tailor | `POST /upload/order-photo` |
| `api-uploads`, `api-uploads-daily` | 20/min and 100/day per user | `POST /uploads` (a remodel's up to ten photos are one request each, and must leave room in `api-writes` to place the order; the daily cap bounds what one account can put in the public bucket) |
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
| `POST /login` | `{login (email or phone; tolerant of spaces; a 9-digit local number gets +995), password, role}`. Returns 401 on bad credentials, 403 with `code` `account_suspended` or `wrong_role` (**admins may log in through any role page**). Issues a new token. |
| `POST /admin/auth` | `{email, password}` for admin accounts only |
| `GET /products` | Filters: `category` (slug), `customizable=1`, `size[]`, `colour[]` (exact JSON-contains on hex), `fabric[]` (LIKE), `gender=men\|women` (plus unisex), `search` (product name and category; never tailor names), `min_price`, `max_price`, `sort` (default newest; price_asc, price_desc, name, popular, rating), `page` (at most 500). **Fixed 24 per page; `per_page` is ignored.** Returns a Laravel paginator. Each product has `category`, the bare `tailor_id` (no tailor fields: terms §3), `reviews_count`, `average_rating`. **Paused products are not filtered out.** |
| `GET /products/{id}` | `{product, related (up to 4 in the same category), shipping_cost}`. 404 when missing. |
| `GET /products/{id}/meta` | `{title, description, image}`. **Unused by the frontend.** |
| `GET /products/{id}/reviews` | Paginated (`per_page` at most 50): `{reviews[], average_rating, total, current_page, last_page}`. `reviews[]` holds published reviews only, `{id, rating, comment, created_at}`, with no name; the average and total cover every review. |
| `GET /categories` | A plain array `[{id, name, slug, products_count, sample_image}]` (one random query per category) |
| `GET /reviews/landing` | The latest six published reviews: `{id, comment, rating, kind, product_name}` (`product_name` only for a ready-made piece). No customer and no tailor. |
| `GET /platform/stats` | `{tailors_count, customers_count, orders_count, avg_rating, reviews_count}` |
| `POST /payments/flitt/callback` | Flitt webhook; the signature is the trust boundary. **Always answers 200** (`{status: ok\|ignored}`) so Flitt does not retry. |
| `GET /customizer/products?gender=` | Active garments **that have at least one photographed colourway** (`isShowable`), as summaries only: the attribute tree is loaded to judge that, then dropped from the response (`show` sends it) |
| `GET /customizer/products/{slug}` | `{product, layer_categories, fabrics}`. Options are filtered to `availableOptionSlugs()` (§9.2). Fabrics are product-specific first, then global. |
| `POST /customizer/preview` | Server-side price check. **Unused (dead).** |

### 7.3 Authenticated reads (`auth.bearer`, `api-reads`)
| Endpoint | Who | Notes |
|---|---|---|
| `GET /me` | any | The user plus `may_place_orders`, `registration_complete`, `guardian_consent_pending`, `guardian_email` |
| `GET /customer/orders` | customer | Orders with items (`product_name` is the snapshot), `payment_status`, `custom_design_data`, `expected_price`, `needed_by`, `has_review`, and `offer` (Kere's offer while it is open: price, shipping, total, `first_payment` for a remodel, days, note). No tailor is named. |
| `GET /customer/orders/{id}/review-status` | customer | Unused |
| `GET /wishlist` | customer | `{products}` |
| `GET /customer/measurements` | customer | `{measurements: {}}` |
| `GET /notifications`; `POST /notifications/read-all`; `PATCH /notifications/{id}/read`; `DELETE /notifications/{id}`; `DELETE /notifications` | any | Latest 50 plus `unread_count`; mutations are scoped to the owner |
| `GET /tailor/orders` | tailor (approved) | Assigned orders through `formatOrder`, with the full measurement snapshot, `payment_status`, `paid_remodel` and the remodel steps. Marketplace orders appear only once paid, or when taken on before card payment went live (`not_required`). An unpaid one is not found by any tailor endpoint (404). |
| `GET /tailor/open-orders` | tailor (approved) | `pending_assignment` orders with no tailor. Custom orders go to everyone; remodels only when `does_remodeling`. **Privacy**: measurement values are stripped (only `measurements_count` is sent) and the customer appears by first name only. Each order carries `requests_count` and `my_request_status`. |
| `GET /tailor/stats` | tailor | `{avg_rating, reviews_count, profile_complete}` (complete means bio and specialty are filled). The rating is `Review::scoresForTailors()`: every reviewed order the tailor made, remodels included. |
| `GET /tailor/products` | tailor | Their products through `formatProduct` (no order count) |
| `GET /orders/{id}/messages`; `GET /messages/counts` | the order's customer or tailor | The caller's own conversation with Kere, oldest first: the caller's messages and Kere's only, Kere's named "Kere"; a tailor gets 403 on an unpaid marketplace order; per-order counts of Kere's messages to the caller (drives unread badges) |

### 7.4 Payments (`auth.bearer`, `role:customer`, `api-payments`)
- `POST /orders/{id}/pay` `{lang}`: the order must belong to the caller and owe a stage per `Order::paymentStageDue()`: `full` for an `unpaid` marketplace order in pending, pending_assignment or processing; `deposit` for an `unpaid` remodel that is `pending` with a tailor; `balance` for a `deposit_paid` remodel that is `finished`. Returns `{token, checkout_url, order_number, stage, amount, currency:'GEL'}`. Error codes: `order_not_payable_online` (422), `order_already_paid` (409), `order_not_payable` (409), `payment_start_failed` (502).
- `POST /orders/{id}/verify-payment`: asks Flitt about `payment_reference`; if approved, calls `markPaid`. Returns `{payment_status, stage, settled}`; the return page trusts `settled`.
- `markPaid` credits only the stage the reference names, checks the amount for that stage, and records an `OrderPayment`. A payment whose reference is already on record is ignored quietly (callback and poll); any other payment on an order already past that stage (cancelled, expired, or paid under another reference) is never credited: it is recorded as an `OrderPayment` so the refund button can return it, and the admins get `refund_due`.

### 7.5 Authenticated writes (`auth.bearer`, `api-writes`)
| Endpoint | Who | Notes |
|---|---|---|
| `POST /register/profile` | customer (unfinished) | `date_of_birth` (before today), `accept_terms`, `accept_privacy`, optional `marketing_opt_in`; plus `guardian_name, guardian_email, guardian_phone, guardian_relationship` when aged 16–17 (these must not equal the account's own email or phone: `guardian_contact_is_own`). Under 16 returns 422 `below_minimum_age`; already complete returns 409. |
| `POST /register/guardian-consent/resend` | customer (minor) | Optional corrected `guardian_email`. Mints a new token and retires the old link. Also throttled 3 per 10 min. |
| `POST /orders` | customer | Gated by `mayPlaceOrders()`: 403 `registration_incomplete` or `guardian_consent_pending`. Body depends on `order_type` (§8.3–8.5). A custom order answers 409 `custom_orders_paused` while `CUSTOM_ORDERS_OPEN` is off. |
| `POST /customer/orders/{id}/accept-offer` | customer | `{sent_at}`: the `sent_at` of the offer the customer saw. Accepts Kere's offer (409 `offer_changed` when Kere has replaced it since; 409 `no_offer` without one; 409 `offer_unavailable` when its tailor dropped out, which clears it and tells the admins). See §8.4 and §8.5. Answers with `payment_due`. |
| `POST /customer/orders/{id}/decline-offer` | customer | `{sent_at}`, as for accepting (409 `offer_changed`). Clears Kere's offer and tells the admins (`offer_declined`); the request stays open. |
| `POST /customer/orders/{id}/cancel` | customer | Allowed in `pending_assignment` or `pending` (work not begun); else 409 `order_not_cancellable`. Sets `cancelled_at`, `unpaid` becomes `expired`, a marketplace order's stock goes back, pending offers are declined; admins get `refund_due` when money was paid or the garment was collected. |
| `POST /customer/orders/{id}/due-date` | customer | `{accept}` answers the tailor's `proposed_due_date` (409 `no_date_proposed`). |
| `POST /customer/orders/{id}/claims` | customer | `{type: return\|problem, message, photos[]}`. Return: delivered marketplace order, not made to measure (422 `return_not_available`), within 14 days of `delivered_at` (422 `return_window_closed`), once (409 `claim_exists`). Problem: delivered order (422 `problem_not_available`), message and 1–10 photos, one open at a time. Admins get a `claim` notification. |
| `POST /reviews` | customer | `{order_id, rating 1–5, comment ≤1000}`. Only when the order is `delivered` (422 `review_not_delivered`); one per order (409 `review_exists`). Stored `pending`; the admins get `review_received`. |
| `POST /uploads` | customer | `file` (jpg, jpeg, png, webp, pdf or svg, at most 10 MB) stored under `designs/`; returns `{file_url}`. Throttled in its own `api-uploads` buckets, not `api-writes`. Every public upload is named by its detected content type (`$file->extension()`), never by the browser's file name, and an SVG is stored with `Content-Disposition: attachment` on R2. |
| `POST /wishlist/{product}`, `DELETE /wishlist/{product}` | customer | Idempotent add and remove (**no UI adds**) |
| `PUT /customer/measurements` | customer | `{measurements}` replaces the whole set; an empty set clears it. Garment `length` is refused here. |
| `PATCH /tailor/orders/{id}/status` | the assigned tailor (approved) | `{status, photos?}`. Allowed transitions: pending→processing or cancelled; processing→finished or cancelled. Anything else returns 422. A paid remodel cannot start before `received_at` (409 `garment_not_received`) and finishes only with photos (422 `photos_required`). Cancelling goes through `Order::cancel` like the customer's: it sets `cancelled_at`, puts marketplace stock back and tells admins when money is owed back. An unpaid marketplace order is 404. |
| `POST /tailor/orders/{id}/received` | the assigned tailor | `{photos[1..10], notes?}` once the courier collected a paid remodel (409 `not_awaiting_garment` otherwise). Sets `due_date` = today + `turnaround_days`. |
| `POST /tailor/orders/{id}/due-date` | the assigned tailor | `{due_date (after today), reason?}` proposes a later date (409 `no_due_date` without an agreed one). |
| `POST /tailor/orders/{id}/request` | tailor (approved) | `{message?, offered_price, ready_in_days}`. Price (1–99,999) and `ready_in_days` (1–120) are **required for every order**; the form asks for both on custom orders too. 409 when the order is closed, already offered on, or a remodel offered by a no-remodel tailor. |
| `PATCH /tailor/profile` | tailor (approved) | `bio, specialty, years_experience (0..year−1960), profile_image (URL), does_remodeling (sometimes, bool)` |
| `POST /tailor/products`; `PATCH /tailor/products/{id}`; `PATCH /tailor/products/{id}/status`; `DELETE /tailor/products/{id}` | the tailor who owns it | Fields: `name, description, price ≥1, category_id, gender, images[] (URLs), colors[], sizes[], fabric, texture, required_measurements[] (known keys), is_customizable, stock`. Saving with customization off stores `sizes=[]`. Status takes `{active\|paused}`. Delete returns 204, and order lines survive. |
| `POST /support-email` | any | `{subject, message ≤5000}`. 503 if `SUPPORT_EMAIL` is unset; 202 when stored but the mail failed. |
| `POST /upload/image`; `POST /upload/profile-image` | tailor | `image` (jpeg, png or webp, at most 5 MB) stored under `products/` or `profiles/`; returns `{url}` |
| `POST /upload/order-photo` | tailor | `image` (jpeg, png or webp, at most 10 MB) under `order-photos/`; returns `{url}`. Own `api-tailor-uploads` buckets. |
| `POST /tailor/id-document` | tailor | `document` (jpeg, png, webp or pdf, at most 10 MB) on the **private** documents disk. No URL is returned and any previous file is deleted. **There is no UI.** |
| `POST /orders/{id}/messages` | the order's customer or tailor | `{message ≤2000}`. Notifies the other party with `new_message`. |

### 7.6 Saved designs (`auth.bearer`, `role:customer`, `api-customizer`)
`GET`/`POST /customizer/designs` and `GET`/`PUT`/`DELETE /customizer/designs/{id}`. `StoreDesignRequest` validates that every option, sub-option and colour ID in `configuration` belongs to `product_id`, and that each colour belongs to the option it is keyed under. Selections are capped at 30.

### 7.7 Admin (`auth.bearer`, `auth.admin`, `api-admin`)
- `GET /admin/orders` (with `message_count`, `delivered_at`, the tailors' `estimates` (each tailor with its internal `score`, `{average, count}` or null), Kere's `offer`, and the order's `review` `{rating, status}`); `GET /admin/orders/{id}/messages?channel=customer|tailor` and `POST /admin/orders/{id}/messages {channel, message}` (Kere's side of both conversations; 422 `no_tailor` for the tailor one before there is a tailor); `GET /admin/users` (including `guardian_consent_pending`, and a tailor's `score`).
- `GET /admin/reviews` (waiting ones first, latest 300, with the order, what was made, the customer and the tailor) and `PATCH /admin/reviews/{id} {status: published|hidden}` (either can be undone).
- `POST /admin/orders/{id}/offer {request_id, price, days, note?}`: Kere's offer from one pending estimate; the admin sets the customer's price and days. 409 `order_not_open`, 422 `estimate_unavailable` (suspended or unapproved tailor). The customer gets `kere_offer` and the `OfferSent` email (SMS without an email). Sending again replaces the offer.
- `PATCH /admin/orders/{id}/assign {tailor_id}`: a `pending_assignment` order becomes `pending` and the customer is notified, except a remodel, which goes through Kere's offer (409 `use_offer`). It also reassigns an order that already has a tailor; that keeps the status and notifies nobody.
- Courier steps (terms §13), each allowed only when `nextCourierStep()` names it (409 `step_not_available`), which `/admin/orders` sends as `next_courier_step`: `PATCH /admin/orders/{id}/picked-up` (a paid remodel's garment collected, after the first payment), `PATCH /admin/orders/{id}/ship` (a finished, fully paid order handed to the courier: status `shipped`), `PATCH /admin/orders/{id}/deliver` (from `shipped`, or from `finished` for anything but a paid remodel; sets `delivered_at`, notifies the customer in Georgian and sends a status email).
- `POST /admin/orders/{id}/refund {amount, note?}`: `RefundService` reverses up to what is left (422 `refund_exceeds_paid`); 502 `refund_failed` with `refunded` when Flitt declines part way; 502 `refund_unresolved` when Flitt gives no answer (the request stays pending); 409 `refund_confirmed_earlier` with `refunded` when asking again showed an earlier unanswered refund went through (nothing new is sent); 409 `refund_in_progress`.
- `GET /admin/claims` (open first, latest 200) and `PATCH /admin/claims/{id} {status: resolved\|rejected, note?}` (409 `claim_closed`); the customer is notified with the note.
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
- **Single product** (`/product/:id` "place order", or `/product/:id/customize` with a customization note and measurements): `POST /orders {order_type:'marketplace', product_id, color, size, quantity, cm_measurements, customization_note}`. The size is sent only when the product is customizable and has sizes.
- **Cart checkout** (`/cart`): one request **per delivery** (the lines one tailor makes, grouped by the product's `tailor_id` and labelled "Delivery 1/2", never by name), `{order_type:'marketplace', items:[{product_id, color, size, quantity}]}`. Each group's lines are removed from the cart as soon as that group succeeds, so retrying cannot double-order. The server rejects mixed tailors in one order (422).
- Server (`storeMarketplaceOrder`): normalises both payload shapes into `$lines`. **Recomputes prices from the database**, so cart prices are display only. Enforces `required_measurements` (422 `measurements_required` with `missing`; cart lines carry no measurements, so made-to-measure products must be bought from their own page). Totals stock per product and decrements it atomically inside a transaction (422 when out of stock). The tailor is the product's tailor (a `tailor_id` in the request is ignored: terms §3), otherwise `randomTailor()` for demo products without a tailor (503 when none exists). Creates the order as `pending` and `unpaid`. **Nobody is notified at creation**, and the tailor does not see it until it is paid (terms §6).
- **Payment**: the product page immediately calls `POST /orders/{id}/pay` and redirects to Flitt's hosted page. If payment cannot start, the customer sees "order placed, pay from the dashboard". The **cart does not start payment** by itself: its success screen ("one step left: payment") lists each order with a Pay button, and the dashboard has one too. Flitt returns the customer with a POST to `/checkout/complete?order=…&id=…` → `PaymentComplete.tsx` calls `verify-payment` up to five times, 2 s apart.
- `markPaid` (from the webhook or the poll) checks order type, `payment_status=unpaid`, amount in tetri and currency `GEL`, then runs a conditional update (`where payment_status='unpaid'`). **Exactly one caller wins** and announces the order: the customer's `OrderConfirmation` email, the tailor's in-app `new_order`, and a dual SMS and email `NewOrderAlert`. A payment that lands on a non-unpaid order is logged for manual review, not credited.
- Cancelling an unpaid order sets `payment_status=expired` and puts the stock back. The customer can cancel while `pending` (before the tailor starts); money already paid is refunded by an admin.
- After delivery: a ready-made item (no measurements, no customization note) can be returned within 14 days (`OrderClaim` type `return`); any delivered order can get a problem report with photos (type `problem`). Admins answer both in the "Returns & problems" tab and refund from the order.

### 8.4 Custom design order (studio or upload)
**Paused since 2026-10-28** (owner's choice): the terms (§5) cover remodels and ready-made clothing only. The switch is `config('app.custom_orders_open')` (`CUSTOM_ORDERS_OPEN`, default off); the server refuses a custom order (409 `custom_orders_paused`), and `app.blade.php` states the switch in `<meta name="kere-custom-orders">`, which `lib/customOrders.ts` reads. While paused, the wizard's last step says ordering opens soon (designing and saving still work), the upload branch shows an "opens soon" page linking to remodels, and `/design/review` redirects to `/design`. What follows is how it works when reopened:
- Studio path: `/design` wizard (§9) → `submitDesign()` writes the session draft (`garment_type` = the taxonomy `orderKey`, `customization` = `DesignConfiguration` plus `product_name`/`product_slug`, `estimated_price` = the configured total) → `/design/review`.
- Upload path: `/design?upload=1` → pick a garment heading → `UploadPanel` (file through `POST /uploads`, optional customization request up to 1,000 characters, notes up to 500) → the same review step. There is no tailor-select step: the customer never chooses a tailor (terms §3).
- `OrderReview`: shows the spec, collects measurements (prefilled from the profile, see §8.7) and says Kere will price the design → `POST /orders {order_type:'custom', custom_design_data:{garment_type, customization, design_file_url, tailor_notes, measurements?, customization_request?}}`.
- Server (`storeCustomOrder`): `payment_status=not_required`, `subtotal=0`, `total=shipping`, always **`pending_assignment`**; every approved, non-suspended tailor receives an in-app `open_order`, and the customer an `OrderConfirmation` email. **Every nested `customization.*` key needs its own validation rule**, because `validate()` drops unruled keys; this caused real data loss once.
- **Estimates and Kere's offer** (terms §8): a tailor sees the order in `AvailableDesigns` (picture cards; a studio design is re-photographed from its stored choices through `designPhoto.ts`) → `POST /tailor/orders/{id}/request` (price and days) → admins get `estimate_received` → on the admin's "unassigned" tab an admin picks one estimate and sends Kere's offer (`KereOfferForm`) → the customer sees one offer (`KereOffer` on the dashboard) and accepts or declines → `accept-offer` assigns the tailor behind it, sets the order to `pending` at Kere's price, marks that estimate accepted and the others declined, and sends the tailor a dual alert. A custom order has no online payment yet, so it keeps `not_required`.

### 8.5 Remodel order (`/remodel`)
- The form collects 1–10 photos (jpeg, png or webp). Each is redrawn in the browser as a JPEG at most 2000px on its long side (`lib/shrinkPhoto.ts`; a photo it cannot decode, or that would not come out smaller, goes as it was) and sent on its own to `POST /uploads`, which has its own rate limit (`api-uploads`). Refused file types are set aside before the free places are counted. A failed photo is skipped and the rest still upload; every problem in the batch stays listed, translated. A 401 sends the customer to sign in (return-to `/remodel`), and a 429 stops the batch. The server rule is `remodel_images` `max:10`, mirrored by `MAX_IMAGES` in the form. It also collects the change request (required), name, phone, pickup and return address, city (default თბილისი), zip, an optional budget in ₾ (`expected_price`), an optional `needed_by` date (at least tomorrow; the server rule is `after:today`, and Georgia is UTC+4, so a date the form allows is never rejected). It does **not** ask for measurements (removed 2026-10-11 by the owner's choice). The server still accepts optional `custom_design_data.measurements`, and remodels placed before then keep theirs; tailor views show the measurements block on a remodel only when it has some.
- Server: `RMD-` number, always `pending_assignment`, `not_required` until an offer is accepted. The `open_order` notification goes **only to tailors with `does_remodeling=true`**. Tailors send Kere estimates (a price and `ready_in_days`), and an admin sends the customer Kere's offer (§8.4). Until it arrives the customer sees "Kere is reviewing your request".
- **Paid online since 2026-10-13** (terms §7, §8, §12, §13, §17; owner's choices: Flitt refund button, admin-run courier, delivery fee with the first half). On `accept-offer`: `subtotal = offer_price`, `total = offer_price + shipping`, `deposit_amount = Order::firstPaymentFor()` (half the price plus shipping), `payment_status = unpaid`, `turnaround_days = offer_days`; the customer goes straight to paying the first half. Its payment notifies the tailor (in-app and the dual alert, which used to go at choose time) and asks admins to book the courier (`courier_pickup`). Admin marks **picked up** → the tailor confirms **arrival** with photos and any existing damage (sets `due_date`) → **processing** → **finished** with photos → the customer pays the second half (`balance`; admins get `courier_return`) → admin **ships** → admin **delivers**. A later date is the tailor's proposal until the customer accepts it. Remodels accepted before 2026-10-13 keep `not_required` and the old steps.

### 8.6 Order status lifecycle
```
marketplace: pending(unpaid) ──pay──► pending(paid) ─┐
custom/remodel: pending_assignment ──offer chosen / admin assigns──► pending ─┤
                                                                              ▼
                     tailor: pending ──► processing ──► finished ──admin──► delivered ──► customer may review
                                 └──────────┴──► cancelled (from pending or processing)
```
- The tailor changes status with action buttons in the `OrdersList` order modal: **Accept** (pending→processing), **Mark finished** (processing→finished) and **Cancel** (from pending or processing). The customer is notified (in-app and `OrderStatusUpdated` email) on processing, finished and cancelled. `finished` also notifies every admin (`order_finished`, "ready for delivery").
- `shipped` is set by the admin's "handed to courier" step. There is no courier integration: Kere books the courier by hand and records each hand-over in the admin panel (pickup for a paid remodel, ship, deliver).
- Shipping is a flat `config('app.shipping_cost')` (`SHIPPING_COST`, default **₾15**) per order; a cart with several tailors pays it once per tailor. `OrderReview.tsx` hardcodes 15.

### 8.7 Measurements (one definition, `resources/js/data/measurements.json`)
- Fields in cm: chest 55–175, waist 45–165, hips 55–175, shoulder 30–65, sleeve 40–90 and inseam 25–110 (these six are kept on the profile); `length` 25–155 (garment length, asked per order only).
- Garment groups: top = chest, waist, shoulder, sleeve, length · bottom = waist, hips, inseam, length · skirt = waist, hips, length · dress = chest, waist, hips, shoulder, length · onepiece = chest, waist, hips, shoulder, inseam, length. `garmentTypes` maps keys such as shirt, tops, trousers, dresses, jumpsuits and suits to groups. A product's own `required_measurements` wins. Anything unknown asks for every profile field.
- Profile: `users.measurements` (hidden), through GET/PUT `/customer/measurements` and the `MyMeasurements` dashboard card. Every fitted order (studio, upload, made-to-measure marketplace product; remodels no longer ask) prefills from it (`useOrderMeasurements`) and stores **its own snapshot**: `order_items.cm_measurements` for marketplace, `custom_design_data.measurements` for custom (and for remodels placed before 2026-10-11), normalised numbers, and the key omitted when empty. "Save to my profile" merges only the fields this garment asked for, is offered only once the profile has loaded, and a failed save stops the order.
- Retention (privacy policy §13): `privacy:purge` deletes an order's measurement snapshot 90 days after it was delivered or cancelled, unless a claim on it is open, and sets `measurements_purged_at` (the dashboards then say so). Profile measurements stay until the customer clears them, as the policy now states.
- Privacy: bidding tailors see only `measurements_count` and the customer's first name. The assigned tailor sees the values. `MeasurementList` shows "No measurements provided — ask the customer in the chat" when there are none.
- `MeasurementGuideModal` has diagrams for chest, waist, hips and length plus a size chart. Shoulder, sleeve and inseam open on the first step.

### 8.8 Tailor/customer boundary
A signed-in tailor may only open `TAILOR_PAGES` = `/tailor-dashboard`, `/about`, `/partners`, `/become-a-tailor`, `/terms`, `/privacy`, `/refund-policy` (`lib/tailorAccess.ts`). `TailorScope` wraps **every** route and redirects anywhere else to `/tailor-dashboard`, so new pages are closed to tailors by default. The header hides the marketplace menu, search, bag and cart drawer for tailors. The API enforces the same boundary with `role:customer` on every buying route. The footer is Mariami's and is **not** tailor-filtered: a tailor clicking a shop link bounces back, which was accepted on 2026-09-28.

### 8.9 Notifications, chat and email
- `KereNotification` rows are created inline in controllers; there is no event system. Adding a trigger means calling `KereNotification::create` (or `OrderController::notify`) yourself.
- `NotificationBell` lives in the header (signed-in users only) and polls every 30 s. Opening it marks the shown items read. Items can be deleted individually or all at once.
- `OrderChat` sits inside the order modals of both dashboards and polls every 4 s. Each order has **two conversations, and Kere is in both** (terms §18): the customer's and the tailor's; neither sees the other's. Unread badges come from `/api/messages/counts` (Kere's messages) minus `localStorage` `kere_chat_seen_<orderId>` (`countOthersMessages` in `OrderChat`; the key replaced `kere_chat_others_seen_<orderId>` on 2026-10-29, whose counts were of the other party in the old shared chat). Admins open either conversation from the orders tab (`AdminOrderChat`, `OrderChat` with `adminChannel`) and answer in it; messages from either side notify the admins. A failed send says so.
- Emails go through Resend in production (HTTP API, because Railway blocks SMTP ports 465 and 587), from `noreply@kereforyou.com`. Tailor-facing alerts use `Notifier::dual`, because many tailors register without email.

### 8.10 Reviews, wishlist, saved designs, support
- Reviews (terms §20; owner's design, 2026-10-28): the dashboard's "★ Review" button appears on `delivered` orders without a review, and `has_review` comes with `/customer/orders`. The form tells the customer that Kere may show the review without their name, and asks them to leave out names and contact details. A review starts **pending**. An admin publishes or hides it in the "Reviews" tab, which shows the customer and the tailor. Only published reviews are public, on the home page (`GuaranteeSection`, not rendered when none is published; it used to show customers' full names and three invented testimonials) and on the product page (rating and text). Neither place names the customer or the tailor; the line under a review says what was made. Each tailor's score (`Review::scoresForTailors`) is shown only to admins, beside every estimate and in the users list, and to the tailor on their dashboard.
- Wishlist: the backend and the `/wishlist` page exist, but **nothing links to the page and nothing can add to it.**
- Saved designs: `SaveDesignModal` in the wizard calls `POST /customizer/designs`. `/my-designs` lists them, and "Edit" links to `/customize/{slug}?design={id}`, which redirects into the wizard with the saved configuration. **Nothing links to `/my-designs`.**
- Returns, problems and refunds: see §8.3 and §7.7. A refund goes back by Flitt `reverse` per payment; `processing` counts as refunded. A refund Flitt never answered stays pending and is asked about again with its own `reverse_id`, never sent anew; a payment that lands on a cancelled or already paid order is recorded so it can be refunded.
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
- **Live catalogue as served (2026-10-28)**: women see `womens-t-shirt` (₾45) only. Men see the six `mens-*` garments and `sleeveless-tank`. The T-shirt offers fit=body-fitting, length=cropped, neckline=crew and back-design=normal (one option each), plus **ten photographed sleeves** (sleeveless, cap, raglan, rolled (named "Rolled Cuff"), wide, dropped, oversized, puff, bell, balloon; all at +₾0, cap the default, burgundy the cover colour). Each sleeve offers only the colours it was photographed in, 24 across them all. The other 16 women's Tops are seeded with full attribute lists but stay hidden until photographed.

### 9.3 Seeding rules (`WomensTopsSeeder`)
- `ATTRIBUTES` holds line-wide options and price modifiers (for example Longline +12, Turtle +8, Lace-up +20, Puff +16). `GARMENTS` narrows them per garment with `only`/`except`. The `photos` block holds the T-shirt shoot: `attribute: sleeves`, `TSHIRT_SLEEVES` (per sleeve: colour slugs, names and sampled hexes), `default: cap`, `cover: burgundy`, and `depicts`.
- Photographed options cost +₾0 on their garment (`$free`), so the opening total equals the "starting from" card price. Modifiers are rebased on the cheapest surviving option (`$cheapest`), so the advertised base price is always reachable.
- `TSHIRT_PALETTE` fixes the colour order (`display_order`). An unlisted colour **throws**. `PHOTO_VIEWS = front, back, left, right`. Today every colourway of all ten sleeves has all four angles (868 files in `WomanTshirtStudio/`: 23 colours each for sleeveless, cap, raglan, wide, oversized, puff and balloon; 22 for rolled, which has no Red; 20 for dropped; 14 for bell). `photoPath()` still returns null for any file that is absent, and the view switcher then offers only the angles that exist.
- Re-runs converge: `updateOrCreate`, retired options are deactivated (not deleted), and un-seeded attributes and colours **are deleted**. `start.sh` runs this on every deploy (see §15 about admin edits).

### 9.4 The wizard (`/design`, `pages/DesignerApp.tsx` and `components/customizer/DesignerWizard.tsx`)
- Steps: **01 Garment** (heading grid plus that heading's garments; the grid offers only headings with a garment in the section's catalogue, names the rest under "Coming soon", and offers every heading again if the catalogue fails to load. The upload branch's heading picker always lists every heading), **02 Shape** (attributes in `SHAPE_SLUGS` = fit, length, silhouette, rise, waist), **03 Details** (all other attributes except `collar`), **04 Colour** (colours, or fabrics when there are no colours), **05 Review** (`ReviewSheet`, Save and Reset). The i18n keys are still named `designer.stepFabric` and `designer.stepFit`, but they read "Colour" and "Review".
- `liveStepsFor()` drops a step that offers no real choice: 02 or 03 stay only while some attribute there has more than one option, and 04 only while there is more than one colour or fabric. The T-shirt therefore has four steps, and men's garments three. The rail (`StepRail`) carries explicit step indices. Continue and Back move to the next and previous live step.
- URL state: `?gender=`, `?cat=` (heading), `?garment=` (slug; arriving with it opens on step 02), `?design=` (reopen a saved design), `?upload=1`. `/customize/:slug` redirects to `/design?garment=…`.
- `useCustomizer` holds `selections` (category→option), `subSelections`, `colorSelections` (option→colour), `colorName` (**the garment's colour by name**, applied to every option shot in it; derived: the customer's pick while the shown options were photographed in it, otherwise the colour the shown option's photo resolves to, so the pick returns when the customer goes back to a sleeve that has it), `colors` (`garmentColors()`: only the colours every option painting the canvas was photographed in), `fabricId` and `totalPrice` (base plus modifiers, computed client-side). Selections persist per slug in `sessionStorage` (`kere_customizer_selections`); a reopened saved design outranks the session copy. `getConfiguration()` returns the ID maps plus a readable `spec` snapshot (`[{attribute, option, price_modifier}]`, with colour as its own `Colour` line), which is what tailors read.
- The stage (`StagePanel` and `PreviewCanvas`) shows the photograph **only when it depicts the specified garment** (`designPhoto.ts → showsDesign()`): each painting layer has a photo, `depictsSelection()` matches the cut, and the colour matches `colorName`. Otherwise a "not photographed yet — still made to your measurements" placeholder appears on pattern paper. Cuts the photography does not cover stay orderable, because photography is a preview and not a gate (owner decision, 2026-09-01). **Colour is the exception (owner's rule, 2026-10-28)**: the colour step offers only photographed colours, so changing sleeve can change the list. Emerald is Cap's alone, Rolled Cuff has no Red, and Bell has 14. A colour therefore never produces the placeholder.
- The tailor's view of a studio order re-photographs it through the same `designPhoto.ts` and `openOrders.ts → readStudioChoices()`. Older orders recover their colour from the spec's `Colour` line.
- Prices use `money()` (always two decimals, `+₾5.00` for modifiers). Cormorant Garamond has no ₾ glyph; `ProductCustomization` renders the sign in the UI face through `Lari()`.

### 9.5 Admin catalogue (`/admin/customizer`, `CustomizerAdminPage.tsx`)
Products (with preview image, category, gender, active flag), layer categories, styles (options) with rotation-view uploads, colour variants (front, back, left and right photos), sub-styles, and fabrics. Drag-reorder uses Motion `Reorder` with handles (`useDragControls`). Uploads go to the local `public` disk (see §15).

### 9.6 Photo pipeline (women's T-shirt)
Raw studio drop → `node scripts/import-studio-drop.mjs <drop-root> <sleeve>... [--dry-run]` renames files into masters at `public/assets/garments/New Tshirts/` (gitignored) using the convention `<fit>_<length>_<neckline>_<back-design>_<sleeve>_<colour>_<view>.png`. Views come from the numbered prefix 01–05, and unknown folder names throw. The walk expects the full tree (`01. Fitted/01. Above the waist/01. Crew Neck/<sleeve>/<shape>/<colour>/`). A drop that arrives as bare shape folders (the 2026-10-28 Raglan and Rolled drop did) goes under the path its file names state. Before importing, check every frame by eye on contact sheets and run an md5 duplicate check: that drop filed two Raglan frames under Rolled and left one frame unnamed. Frames that cannot be used go to `garment-masters/withheld/`. Then `node scripts/prepare-tshirt-photos.mjs [--dry-run|--hexes]` writes `WomanTshirtStudio/<sleeve>-<colour>-<view>.png` at 700×700, framed so the garment is 411 px tall and the shoulder line sits 38 px from the top, quantised; three-quarter views are dropped. `--hexes` prints sampled swatch hexes for the seeder. Then update `TSHIRT_SLEEVES` and re-seed. Both scripts need `sharp` (`npm i --no-save sharp`). Known photography caveats are in the seeder docblocks: Sleeveless and Puff (from the Fitted drop) have a trimmer body than the other eight sleeves, sleeveless neutrals were shot on a longer tank, and side views are less consistent. `--hexes` takes the modal colour of the chest, so a ruched front can sample 12–16 levels darker or lighter than the dye. Raglan Red and Camel and several Balloon colours show this; see CHANGELOG 2026-10-28.

---

## 10. Frontend reference

### 10.1 Routes (`resources/js/routes.tsx`)
Every route is wrapped in `ErrorBoundary → ScrollToTop (pathname only) → TailorScope`. `guard()` adds `RouteGuard`: it redirects to `/signin` when there is no token or user, and sends a user with the wrong role to their own dashboard.

| Path | Page | Guard |
|---|---|---|
| `/` | Landing | none |
| `/section?next=` | SectionSelect (men or women chooser; `next` must be a same-origin path) | none |
| `/design`, `/design/review` | DesignerApp, OrderReview (redirects to `/design` while custom orders are paused, and to login without a session) | none |
| `/marketplace` | Marketplace | none |
| `/cart` | CartPage (checkout redirects to `/signin` with return-to `/cart`) | none |
| `/wishlist` | WishlistPage | any signed-in user |
| `/remodel` | RemodelRequest | none (upload or submit sends you to login) |
| `/product/:id`, `/product/:id/customize` | ProductCustomization (`customize` prop) | none |
| `/signin`, `/login/:role`, `/register/customer`, `/register/tailor` | RoleSelection, Login, RegisterCustomer, RegisterTailor | none |
| `/tailor-dashboard`, `/customer-dashboard`, `/admin-dashboard` | dashboards | tailor, customer, admin |
| `/customize/:slug` | CustomizePage (redirect into the wizard) | none |
| `/checkout/complete` | PaymentComplete (verify-payment until `settled`; says which half of a remodel was paid) | none |
| `/guardian-consent/:token` | GuardianConsent | none |
| `/my-designs` | MyDesignsPage | any signed-in user |
| `/admin/login`, `/admin/customizer` | AdminLogin, CustomizerAdminPage | none, admin |
| `/about`, `/help`, `/privacy`, `/terms`, `/refund-policy`, `/contact`, `/partners` (alias `/become-a-tailor`) | info pages | none |
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
| `kere_newsletter_seen` | localStorage | Newsletter popup dismissed (the Join banner's `kere:open-newsletter` event ignores it) |
| `kere_chat_seen_<orderId>` | localStorage | Chat unread tracking: how many of Kere's messages the caller has seen |
| `kere-profile-draft-<tailorId>` | sessionStorage | Tailor profile editor input kept across a 401 |
`/our-tailors` and `/tailor/:id` were removed on 2026-10-28 and now show `NotFound`.

### 10.3 Pages
| Page | What it does |
|---|---|
| `Landing` | `.kere-landing`. Sections in order: NewsletterPopup (opens after 450 ms once), Navigation, Hero (headline, draggable auto-scrolling gallery of **static** hero images, and three CTAs: Remodel a garment → `/remodel` (the filled main button, since remodelling is the only orderable service), Upload a design → `/design?upload=1` beside it, and Create a design → `/design` as the underlined text link below), MarketplaceCarousel (`#categories`; first 8 of `/api/products`; hidden entirely when there are no products), BrandStory, Features (sticky image, three guarantees), HowItWorks (`#how-it-works`, three steps, scroll-linked line), SizeFit (opens the measurement guide), Guarantee (published reviews, anonymous; not rendered when none is published), CTA, FAQ (`#faq`, plus an ask-a-question form through support-email), Join (newsletter banner), Footer. JSON-LD LocalBusiness. |
| `Marketplace` | `.marketplace-catalog-page`. The section is required (otherwise redirect to `/section`). Tabs All, Women, Men. Filter menus for category, colour, size, fabric and "more" (customizable, max price ₾50–500); sort; chips; "load more" pagination; skeletons; an error state with retry. Cards show a hover "quick buy" size strip that adds to the cart, or opens the product page when measurements are required. URL state: `gender`, `category`, `sort`. `WOMEN_ONLY_CATEGORY_SLUGS = ['dresses','skirts']` are hidden for men. |
| `ProductCustomization` | `.kere-product`, warm palette. A 4:5 gallery with a rating strip (no maker: terms §3), and a reviews section listing published reviews by rating and text, with no name; colour swatches; sizes (only when customizable); quantity; "Place order" (primary, goes straight to payment) and "Add to bag". Made-to-measure products cannot go in the bag. `/customize` adds a customization note (up to 1,000) and measurements. A signed-out order opens a login modal and saves the pending order. Distinct 404 and error branches. |
| `CartPage` | Groups lines into deliveries (by the product's `tailor_id`, labelled "Delivery 1/2", never by name), re-fetches each product for stock (flags deleted items), adds shipping per delivery, places orders sequentially (see §8.3), and shows a success screen ("one step left: payment") with a Pay button per order. `PaymentMarks` sit under the buttons. |
| `DesignerApp` / `DesignerWizard` | §9.4. The upload branch (`UploadTypeStep`, `UploadPanel`) keeps its own form chrome. |
| `OrderReview` | The custom-order step (§8.4; paused). **Still on the old slate design** with a text "Kere" nav. |
| `RemodelRequest` | §8.5. `.remodel-page` with a gold texture hero. |
| `RoleSelection`, `Login`, `RegisterCustomer`, `RegisterTailor`, `AdminLogin`, `GuardianConsent` | Auth (§8.1, §8.2). Login sends `{login, password, role}`. After login: admin → `/admin-dashboard`, tailor → `/tailor-dashboard`, customer → return-to or `/customer-dashboard`. |
| `CustomerDashboard` | Orders list with status badges, a payment chip and Pay button driven by the server's `payment_due` (full, first or final payment). Order detail modal (details tab: spec, measurements, remodel photos, `needed_by`, Kere's offer through `KereOffer` (price, delivery, total, days, note, first payment; accept goes straight to the first payment, or decline), with the status badge reading "Offer ready" while one is open; `RemodelProgress` steps with arrival and finished photos; `DueDateProposal`; refunded amount; `CancelOrder`; `ClaimsPanel` for returns and problem reports; messages tab: `OrderChat`). Review button, guardian consent banner, `MyMeasurements`, sign out. Slate styling. (`OrderReview` and `RemodelRequest` navigate here with `state.pendingAssignment`, but the dashboard never reads it.) |
| `TailorDashboard` | Approval gate screens. Profile card, `StatsCards` ("Total order value — all orders; not a payout balance"), `OnboardingPanel` "Start here" checklist, `TailorProfileEditor`, `ProductManager` (pause, edit, delete with an inline confirm and error state), `AvailableDesigns` (open requests as picture cards plus `OpenDesignDialog`, the estimate form for Kere), `OrdersList` (a paid remodel adds `RemodelSteps` and finishes through `FinishWithPhotos`). Uses `.tailor-dashboard-page` and `.studio-*` classes. |
| `AdminDashboard` | Tabs (wrapping on phones): orders (assign a tailor, except a pending remodel; `OrderOperations`: the next courier step, paid and refunded amounts, refund form, refund-due and open-claim markers; both conversations through `AdminOrderChat`), unassigned (`pending_assignment`, with `KereOfferForm`: the tailors' estimates and Kere's offer), returns & problems (`ClaimsTab`), reviews (`ReviewsTab`, with a badge counting reviews waiting), pending tailors (approve, or reject with a reason), users (suspend toggle, guardian-pending marker, a tailor's score). Links to `/admin/customizer`. |
| `CustomizerAdminPage` | §9.5 |
| `AboutUs`, `HelpCenter`, `Contact` (company constants; UI-only form plus `EmailSupportModal`), `BecomePartner` (recruiting page: stats and process, no tailor list; a signed-in tailor's CTAs go to the dashboard), `PrivacyPolicy` and `TermsOfService` (`LegalDocumentPage` over `data/privacyPolicy.ts` and `data/termsOfService.ts`; the terms add the merchant details box after the appendix: name, ID code, address, phone, email), `RefundPolicy`, `NotFound`, `SectionSelect`, `PaymentComplete`, `MyDesignsPage` (slate), `WishlistPage` | Info and utility pages |

### 10.4 Key component notes
- `Navigation` (`.store-header`, fixed, 50 px, cream `--store-paper`): a burger menu below 1100 px (Radix Dialog), logo (`.kere-nav-logo`, a CSS mask of `/assets/brand/kere-wordmark.png` painted in `currentColor`), desktop nav (Marketplace mega-menu with `/api/categories` links and four products, Start designing, Remodel, About, and For tailors, set apart by a hairline rule in wine and heavier type, `.store-nav-tailors`, which also marks it in the phone menu), search dialog (`/api/products?search=`, 250 ms debounce), account icon (when signed in, the first name beside it, or "Admin" for an admin, from 768 px up; phones show the icon only), `NotificationBell` when signed in, bag with count, and EN/ქართ toggle. Mounts `CartDrawer`. Category names in the mega-menu are the English names from the API.
- `CartDrawer`: global, opened through `openCart()`; Esc closes it and body scroll is locked. Shows "you may also like" (`/api/products?per_page=8`). Exports `isHex()`, which renders hex colours as swatches.
- `ErrorBoundary` wraps every route. `ErrorFallback` is the shared retry block.
- `PaymentMarks`: the real Visa and Mastercard images (`/assets/payment/`). The caller supplies the label (`footer.weAccept`).
- `DesignSpecList` with `readSpec()` and `readProductName()` renders the studio spec for tailors and on the review page.
- `LegalDocumentPage` draws a `LegalDocument` (terms, privacy policy): title, version and dates, a contents list (pinned on wide screens, a disclosure on phones), and sections with paragraphs, subheadings, lists and tables. E-mail and web addresses in the text become links. Each section has an anchor (`section-7`, `appendix-1`, `overview`), and a hash in the URL is honoured on load one frame late, because `ScrollToTop` scrolls to the top after the page renders. The Georgian texts are the owner's supplied originals and must not be edited as copy; the English versions are translations and say that the Georgian prevails.

---

## 11. Design system and CSS gotchas

### 11.1 Tokens (current values in `resources/css/app.css`)
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
6. Z-index ladder: header 100, cart drawer 110/120, newsletter overlay 130, store overlays and menus 160/161, skip link 200.
7. The `.kere-site-header` rules (about lines 600–700 of `app.css`) style a header that no longer exists. They are dead CSS.
8. **A global focus rule repaints every focused field**: `input:not([type=checkbox]):not([type=radio]):not([type=range]):focus`, `textarea:focus` and `select:focus` get `border-color: #b8afa4 !important` and a `#887d70` underline shadow. It beats any `focus:` utility. Fields with `aria-invalid="true"` are excluded from it.
9. **Form errors are keyed on `aria-invalid`, site-wide.** Any input, textarea or select with `aria-invalid="true"` has a red border (`--destructive`, `!important`) and, when focused, a red underline instead of the global focus style. The `!important` is needed because page rules such as `.kere-auth-page input` and `.kere-login-page input` set border colours outside a layer, which beats Tailwind utilities. To flag a field, set `aria-invalid`; a border class alone may lose. Error messages and banners use `text-destructive` and `border-destructive/30 bg-destructive/10` (the owner's 2026-07-12 decision).

---

## 12. Third-party services and environment variables

| Service | Use | Configuration |
|---|---|---|
| **Railway** | Hosting: PHP server, PostgreSQL, and a queue worker started from `start.sh` | Nixpacks; `DATABASE_URL` is parsed into `DB_*` by `start.sh` |
| **Cloudflare** | Registrar, DNS and proxy for kereforyou.com, plus Resend DNS records | A long edge TTL for `/assets/*` was suggested but not confirmed |
| **Cloudflare R2** (S3 API) | User uploads. Disk `uploads` (public, served from `R2_PUBLIC_URL`) and `documents` (private, `private/` prefix). Without `R2_BUCKET`, the code falls back to the local `public` and `local` disks. | `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL`, `R2_REGION` (default auto). The 2026-09-24 changelog entry treats production as already on R2. |
| **Resend** | Production email over HTTP (Railway blocks SMTP), from `noreply@kereforyou.com` | `MAIL_MAILER=resend`, `RESEND_KEY`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` |
| Gmail SMTP | **Local** `.env` mailer (real mail) | `MAIL_*` |
| **SMSOffice.ge** | SMS: OTPs, tailor alerts, the customer fallback. Sender "Kere". The API returns HTTP 200 even on rejection, so `SmsService` parses the body and logs `Success:false`. The balance must stay funded; it read 0 on 2026-09-24. | `SMSOFFICE_KEY` (empty means log only), `SMSOFFICE_SENDER=Kere`, `SMSOFFICE_URL` (default `https://smsoffice.ge/api/v2/send/`) |
| **Flitt** (pay.flitt.com) | Card, Google Pay and Apple Pay hosted checkout. Signature: `sha1(secret + '\|' + non-empty values sorted by key, joined by '\|')`, excluding `signature` and `response_signature_string`. Amounts in tetri, currency GEL, `lang` ka or en (default ka), reference `<order_number>_<random>` (`_d-`/`_b-` for a remodel's halves). Refunds use `POST /api/reverse/order_id` with a `reverse_id` idempotency key. Sandbox: merchant 1549901, key `test`, card 4444 5555 6666 1111. | `FLITT_MERCHANT_ID` (4057819), `FLITT_SECRET_KEY` (the portal "Payment key"; **no fallback**: when unset, `isConfigured()` is false and pay returns 502), `FLITT_API_URL` (default `https://pay.flitt.com/api`) |
| Google Fonts | Instrument Sans, Newsreader, Cormorant Garamond, Noto Sans and Serif Georgian | `<link>` in `app.blade.php` |
| Unsplash | Some `ClothingSeeder` demo images and a testimonial avatar (hotlinked; one is ORB-blocked) | |
| Twilio | Legacy and unused (the package is still in composer.json) | |

Other environment variables: `APP_KEY`, `APP_ENV`, `APP_URL` (used for consent links, the Flitt `response_url` and callback, and local upload URLs; production `https://kereforyou.com`, local `http://127.0.0.1:8000`), `APP_TIMEZONE=UTC`, `TRUSTED_PROXIES`, `SHIPPING_COST=15`, `CUSTOM_ORDERS_OPEN` (default off: the design studio takes no orders until the terms cover them; §8.4), `SUPPORT_EMAIL` (support form recipient), `REGISTRATION_ALERT_EMAIL` (emailed, queued, whenever someone registers; blank sends nothing; set in Railway, never in the public repo), `ADMIN_PASSWORD` (synced to `admin@kere.ge` on every deploy; `start.sh` has a hardcoded fallback if it is unset, so make sure it is set), `QUEUE_CONNECTION=database`, `SESSION_DRIVER=database`, `CACHE_STORE=database`. The local `.env` also contains `PRERENDER_TOKEN` and `PRERENDER_SERVICE_URL`, which no code reads.

---

## 13. Deployment and production

- **Railway via Nixpacks** (`nixpacks.toml`): php83 with pdo_pgsql and friends, nodejs_20 and composer. Install runs `composer install --no-dev --optimize-autoloader`, `npm ci` and `npm run build`. Start runs `bash start.sh` (the `Procfile` says the same).
- **`start.sh` on every deploy**: force `DB_CONNECTION=pgsql` and parse `DATABASE_URL` → `config:clear` → **`migrate --force`** → create or sync the admin `admin@kere.ge` (password `ADMIN_PASSWORD`, role admin) → `db:seed --class=ClothingSeeder` (a no-op when categories exist) → **`MensGarmentsSeeder` and `WomensTopsSeeder` (they converge the catalogue on every deploy)** → `storage:link --force` → `queue:work` in the background (sleep 3, tries 3, max time 3600) → `schedule:work` in the background (nightly `privacy:purge`) → `php artisan serve` on `$PORT` with `PHP_CLI_SERVER_WORKERS=8`.
- The container filesystem is replaced on every deploy, so anything written to local disk (`storage/app/public`) is lost. That is why uploads use R2; customizer admin uploads still do not (§15).
- Alternatives that are not used for production: `Dockerfile` (php:8.2-cli-alpine plus node, runs start.sh), `render-start.sh` (an old Render plus SQLite setup), `.devcontainer` (Codespaces: PHP 8.3 and Postgres 16, `migrate:fresh --seed`).
- CI (`.github/workflows`): `tests.yml` runs on PHP 8.4 and Node 22 (`npm ci`, build, `cp .env.example .env`, key:generate, `./vendor/bin/pest`). `lint.yml` runs `vendor/bin/pint`, `npm run format` and `npm run lint` (with auto-fix, but the commit step is commented out). Both run on pushes and PRs to `main` and `develop`.
- **Flitt go-live status**: live payments are on merchant 4057819, and card, Google Pay and Apple Pay were each confirmed with a real payment. **Still open**: switch Google Pay from TEST in the Flitt portal at go-live; regenerate the Payment key and Credit private key (both have been on screen); confirm that the checkout page renders in Georgian. **Built 2026-10-13**: refunds from the admin panel (`RefundService`, tested against the sandbox). **Not built**: the `orders:expire-unpaid` job (a scheduler now exists for it); distinguishing a gateway outage from a decline on `/checkout/complete`.
- SEO: `/sitemap.xml` (static URLs plus every product), real 404s for deleted products, Open Graph and Twitter tags in the blade shell, and JSON-LD (LocalBusiness on the landing page, Product on product pages). Per-page `<Helmet>` titles exist on most storefront and workflow pages, but these keep the default blade title: AboutUs, BecomePartner, Contact, HelpCenter, NotFound, Login, RoleSelection, both Register pages and TailorDashboard.

---

## 14. Tests and quality gates

- Pest 3, `tests/Pest.php` (`RefreshDatabase` on `Feature`, plus the global helper `tailorPayload($override)`). `phpunit.xml` sets `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync` and **`SMSOFFICE_KEY=""`**, so tests never send real SMS.
- Test files. The counts are `it()` blocks; datasets in `MeasurementsTest`, `TailorCustomerBoundaryTest` and `TailorRemodelingTest` expanded the run to 169 before 2026-10-13. `CustomerOnboardingTest` (25: ages, guardian, hash-only token, spent link, gates, Tbilisi time), `PaymentControllerTest` (23: ownership, 409s, callback guards, amount and currency, a late payment kept for a refund, a failed tailor notification, POST return, language), `MeasurementsTest` (13), `FlittSignatureTest` (12), `TailorRegistrationTest` (11), `TailorRemodelingTest` (9: routing by `does_remodeling`, `needed_by`, studio order keeps `color_name`), `FlittPaymentReferenceTest` (7), `UploadStorageTest` (7: disk switch, private documents), `CustomerRegistrationTest` (6: channel choice), `PaymentNotificationTest` (5: announced once, on payment), `CatalogueTailorPrivacyTest` (5: no tailor on any public product, none found by name, no public list), `RemodelPhotosTest` (4: ten photos, not eleven, webp, the upload bucket), `ProductDeletionTest` (3), `TailorCustomerBoundaryTest` (3 tests with datasets covering 14+ routes), `StorefrontSearchTest` (2), `CategoryListTest` (1: the header menu's categories, written to fail on PostgreSQL's json rules), `RegistrationAlertTest` (4: customers and tailors announced once, nothing without an address, no contact details), `StudioCatalogueTest` (2: the studio list carries no attributes; the sleeveless tank is men's only), `OrderAftercareTest` (17: cancelling, stock back, a tailor cancelling, returns, problem reports, refunds, an unanswered refund, the tailor's paid-only view and steps, orders from before card payment), `RemodelPaymentFlowTest` (9: offer days, two halves, references naming their stage, every step in order, a later date, legacy remodels), `PrivacyPurgeTest` (5), `GeorgianEmailsTest` (5: every customer and tailor email renders Georgian; the rejection reason; the code lifetime; Kere's offer, naming no tailor), `ReviewModerationTest` (6: a review waits for Kere and the admins are told; published reviews name neither customer nor tailor; product reviews are published-only and anonymous; only admins moderate; refusal codes; a tailor's score counts every order, remodels included, for admins and the tailor alone), `KereOfferTest` (17: estimates reach admins only, a custom order's estimate, Kere's offer, accept, decline, a replaced offer and a lapsed tailor, admin-only offers, no direct remodel assignment, the custom-order pause, no customer-chosen tailor, the two conversations, a reassigned tailor's view), plus the two example tests. 239 pass on 2026-10-29.
- Gates that must stay green: `php artisan test`, `npm run typecheck`, `npx eslint` (0 errors; the 4 `exhaustive-deps` warnings in `CustomizerAdminPage`, `MyDesignsPage` and `OrderReview` predate this file), `npm run build`, and locale parity. Then the browser check (§2.3).
- **Running the suite on PostgreSQL** (production's database; SQLite ignores its check constraints and restarts ids per test): start the local install with `pg-start` (`E:\tools\pgsql`, superuser in `E:\tools\pgsql-superuser.txt`), create a scratch database, then run `php -d extension=pdo_pgsql vendor/pestphp/pest/bin/pest` with `DB_CONNECTION=pgsql DB_HOST=127.0.0.1 DB_DATABASE=<scratch> DB_USERNAME=… DB_PASSWORD=…` set in the environment (they win over `phpunit.xml`). XAMPP ships `php_pdo_pgsql.dll`, so `-d` loads it without touching `php.ini`. Use `pest` directly: `artisan test` does not pass `-d` to its child process. Drop the database and `pg-stop` afterwards. 235 passed this way on 2026-10-29. Write new queries knowing a `json` column there has no `=` or `<>`: compare `CAST(col AS TEXT)`.
- Testing tips: register flows read the OTP from the test or the SMS log; to exercise CSRF, make real HTTP requests outside the test harness; `Storage::fake` covers only the local-disk fallback, not R2 behaviour.

---

## 15. Known issues and tech debt (verified 2026-10-04)

None of these have been fixed. Fix them only when asked, or when they are directly in scope.

**Correctness, security and privacy**
1. **The GitHub repository is public, and `start.sh` contains a fallback admin password** that is used whenever `ADMIN_PASSWORD` is unset. Make sure `ADMIN_PASSWORD` is set in Railway (otherwise the production admin password is publicly readable), and treat everything committed, including this file, as public.
2. **The login throttle keys on the wrong field.** `RateLimiter::for('login')` (`AppServiceProvider`) keys on `email|ip`, but `Login.tsx` posts `login`, so the key collapses to `|ip`: one shared bucket of 10 per minute for everyone behind an IP, and no per-account limit.
3. `randomTailor()` (for demo products without a tailor) checks neither approval nor suspension, so such a product can be given to an unapproved or suspended tailor. (The public tailor list and the customer's own choice of tailor, which leaked the same tailors, were removed on 2026-10-28.)
4. **"Pause product" is cosmetic.** `products.status` is ignored by `/api/products`, the product page, related products, the tailor profile, the sitemap, the wishlist and `POST /orders`.
5. Customizer admin uploads (`CustomizerAdminController`, `storeOption` and similar) write to the **`public` disk directly**, not `uploads_disk`, so they are lost on redeploy. `FabricResource` and the saved-design preview build `asset('storage/…')` URLs.
6. **`start.sh` re-seeds Mens and WomensTops on every deploy**: admin edits to seeded garments (name, description, price, preview, defaults, colours) are overwritten, and a seeded garment an admin deactivated is re-activated (`is_active => true`). `WomensTopsSeeder` also deletes attributes and colours that an admin added to its garments.
7. `ProductController::store` checks only `role === tailor`, not approval. A pending tailor could create products through the API.
8. There is **no password reset, change-password, customer profile edit or account deletion** anywhere.
9. Tokens never expire, there is one session per user, and the token lives in `sessionStorage`, so a 3-D Secure return into a new tab arrives signed out (`PaymentComplete` handles this).
10. Guardian consent links never expire, and an admin cannot resend one on a customer's behalf.
11. Tailor ID documents: the endpoint exists but has no UI, and no admin screen shows documents or the registration answers. On R2 the `private/` separation relies on bucket configuration, not code. Product image URLs are stored absolute, so changing `APP_URL` or `R2_PUBLIC_URL` breaks old rows. Customer uploads (`designs/`) that never reach an order are never deleted; only the `api-uploads-daily` cap bounds them. On the local `public` fallback an uploaded SVG is served inline from the site's own origin (the attachment header applies on R2 only).
12. In the designer's upload branch, `UploadPanel.handleFile` skips the upload when signed out but still enables Continue. After login, the order can go through with `design_file_url: null`. (Unreachable while custom orders are paused.)
13. **An abandoned registration can never be finished.** The account exists once the one-time code is verified, but date of birth and terms are asked only in that same flow (`CustomerProfileSteps`). A customer who closes the tab there has no way back: nothing shows the profile steps again, and `POST /orders` answers 403 `registration_incomplete`, a code the frontend does not translate, so the English message shows. The seeded `test@example.com` is in this state.

**UX, i18n and design drift**
14. **Marketplace i18n regression**: colour, fabric and category labels render in English (`COLOUR_OPTIONS` labels, `FABRIC_OPTIONS`, API category names), although `marketplace.colours.*`, `.fabrics.*` and `.categories.*` exist in both locales and are unused. The Navigation mega-menu also shows English category names. Catalogue content (product names and descriptions, customizer attribute and option names, notification text) is English-only data.
15. **The marketplace colour filter cannot match**: its eight hex values (`#1B1B1B` and so on) are not in the tailor form's `PRESET_COLORS`, and no local product matches any of them. The size lists also disagree: the marketplace offers XXS and 3XL, while the tailor form has Custom.
16. `AddProductModal` hardcodes category IDs 1–6.
17. Raw server `message` text can still reach the page in English: `OtpStep` (wrong or expired code, resend limit), upload errors in `DesignerApp`, and the remodel request's submit error in `RemodelRequest`.
18. Dates other than `needed_by` use `toLocaleDateString`, which Chrome renders in English for Georgian. Use `formatCalendarDay` for new date displays.
19. Old slate styling remains on `OrderReview`, `MyDesignsPage`, the customer, tailor and admin dashboards, the one-time-code step (`OtpStep`), and the email templates. A typed "Kere" stands in for the wordmark on `OrderReview`, `MyDesignsPage`, the admin dashboard, the tailor's pending and rejected screens, both registration pages and the emails. The wordmark is an empty `<span class="kere-nav-logo">` inside a `.store-logo` link, which sizes it (17px tall, 12px below 768px).
20. Marketplace cards are `div onClick` rather than links, and their stagger delay is `0.04` (off-spec). Many raw styled `<button>`s come from Mariami's class-driven markup. There is no search input below `sm`.
21. Mail and SMS are sent synchronously (checkout took about 6 s per tailor order when measured). Emails use `<style>` blocks and flexbox, which some desktop clients (older Outlook) ignore.
22. Orphan routes and features: `/wishlist` (and there is no add button), `/my-designs`. The footer mounts `EmailSupportModal` but nothing opens it. `OrderReview` and `RemodelRequest` pass a `pendingAssignment` navigation state that the customer dashboard ignores. The contact form and both newsletter forms are UI-only. Unused endpoints: `/products/{id}/meta`, `/customizer/preview`, `/customer/orders/{id}/review-status`.
23. SEO: the static `public/robots.txt` (allow everything) shadows the dynamic `/robots.txt` route, so crawlers never get the sitemap pointer or the disallows. `sitemap.xml` lists `/how-it-works` (which shows the SPA NotFound page with HTTP 200) and includes paused products. Eleven pages have no `<Helmet>` title (§13).
24. `/api/products` ignores `per_page`. `CategoryController` runs one random query per category. (Its `images != '[]'` comparison made `/api/categories` a 500 on PostgreSQL from April until 2026-10-29.)

**Housekeeping**
25. Dead code and dependencies are listed in §5.1 and §5.2. `public/images/garments/dress-maxi.png` and `WomanTshirtClassic/` are unreferenced. The `.kere-site-header` CSS is dead, and the `.kere-market` token scope has no users.
26. There are four ESLint `exhaustive-deps` warnings.
27. `composer.json` still says `"license": "MIT"` (from the Laravel starter kit), while no license file is published. Decide the intended license.

**Legal texts versus the product** (Terms v1.1 and the privacy policy of 26 October 2026 are the texts Flitt's review asked for, supplied by the owner; privacy §13 keeps one row the owner asked for: measurements saved on the profile. Raise any change with the owner)
28. The terms cover remodels and ready-made clothing only, so custom orders are paused (§8.4) until the owner extends them. Body photos in privacy §13 do not exist on the site, so there is nothing of that kind to delete.
29. A bag with products from two tailors still becomes two orders, two delivery fees and two payments, labelled by delivery; the customer is not told why. For a single seller, one order per bag would read more naturally.
30. Tailors still see the order total, which is Kere's price, on their dashboard and in the new-order email; when Kere prices above an estimate the tailor sees the difference.
31. The ready-made section is still called "Marketplace" (navigation, page title), which a reviewer may read as many sellers; renaming it is for the owner and Mariami. The home page's "Upload your design" button leads to the "opens soon" page while custom orders are paused.
32. The CSS for the removed partner tailor list (`.partners-tailors-section`, `.partners-tailor-card`) and its secondary button (`.partners-secondary-cta`) is dead; it sits inside shared selector lists and was left in place.
---

## 16. Branches, collaborators, pending work

- `main` is the only live branch and deploys to production. Local branches: `backup/main-before-mariami-merge`, `design/mariam-import`, `feature/customer-measurements` (merged), `flitt-payments`, `integrate-mariami-design`, `mariam-design-import`, `mariami` (stale).
- Remote design branches from Mariami (`mbadzaghua`):
  - **`origin/mariam-october`** is the branch she works on. Her last commit there, `e5e4c31` (2026-09-30, a taller home page slider on phones), was imported on 2026-10-09 as `74ce814`. The same day `main` was merged into the branch with `main`'s tree, without a force push, so her next pull brings her fully up to date. Its earlier commit `b6e6ae6` was imported on 2026-09-28 as `ec41042` plus the follow-up `11f263f`.
  - `origin/mariam-changes` (2026-09-22) was imported selectively on 2026-09-22. `origin/mariam-latest-update` (`b6e6ae6`) has been imported. `origin/mariami` is stale.
- Other remote branches, all fully contained in `main` (checked 2026-10-09): `origin/feature/customer-measurements`, `origin/mariam-design-import`.
- `flitt-payments` (2026-08-11) holds the original embedded-checkout version and the `orders:expire-unpaid` job. `main` uses the hosted redirect instead, and the expiry job was never ported.
- Owner decisions on record: photography is a preview and never a gate on what can be ordered, except colour: since 2026-10-28 the studio offers only the colours the chosen design was photographed in; customer reviews are public only once an admin publishes them, anonymously and as feedback on Kere, and tailor scores are internal (2026-10-28; this replaces "review text removed from product pages", 2026-09-07); legal pages stay readable to tailors; a tailor's home is the dashboard, not `/partners`; colour is one garment-wide choice; the navbar is single-tone; Mariami's footer is kept as she wrote it; when site copy and the terms disagree, the terms win (2026-10-13); remodels are paid online in two halves with the delivery fee in the first, refunds go through a Flitt button, the courier is booked by hand, and profile measurements stay until the customer deletes them (2026-10-13); the terms keep saying tailors act on Kere's behalf (2026-10-13); for Flitt's review (2026-10-28): Kere is the only seller and tailors are never published or chosen, Microsoft Clarity is removed, the profile-measurements row stays in the privacy policy, an admin turns one tailor's estimate into Kere's offer, and ordering from the design studio is paused until the terms cover it.

---

## 17. History timeline (details in CHANGELOG.md)

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
| 10-09 | Mariami's taller home page slider on phones imported from `mariam-october` |
| 10-11 | Sign-in and registration errors red again (fields flagged through `aria-invalid`); "customer"/მომხმარებელი replaces "client"/კლიენტი; the design studio hides headings with no garment and names them as coming soon; remodel requests take 10 photos, shrunk in the browser, and no longer ask for measurements; code-review fixes (uploads named by content, translated sign-in codes, site-wide `aria-invalid` rule) |
| 10-13 | New Terms and Conditions (v1.0) and Privacy Policy (v1.1, then 1.2 with Clarity) on one shared `LegalDocumentPage`; remodels paid online in two halves with courier and photo steps; cancelling, 14-day returns, problem reports and Flitt refunds; the nightly 90-day `privacy:purge`; cookie consent can be withdrawn; site copy and the address brought in line with the terms |
| 10-14 | Every email to customers and tailors in Georgian, on one shared layout; the rejection email shows the admin's reason again; the code email states the real 30 minutes |
| 10-28 | Flitt's revised Terms (v1.1) and Privacy Policy (26 October): Kere is the only seller. Tailors are no longer published or chosen; tailors send estimates and an admin sends Kere's offer; each order has a customer–Kere and a tailor–Kere conversation; Microsoft Clarity removed; custom orders paused; site copy brought in line. Raglan and Rolled Cuff sleeves join the T-shirt (ten sleeves, 868 photos); the colour step offers only photographed colours; the sleeveless tank is menswear only; reviews moderated by Kere and published anonymously, tailor scores internal |
| 10-29 | Code-review fixes: a refund Flitt never answered is asked about again rather than sent twice; payments on cancelled or already paid orders are recorded for a refund; an answer to a replaced offer is refused; unpaid marketplace orders stay out of the tailor's reach everywhere, and older ones are settled offline; cancelling returns stock; estimates ask a price and days on custom orders too; chat shows a tailor only their own messages and Kere's |
