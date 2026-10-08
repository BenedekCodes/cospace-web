# CoSpace test environment checklist

Runbook for the testing curriculum. Statuses are checked against the two `package.json` files and `node_modules`, not against any AI proposal.

- Frontend project: `cospace-web` (Next.js 16.3.8, React 19.2.8, axios). Port 3000.
- Backend project: `cospace-backend` (Express 5, Prisma 7 with the MariaDB adapter, MySQL, zod). Port 5000.
- Both are siblings under `cospace-workspace/`. Commands below run from the named project folder.

## 1. What exists today

| Item | Frontend (`cospace-web`) | Backend (`cospace-backend`) |
|---|---|---|
| Scripts in `package.json` | `dev`, `build`, `start`, `lint`, `test` (`jest`), `test:e2e` (`playwright test`), `test:cypress` (`cypress run`) | `dev` (`ts-node-dev` with respawn), `start` (`node server.js`, an empty file, left as it was), `test` (`jest`, replacing the npm placeholder) |
| Jest | installed, `jest.config.ts` uses `next/jest` with jsdom | installed with `ts-jest`, `jest.config.js` with the node environment |
| React Testing Library | installed (`@testing-library/react`, `dom`, `jest-dom`, `user-event`) | not applicable |
| Supertest | not applicable | installed (`supertest`, `@types/supertest`), 4 smoke tests in `tests/app.smoke.test.ts` |
| Playwright / Cypress | `@playwright/test` 1.64.0 with `playwright.config.ts` and `e2e/smoke.spec.ts`, but Playwright's own browsers are not installed (the download was cancelled). `cypress` 16.1.1 with its binary, `cypress.config.ts` and `cypress/e2e/smoke.cy.ts`. `start-server-and-test` is installed and not used yet. | not applicable |
| Test files | `src/components/bookingValidation.test.ts`, `src/components/BookingCard.test.tsx`, `src/lib/api.test.ts`, `e2e/smoke.spec.ts` (Playwright), `cypress/e2e/smoke.cy.ts` (Cypress) | `tests/schemas/booking.schema.test.ts`, `tests/app.smoke.test.ts` |
| Module / TS notes | `type` unset, `module: esnext`, alias `@/*` to `./src/*`. The alias resolves in Jest through `next/jest` (verified by `api.test.ts`). Cypress has its own `cypress/tsconfig.json`, and `cypress` is excluded from the app `tsconfig.json` so its globals do not clash with Jest's. | `commonjs`. `src/app.ts` builds the Express app and `src/index.ts` only listens. `tsconfig.test.json` extends the build config with `rootDir: .`, `types: [node, jest]` and `tests/**` included. The build `tsconfig.json` is unchanged. |

Verified results: Jest passes in both projects (frontend 5 tests, backend 6 tests including the 4 Supertest smoke tests). `npx cypress run` passes the Cypress smoke spec against the running dev server. The Playwright spec passes when run through the installed Google Chrome with a temporary config, but `npm run test:e2e` itself needs Playwright's browsers, which are not installed (see section 3).

## 2. Tool responsibility map

| Tool | What it executes | Project | CoSpace boundary tested | What it does not test | Smallest useful smoke check |
|---|---|---|---|---|---|
| Jest | Test files in Node (or jsdom for the frontend). It is the runner and assertion library. | Both | Isolated logic: `validateBooking` and `api.ts` parsers in the frontend. In the backend, `createBookingSchema`, `createDeskSchema`, `errorHandler`, `auth`, and `BookingService` with a fake repository. | Real browsers, real HTTP routing, the real database, and CSS or layout. | Backend: `createBookingSchema.safeParse({ user_id: 1, desk_id: 1, booking_date: "2026-10-20" })` succeeds and defaults `active` to `true`. Frontend: `validateBooking({ desk: "", floor: "", date: "" })` returns `errors.desk` equal to "Enter a desk, for example A12.". |
| React Testing Library | Renders React components into jsdom, run by Jest, and queries the DOM the way a user would. | Frontend | One component or a small tree: `CreateBookingForm`, `RegistrationForm`, `BaseModal`, `BookingCard`, `BookingsTable`, and `BookingList` with `@/lib/api` mocked. | Real network, the backend, the database, real browser layout, and `async` Server Components (the Next.js Jest guide says Jest does not support them, and `app/bookings/[id]/page.tsx` is one). | Render `BookingCard` with desk `A12`, floor `2`, date `2026-10-20` and assert one link with `href="/bookings/1"` containing "Desk A12". |
| Supertest | Sends HTTP requests to the Express `app` object in-process, without a browser. | Backend | Routes, `express.json`, `auth`, `validateSchema`, controllers, `errorHandler`, and with a test database the service, repository, Prisma and MySQL (status codes, the unique desk-and-date constraint). | The frontend, CORS behaviour in a browser, and anything a user sees. | `POST /bookings` with no `Authorization` header returns 401 with `error: "Unauthorized"`. The auth check runs before any database call. |
| Playwright | Drives a real browser (Chromium, Firefox, WebKit) against running servers. | Frontend project, hitting both servers | The whole journey: browser, Next.js routing, client-side search, the API and MySQL. | Fine-grained logic or error mapping, which would be slow and hard to diagnose here. It is also not a replacement for component tests. | Open `/` and assert the search box named "Search bookings" is visible. |
| Cypress | Drives a browser through its own runner, with the same responsibility as Playwright. | Frontend project, hitting both servers | Same as Playwright. | Same as Playwright. | Visit `/` and assert the search box named "Search bookings" exists. |

Playwright and Cypress cover the same boundary. Both are installed for the curriculum, but write the project's journeys in only one of them. This runbook uses Playwright because the Next.js docs include a guide for it.

## 3. Runbook

### Commands that work now

| Purpose | Folder | Command | Needs |
|---|---|---|---|
| Start frontend | `cospace-web` | `npm run dev` | Node, `.env.local` with `NEXT_PUBLIC_API_TOKEN` |
| Lint frontend | `cospace-web` | `npm run lint` | none |
| Start backend | `cospace-backend` | `npm run dev` (respawns on change) | MySQL running, `DATABASE_URL` in `.env` |
| Frontend Jest + RTL | `cospace-web` | `npm test` | none |
| Backend Jest + Supertest | `cospace-backend` | `npm test` | none, the smoke tests mock `utils/db` |
| Cypress smoke | `cospace-web` | `npm run test:cypress` | Frontend dev server on port 3000 (`npm run dev`) |

`npm start` in the backend still runs `node server.js`, which is an empty file, so it starts nothing. Use `npm run dev`. The script was left alone because Step 5 says not to overwrite existing scripts. Only the npm placeholder `test` script was replaced.

### Needs one more step

| Tool | Status | Next step |
|---|---|---|
| Playwright (`npm run test:e2e`) | Configured with one Chromium project and a home-page smoke spec. Its `webServer` setting reuses a dev server on port 3000 or starts `npm run dev`. Playwright's own browsers are not installed. | Run `npx playwright install chromium` once (a large download that was slow on this network), then `npm run test:e2e`. |
| start-server-and-test | Installed and not used in any script. | Use it to start the dev server and run `npm run test:cypress` in one command when a CI job is added. |

Jest ignores `e2e/` and `cypress/` through `testPathIgnorePatterns` in `jest.config.ts`, so `npm test` does not pick up the Playwright specs.

## 4. Services each test needs

| Test type | Frontend server (3000) | Backend server (5000) | MySQL | Notes |
|---|---|---|---|---|
| Jest unit (schemas, `validateBooking`) | no | no | no | Pure functions. |
| Jest `BookingService` with fake repository | no | no | no, but see blocker B1 | Importing the service loads `utils/db`. |
| RTL component | no | no | no | Mock `@/lib/api` for `BookingList`. |
| Supertest, auth and validation only | no | no (Supertest uses the in-process app from `src/app.ts`) | no (`utils/db` is mocked) | The 401 and 400 paths do not query the database. |
| Supertest with persistence | no | no | yes, a separate test database | Never the development database. |
| Playwright / Cypress home-page smoke | yes (`npm run dev`) | no | no | `BookingList` renders the search box while loading or on error. |
| Playwright / Cypress journeys with data | yes (`npm run dev` or `build` + `start`) | yes (`npm run dev`) | yes | The booking journeys need all three. CORS allows only `http://localhost:3000`. |
| Manual exploratory | yes | yes | yes | Not automated and not a pyramid layer. |

## 5. Test data

| Data | Source | Used by | Caveat |
|---|---|---|---|
| User with `id = 1` | `scripts/seed_and_queries.sql` | Every booking made through the frontend (`DEMO_USER_ID = 1` in `lib/api.ts`) | The booking POST returns 400 if user 1 does not exist. |
| Desks `DESK1` to `DESK4` | the same seed script | Backend integration tests | These names do not match the frontend desk rule `^[A-Z][0-9]{2}$`. The frontend `ensureDesk` creates desks by name, so create `A12`-style desks for browser tests. |
| Bookings from 2026-09-18 onward | the same seed script | Read-path tests | The frontend rejects past dates, so create fresh bookings with dates inside the 6-month window. |
| Auth token | The backend `auth` middleware compares the `Authorization` header with a hard-coded token. The frontend sends `NEXT_PUBLIC_API_TOKEN` from `.env.local`. | Create calls from the browser and Supertest | Both sides must match. Do not print or commit the real values. |
| Fixed dates | Tests that call `validateBooking` | Unit and component tests | `getDateBounds` uses the current date, so use a fake clock or compute dates relative to today. |

## 6. Blockers and their status

| Id | Blocker | Evidence | Status |
|---|---|---|---|
| B1 | Importing `BookingService` also imports `utils/db.ts`, which throws if `DATABASE_URL` is missing and creates the Prisma client. | `booking.service.ts` imports `BookingRepository`, which imports `prisma` from `utils/db`. | Handled in `tests/app.smoke.test.ts` with `jest.mock("../src/utils/db", ...)`. Any new test that imports the services must do the same or set a dummy `DATABASE_URL`. |
| B2 | `src/index.ts` called `app.listen(5000)` on import, so Supertest would have opened the port and clashed with a running dev server. | The old `index.ts`. | Fixed. `src/app.ts` builds the app and `src/index.ts` only listens. |
| B3 | Integration tests would run against whichever database `.env` names. | `db.ts` reads `DATABASE_URL`. | Open. It matters only for tests that persist data, such as check 4 in the strategy. Create a separate test database first. |
| B4 | The seed script inserts a `role` column that does not appear in `prisma/schema.prisma`, and it targets `USE cospace;`. | `seed_and_queries.sql` and `schema.prisma`. | Open and unverified. Confirm which schema is current before using the seed. |
| B5 | `app/bookings/[id]/page.tsx` is an async Server Component reading `MOCK_BOOKINGS`. | The page source and the Next.js Jest guide. | Open by design. Cover it with E2E or call it directly, not with RTL. |

## 7. Assumptions

- The tool list (Jest, React Testing Library, Supertest, Playwright, Cypress) comes from the curriculum text, and no other runner is introduced.
- Node on this machine is v26.8.2 (from the terminal), and package compatibility with it has not been checked.
- MySQL is reachable through `DATABASE_URL`, and the test-database setup is not yet done.
- The Playwright spec was verified through the installed Google Chrome with a temporary config, because Playwright's own browsers are not installed.
