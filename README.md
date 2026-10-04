# Kere

Made-to-measure clothing from local Georgian tailors: a marketplace, a design studio and a remodelling service in one site.

**Live site:** [kereforyou.com](https://kereforyou.com) · **History:** [CHANGELOG.md](CHANGELOG.md) · **Technical reference:** [CLAUDE.md](CLAUDE.md)

![Kere](public/assets/og-image.jpg)

## Contents

- [About](#about)
- [Built with](#built-with)
- [Getting started](#getting-started)
- [Common commands](#common-commands)
- [Testing](#testing)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)
- [Maintainers](#maintainers)
- [License](#license)

## About

Kere connects customers in Georgia with independent tailors and ateliers. A customer can get a garment made in three ways:

1. **Marketplace**: buy a design a tailor has listed, as it is or customized to their measurements.
2. **Design studio**: build a garment step by step (garment, shape, details, colour, review), or upload their own sketch, then choose a tailor or let tailors send offers.
3. **Remodel**: send photos of a garment they already own, describe the change, and pick from tailors' priced offers.

The interface is Georgian first, with a full English translation, and all prices are in Georgian lari (₾). The site is live at [kereforyou.com](https://kereforyou.com) and under active development.

### Features

**Customers**
- Browse by section (women or men), category, colour, size, fabric and price.
- Pay marketplace orders by card, Google Pay or Apple Pay.
- Save body measurements once and reuse them on every fitted order.
- Compare tailors' offers on design and remodel requests, then choose one.
- Chat with the tailor on each order, get in-app notifications, and review delivered orders.

**Tailors**
- Register with phone verification and admin approval.
- List products, and choose whether to take remodel work.
- Send offers on open requests and move orders from accepted to finished.

**Admins**
- Approve or reject tailors and suspend accounts.
- Assign tailors to unassigned orders and mark orders delivered.
- Manage the design studio catalogue: garments, attributes, options, colours and photos.

**Platform**
- Customers aged 16–17 need a parent or guardian to confirm by email before ordering.
- Tailors receive SMS alerts as well as email, because many register with a phone only.
- Analytics load only after the visitor consents.

## Built with

| Area | Technology |
|---|---|
| Backend | [Laravel](https://laravel.com) 12 (PHP 8.2+), JSON API with bearer-token auth |
| Frontend | [React](https://react.dev) 19 and TypeScript, React Router 7, Tailwind CSS 4, Radix UI, Motion, i18next |
| Build | Vite 6 |
| Database | PostgreSQL in production, SQLite locally and in tests |
| Tests | [Pest](https://pestphp.com) 3 |
| Payments | [Flitt](https://flitt.com) hosted checkout |
| Email and SMS | [Resend](https://resend.com) for email, [SMSOffice.ge](https://smsoffice.ge) for SMS |
| File storage | Cloudflare R2 (S3-compatible) |
| Hosting | [Railway](https://railway.com) behind Cloudflare |
| Analytics | Microsoft Clarity, behind a consent banner |

## Getting started

### Prerequisites

- PHP 8.2 or newer, with the `pdo_sqlite`, `mbstring`, `fileinfo`, `openssl`, `curl` and `xml` extensions
- [Composer](https://getcomposer.org) 2
- [Node.js](https://nodejs.org) 20 or newer, with npm

### Installation

```bash
git clone https://github.com/datoi/Lara-React-Crud.git kere
cd kere
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
```

Open `.env` and set:

```dotenv
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/kere/database/database.sqlite
ADMIN_PASSWORD=choose-a-password
```

`DB_DATABASE` must be an absolute path. Set `ADMIN_PASSWORD` **before** migrating: a migration creates the admin account with it, and falls back to a random password when it is missing.

Then create the database and link public storage:

```bash
php artisan migrate --seed
php artisan storage:link
```

The seeders add marketplace categories with demo products and the design studio catalogue.

### Running locally

Run these in two terminals, then open http://127.0.0.1:8000:

```bash
php artisan serve
npm run dev
```

The support form sends its email through the queue. To deliver those emails locally, also run `php artisan queue:work`.

### Accounts for local testing

- **Admin**: sign in at `/admin/login` as `admin@kere.ge` with your `ADMIN_PASSWORD`.
- **Customer and tailor**: register through `/register/customer` and `/register/tailor`. Verification codes are written to the logs (see below). A new tailor sees a waiting screen until you approve them from the admin dashboard.
- The seeded `test@example.com` (password `password`) has not completed onboarding, so it cannot place orders. Register a fresh customer instead.

### External services in development

`.env.example` leaves every external service unconfigured, so nothing leaves your machine by default.

| Service | Unconfigured behaviour | To enable |
|---|---|---|
| Email | Written to `storage/logs/laravel.log` (`MAIL_MAILER=log`) | `MAIL_*`, or `MAIL_MAILER=resend` with `RESEND_KEY` |
| SMS | Written to `storage/logs/laravel-YYYY-MM-DD.log` | `SMSOFFICE_KEY` |
| Card payments | Starting a payment fails with an error | `FLITT_MERCHANT_ID` and `FLITT_SECRET_KEY` (use test credentials) |
| File uploads | Stored in `storage/app` on your machine | the `R2_*` variables |
| Analytics | Off | `VITE_CLARITY_PROJECT_ID`, at build time |

If your `.env` does hold live credentials, start the server with `MAIL_MAILER=log SMSOFFICE_KEY= php artisan serve --no-reload` while testing, so no real email or SMS is sent.

## Common commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build of the frontend |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npx eslint .` | Lint the frontend (`npm run lint` also applies fixes) |
| `npm run format:check` | Check formatting with Prettier (`npm run format` rewrites files) |
| `php artisan test` | Run the backend test suite |
| `php artisan db:seed --class=WomensTopsSeeder` | Re-seed one catalogue (all garment seeders are safe to re-run) |
| `php artisan catalogue:enrich-descriptions` | Preview fuller descriptions for thin product listings; add `--apply` to save them |

## Testing

```bash
php artisan test
```

The suite uses an in-memory SQLite database, captures email and never sends SMS. Before merging, also run `npm run typecheck`, `npx eslint .` and `npm run build`.

There are no frontend tests, so check interface changes in a browser: in Georgian and English, at phone and desktop widths, with no console errors.

GitHub Actions runs the tests (`.github/workflows/tests.yml`) and the linters (`.github/workflows/lint.yml`) on pushes and pull requests to `main` and `develop`.

## Configuration

All settings come from `.env`. See [`.env.example`](.env.example) for the full list. The ones specific to Kere:

| Variable | Purpose |
|---|---|
| `APP_URL` | Base URL, used in emails, guardian consent links and payment return links |
| `DB_CONNECTION`, `DB_DATABASE` | Local database. Production sets `DATABASE_URL` instead. |
| `ADMIN_PASSWORD` | Password for `admin@kere.ge`, re-applied on every deploy |
| `MAIL_MAILER`, `RESEND_KEY`, `MAIL_FROM_ADDRESS` | Outgoing email |
| `SUPPORT_EMAIL` | Recipient of the support form |
| `SMSOFFICE_KEY`, `SMSOFFICE_SENDER` | SMS gateway (sender name `Kere`) |
| `FLITT_MERCHANT_ID`, `FLITT_SECRET_KEY`, `FLITT_API_URL` | Card payments |
| `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_PUBLIC_URL` | Object storage for uploads. Without `R2_BUCKET`, files stay on the local disk. |
| `SHIPPING_COST` | Flat shipping per order in ₾ (default 15) |
| `VITE_CLARITY_PROJECT_ID` | Analytics project, read at build time |

## Project structure

```text
app/
  Http/Controllers/Api/   JSON API controllers
  Http/Middleware/        bearer-token auth and role checks
  Models/                 Eloquent models
  Services/               payments (Flitt), SMS, verification codes, notifications
  Mail/                   transactional emails
database/
  migrations/             schema history
  seeders/                catalogue seeders, also run on every deploy
resources/
  js/                     React app: pages, components, hooks, lib, data, locales
  css/app.css             Tailwind theme and site styles
  views/                  the SPA shell and email templates
routes/
  api.php                 every API endpoint
  web.php                 SPA catch-all, sitemap, payment return
public/assets/            images: brand, garment photography, editorial
scripts/                  garment photo pipeline
tests/Feature/            Pest feature tests
```

## Deployment

Production runs on Railway, using Nixpacks (`nixpacks.toml`), and **deploys from `main`**: anything merged to `main` goes live at kereforyou.com.

On every deploy, [`start.sh`](start.sh):
1. runs the database migrations;
2. creates or updates the admin account;
3. re-seeds the design studio catalogue;
4. links public storage;
5. starts a queue worker and the web server.

Production uses PostgreSQL, Resend for email and Cloudflare R2 for uploads. Set the variables in [Configuration](#configuration) in Railway, including `APP_KEY` and `APP_ENV=production`.

## Documentation

- [CLAUDE.md](CLAUDE.md): the full technical reference, kept current with every change. It covers architecture, every API endpoint, the database schema, business flows, the design studio engine, the design system, third-party services and a list of known issues. It is written for AI coding assistants and developers alike.
- [CHANGELOG.md](CHANGELOG.md): every feature and fix since April 2026, newest first, with the reasoning behind each and how it was verified.
- [`docs/`](docs): QA reports.

## Contributing

`main` is production, so work on a branch and merge only what has been checked.

Before merging:
- [ ] `php artisan test` passes, with tests added for new backend behaviour.
- [ ] `npm run typecheck`, `npx eslint .` and `npm run build` are clean.
- [ ] `resources/js/locales/en.json` and `ka.json` have exactly the same keys.
- [ ] The change was checked in a browser (Georgian and English, phone and desktop).
- [ ] [CHANGELOG.md](CHANGELOG.md) has a new entry at the top, headed `## YYYY-MM-DD — What changed`, saying what was done, how it was verified and anything noticed but left alone.
- [ ] [CLAUDE.md](CLAUDE.md) is updated if it describes something you changed.

Conventions (details in CLAUDE.md, sections 2 and 11):
- Import from `react-router` (not `react-router-dom`) and `motion/react` (not `framer-motion`). Icons come from `lucide-react`.
- Show prices in ₾. The brand colour is wine `#631e26`; do not use blue, purple or indigo in the interface.
- Use the shared `<Button>` from `resources/js/components/ui/button.tsx` for actions.
- Keep animations to fades, scale-ins, staggers and hover-scale, at 0.5 or 0.6 seconds, with no spring or bounce.
- Put every user-facing string in both locale files. Map server error codes to translations through `resources/js/lib/serverMessage.ts`, and never show the server's English message to the user.
- Visual design comes from the designer's `mariam-*` branches and is imported selectively: her layout and styling win, while existing behaviour and fixes are kept.
- Write commit messages as a plain sentence describing the outcome, for example "Let remodel customers say when they need the garment back".

## Support

Kere (შპს კერე შენთვის): [kereforyou@gmail.com](mailto:kereforyou@gmail.com) · +995 597 03 23 48 · Instagram [@kereforyou](https://www.instagram.com/kereforyou/)

Please report security problems privately by email rather than in a public issue.

## Maintainers

- [datoi](https://github.com/datoi): product owner and development
- Mariami: design

## License

No license has been published for this repository. The `"license": "MIT"` field in `composer.json` is left over from the Laravel starter kit.
