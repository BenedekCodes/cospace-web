# CoSpace testing strategy

| Behaviour or check | Test level | Boundary exercised | Why this level is appropriate |
|---|---|---|---|
| A desk-name validation function rejects a desk name below its confirmed minimum | Unit | One pure function (`validateBooking` in `bookingValidation.ts`) with no DOM, network or database | The rule is pure logic, so a unit test is fast and precise. Higher levels add no confidence in the rule itself. The frontend has no separate minimum length, only the pattern `^[A-Z][0-9]{2}$`, and the backend `createDeskSchema` has `min(1)`, so the test must target one confirmed rule. |
| `CreateBookingForm` displays an accessible validation message | Component | React rendering, state, the real `validateBooking` and the DOM attributes (`role="alert"`, `aria-invalid`, `aria-describedby`) | A rendered form with `onAdd` and `existingBookings` props is enough to assert the message and its accessibility wiring. E2E would be slower and still could not prove that a screen reader announces it well. |
| `BookingService` rejects invalid business data when its repository is mocked | Unit / component (service with a fake `BookingRepository`) | The service class only, with no Express, Prisma or database | The constructor accepts a repository, so `NotFoundError` and the P2002 to `ConflictError` and P2003 to `BadRequestError` mappings can be tested quickly. A mock cannot prove MySQL really raises those errors, which is why check 4 is needed. |
| A Supertest request passes through Express middleware and persists a booking in MySQL | Integration | HTTP, `express.json`, `auth`, `validateSchema`, controller, service, repository, Prisma and MySQL | Only a real request against a real database confirms the 201, the 400 and 409 mappings, the unique desk-and-date constraint and the 401 without the token. E2E would add the browser but make backend failures harder to diagnose. |
| A browser user searches for a booking and opens its detail route | E2E | Browser, Next.js routing, client-side search in `BookingList`, the card link, `/bookings/[id]`, and through the list the API and database | Only a full journey exposes cross-layer faults. For example, the detail page reads `MOCK_BOOKINGS` while the list links real API ids. Search filtering alone belongs at component level. |
| A tester explores whether closing and reopening the modal retains stale input | Manual exploratory | `BaseModal` open and close, the `CreateBookingForm` state lifecycle, focus return, and a close during the simulated 2-second submit | The behaviour is an open question that needs human judgement and varied input (keyboard, backdrop, Escape, timing). Once the outcome is understood, an automated component test can pin it. |

**Pyramid shape:** many fast unit and component tests cover validation, forms and services, fewer integration tests cover the API and database boundary, and only a small number of slow browser journeys cover the critical flows, while manual exploratory testing complements the pyramid as a human-driven activity rather than another automated layer.

## Risk ranking (highest to lowest)

Risk is judged as likelihood of failure multiplied by impact, using only behaviour confirmed in the source.

| Rank | Area | What could fail | Who is affected | Why the impact matters |
|---|---|---|---|---|
| 1 | Booking creation | A duplicate desk and date is accepted or wrongly rejected (frontend `validateBooking` against backend `uniq_desk_date` and the 409). A missing user or desk gives a 500 instead of a 400 (the P2003 mapping, a past regression). `ensureDesk` creates a desk and then `postBooking` fails, leaving an orphan desk. An existing desk keeps its stored floor, not the typed one. The `/dashboard` form shows "Booking created successfully." without calling the API. | Employees who book desks, and colleagues who rely on the desk being theirs. | It is the only write path. A wrong result is either a double-booked desk or a false confirmation, and both are data-integrity and trust failures that are hard to notice. |
| 2 | Booking details routing | `BookingCard` links to `/bookings/${id}` with real API ids, but the page reads `MOCK_BOOKINGS` (ids "1" to "3"). Real bookings show "Booking not found". Ids 1 to 3 show mock desk and floor values that may differ from the stored booking. A card saved but not yet confirmed links to a temporary negative id. | Anyone who opens a booking from the list. | Confirmed from the source, so failure is near-certain. Wrong data shown as if it were real is worse than an error. |
| 3 | API data loading | The list requests `limit: 50` and ignores `meta.total`, so bookings beyond the first 50 never appear and the "x of N bookings" count is misleading. A malformed response gives "unexpected format". An offline server gives the offline message. The backend allows only `http://localhost:3000` through CORS. | Everyone who opens the list. | A failure blocks the whole page, but it is visible and the code already handles abort, timeout, offline and bad-shape cases, so the risk is lower than 1 and 2. |
| 4 | Dashboard table | `DashboardContent` uses hard-coded `INITIAL_BOOKINGS` and local state, so data is lost on reload. A new row gets an id from `Math.max` + 1. The row may not contain the submitted values. | Users of `/dashboard`. | The table only displays data. The harm is that it misleads, and it feeds no other component with data. |
| 5 | Modal behaviour | The focus trap fails, Escape does not close, focus does not return to the trigger, or input state is retained after close (`BaseModal` returns `null` when closed, so the state should reset). A close during the simulated 2-second submit still fires `onAdd`. | Keyboard and screen-reader users first. | It is a usability and accessibility risk with no data corruption. Failures are local and easy to fix. |

## Strong assertion for the highest-risk area (booking creation)

Vague: "the booking was created and the page looks fine".

Observable (component level, `BookingList` with `api.ts` mocked so the desk lookup and `POST /bookings` return 201 with `id: 7`):

> After the user submits desk `A12`, floor `2` and date `2026-10-20`, the list contains exactly one link to `/bookings/7` whose card shows the heading "Desk A12", a floor value of `2` and a `<time>` element with `dateTime="2026-10-20"`, and the form fields are empty with focus on the Desk input.

This fails if the row has the wrong desk or date, if the temporary negative id is not replaced by the saved id, or if the card is duplicated. The same behaviour at the API level has its own assertion: `POST /bookings` returns 201 with a numeric `id`, and `GET /bookings` then contains a row with `desk.name === "A12"` and a `booking_date` starting `2026-10-20`.

Other vague statements replaced with evidence:

| Vague | Observable evidence |
|---|---|
| "Validation works" | `role="alert"` element with the text "Desk must be one letter followed by two digits, for example A12.", and the desk input has `aria-invalid="true"`. |
| "The duplicate is rejected" | `POST /bookings` for the same desk and date returns 409 with `error: "A booking already exists for this desk and date"`. |
| "The list loads" | The list contains one card per row returned by `GET /bookings`, and the count text reads "N of N bookings". |
| "The modal behaves" | After Escape, no `role="dialog"` is in the DOM and `document.activeElement` is the "New booking" button. |

## Strategy checks

- **Every pyramid level has a CoSpace example.** Unit: `validateBooking`. Component: `CreateBookingForm` and `BookingService` with a fake repository. Integration: Supertest against Express and MySQL. E2E: search a booking and open its detail route.
- **The same behaviour is covered at more than one level on purpose.** The duplicate-booking rule exists in `validateBooking` (unit, fast feedback), in `RegistrationForm` (component, the message is shown and focus moves), and in the database as `uniq_desk_date` with the 409 mapping (integration). The frontend check can be bypassed by another client or a race, and only the backend rule is authoritative, so each level proves a different boundary.
- **Not everything is E2E.** One of the six checks is E2E. A second journey (create a booking, then reload and see it) is enough at the top, because it spans the form, the API and MySQL. Search filtering, validation messages and error mapping stay lower.
- **Manual exploratory testing stays separate.** The modal stale-input check is a human-run charter and is not counted in the pyramid. It becomes an automated component test only after the behaviour is understood.

## Assumptions

- The ranking uses the source as read and assumes the frontend runs against the real backend, not the mock detail data.
- Jest, Supertest, Playwright and Cypress are installed with smoke tests only (see `environment_checklist.md`). The six classified checks above are planned levels, not yet written tests.
