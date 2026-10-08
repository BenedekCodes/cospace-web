# CoSpace test environment checklist

Runbook for the testing curriculum. Statuses are checked against the two `package.json` files and `node_modules`, not against any AI proposal.

- Frontend project: `cospace-web` (Next.js 16.3.8, React 19.2.8, axios). Port 3000.
- Backend project: `cospace-backend` (Express 5, Prisma 7 with the MariaDB adapter, MySQL, zod). Port 5000.
- Both are siblings under `cospace-workspace/`. Commands below run from the named project folder.

## 1. What exists today

| Item | Frontend (`cospace-web`) | Backend (`cospace-backend`) |
|---|---|---|
| Scripts in `package.json` | `dev`, `build`, `start`, `lint`, `test` (`jest`) | `dev` and `start` (both `ts-node-dev`, `start` without respawn), `test` (`jest`) |
| Jest | installed, `jest.config.ts` uses `next/jest` with jsdom | installed with `ts-jest`, `jest.config.js` with the node environment |
| React Testing Library | installed (`@testing-library/react`, `dom`, `jest-dom`, `user-event`) | not applicable |
| Supertest | not applicable | installed (`supertest`, `@types/supertest`), no tests yet |
| Playwright / Cypress | installed (`@playwright/test` 1.64.0, `cypress` 16.1.1 with its binary, `start-server-and-test`), no config or specs yet | not applicable |
| Test files | `src/components/bookingValidation.test.ts`, `src/components/BookingCard.test.tsx`, `src/lib/api.test.ts` | `tests/schemas/booking.schema.test.ts` |
| Module / TS notes | `type` unset, `module: esnext`, alias `@/*` to `./src/*`. The alias resolves in Jest through `next/jest` (verified by `api.test.ts`). | `commonjs`. `tsconfig.test.json` extends the build config with `rootDir: .`, `types: [node, jest]` and `tests/**` included. The build `tsconfig.json` is unchanged. |

The Jest smoke tests pass in both projects (frontend 5 tests, backend 2 tests). `npx jest --passWithNoTests` passes in both, `npx playwright --version` prints 1.64.0, and `npx cypress --version` reports package and binary 16.1.1. Supertest, Playwright and Cypress have no tests or configuration yet.

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
| Start backend | `cospace-backend` | `npm run dev` (respawns on change) or `npm start` | MySQL running, `DATABASE_URL` in `.env` |
| Frontend Jest + RTL | `cospace-web` | `npm test` | none |
| Backend Jest | `cospace-backend` | `npm test` | none for the schema smoke test |

`npm start` in the backend used to run `node server.js`, which is an empty file, so it started nothing. It now runs `src/index.ts` like `dev`.

### Installed but not configured yet

| Tool | Folder | Status | Next step |
|---|---|---|---|
| Supertest | `cospace-backend` | installed | Write tests after blockers B1 and B2 are resolved. It runs through the existing `npm test`. |
| Playwright | `cospace-web` | `@playwright/test` installed. The browsers come from `npx playwright install`, a large download (Chromium alone is about 190 MiB) that was slow on this network. `npx playwright install chromium` is a lighter option. | Add `playwright.config.ts` and a `"test:e2e": "playwright test"` script. |
| Cypress | `cospace-web` | installed, binary 16.1.1 present | Add `cypress.config.ts` only if Cypress is chosen for the journeys. |
| start-server-and-test | `cospace-web` | installed | Use it to start the servers and run an E2E command in one script. |

Jest matches `*.spec.ts` files by default, so Playwright specs placed inside the frontend project would be picked up by `npm test`. Exclude the E2E folder with `testPathIgnorePatterns` in `jest.config.ts` when the first spec is added.

## 4. Services each test needs

| Test type | Frontend server (3000) | Backend server (5000) | MySQL | Notes |
|---|---|---|---|---|
| Jest unit (schemas, `validateBooking`) | no | no | no | Pure functions. |
| Jest `BookingService` with fake repository | no | no | no, but see blocker B1 | Importing the service loads `utils/db`. |
| RTL component | no | no | no | Mock `@/lib/api` for `BookingList`. |
| Supertest, auth and validation only | no | no (Supertest starts its own in-process app) | needed at import, see B1 and B2 | The 401 and 400 paths do not query the database. |
| Supertest with persistence | no | no | yes, a separate test database | Never the development database. |
| Playwright / Cypress | yes (`npm run dev` or `build` + `start`) | yes (`npm run dev`) | yes | The browser journey needs all three. CORS allows only `http://localhost:3000`. |
| Manual exploratory | yes | yes | yes | Not automated and not a pyramid layer. |

## 5. Test data

| Data | Source | Used by | Caveat |
|---|---|---|---|
| User with `id = 1` | `scripts/seed_and_queries.sql` | Every booking made through the frontend (`DEMO_USER_ID = 1` in `lib/api.ts`) | The booking POST returns 400 if user 1 does not exist. |
| Desks `DESK1` to `DESK4` | the same seed script | Backend integration tests | These names do not match the frontend desk rule `^[A-Z][0-9]{2}$`. The frontend `ensureDesk` creates desks by name, so create `A12`-style desks for browser tests. |
| Bookings from 2026-09-18 onward | the same seed script | Read-path tests | The frontend rejects past dates, so create fresh bookings with dates inside the 6-month window. |
| Auth token | The backend `auth` middleware compares the `Authorization` header with a hard-coded token. The frontend sends `NEXT_PUBLIC_API_TOKEN` from `.env.local`. | Create calls from the browser and Supertest | Both sides must match. Do not print or commit the real values. |
| Fixed dates | Tests that call `validateBooking` | Unit and component tests | `getDateBounds` uses the current date, so use a fake clock or compute dates relative to today. |

## 6. Blockers to fix before the tests can run

| Id | Blocker | Evidence | Needed change |
|---|---|---|---|
| B1 | Importing `BookingService` also imports `utils/db.ts`, which throws if `DATABASE_URL` is missing and creates the Prisma client. | `booking.service.ts` imports `BookingRepository`, which imports `prisma` from `utils/db`. | Mock `../utils/db` in Jest, or set a dummy `DATABASE_URL` for unit tests. |
| B2 | `index.ts` calls `app.listen(5000)` on import and exports `app`. Supertest would open the port, and clash with a running dev server. | `index.ts` lines for `app.listen` and `export default app`. | Split the app from the listener (a source change that needs agreement). |
| B3 | Integration tests would run against whichever database `.env` names. | `db.ts` reads `DATABASE_URL`. | Create a separate test database and point `DATABASE_URL` at it for those runs. |
| B4 | The seed script inserts a `role` column that does not appear in `prisma/schema.prisma`, and it targets `USE cospace;`. | `seed_and_queries.sql` and `schema.prisma`. | Confirm which schema is current before using the seed. This is unverified. |
| B5 | `app/bookings/[id]/page.tsx` is an async Server Component reading `MOCK_BOOKINGS`. | The page source and the Next.js Jest guide. | Cover it with E2E or call it directly, not with RTL. |

## 7. Assumptions

- The tool list (Jest, React Testing Library, Supertest, Playwright, Cypress) comes from the curriculum text, and no other runner is introduced.
- Node on this machine is v26.8.2 (from the terminal), and package compatibility with it has not been checked.
- MySQL is reachable through `DATABASE_URL`, and the test-database setup is not yet done.
- The proposed install lists and scripts have not been run.
