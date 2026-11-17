# LabBook

A booking application for diagnostic labs. One installation serves many labs,
each with its own booking page, test list, prices and WhatsApp number.

Built with MongoDB, Express, React and Node. WhatsApp messages go straight from
this server to Meta's Cloud API. There is no n8n, Zapier or other middleman.

## What is working now

**For patients**

- A booking page for each lab at `/<lab-slug>`, for example `/nandu`
- 116 tests and 9 checkup packages, searchable and filtered by category
- Sample at the lab or at the patient's home, with the home fee added
- Date and time slots, with full slots blocked
- Bookings saved to the database and a WhatsApp alert sent to the lab
- A booking reference the patient can quote, and a page to check their status

**For the lab**, at `/dashboard`

- Sign in, and stay signed in
- Counts for today, tomorrow, and anything needing attention
- A bookings list, filtered by status or date, searchable by name, phone or
  reference
- Move a booking along: confirmed, sample collected, report ready, completed.
  Marking a report ready messages the patient
- Cancel a booking or mark it as not attended
- Private notes on a booking that the patient never sees
- Set test and package prices, or leave a price empty to quote it yourself
- Stop offering a test, which removes it from the booking page
- Edit the lab's own details, opening days, time slots and alert settings

Built for labs outside India too: currency, language, time zone and phone
format all come from the lab's own settings.

## Current improvements

See STATUS.md for the current implementation and deployment checklist.

- Dashboard counts, four-digit booking checks, package home-collection checks and slot time validation are fixed.
- Async route failures return JSON errors.
- Rate limits are stored atomically in MongoDB across server instances.
- Password changes in Settings sign out older sessions.
- Run `npm run admin:create` in server to create an administrator, then sign in at `/dashboard`.
  Administrators create labs and owner accounts and reset forgotten lab passwords.
- Labs upload, replace, download and delete PDFs (up to 2 MB) in booking details.
  Patients download released reports with their reference and full booking phone number.
- Patient reminders run through `.github/workflows/reminders.yml`.
- Demo reset is configured in server/vercel.json.

Onboarding uses MongoDB transactions: use Atlas or a local replica set.
Public self-registration, email password recovery and automated payment collection remain future work.

## Running it

You need Node 20 or newer and MongoDB.

### 1. The API

```bash
cd server
npm install
cp .env.example .env     # on Windows: copy .env.example .env
```

Open `.env` and set `MONGODB_URI`. Use `mongodb://127.0.0.1:27017/labbook` for a
local MongoDB, or paste your MongoDB Atlas connection string. Put any long
random string in `JWT_SECRET`.

Then load the demo lab and start the server:

```bash
npm run seed
npm run dev
```

The API runs on http://localhost:4000

### 2. The booking page

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173/nandu for the booking page, and
http://localhost:5173/dashboard for the lab's side.

The seed script creates a dashboard login:

```
owner@nandu.test
nandu1234
```

Change that password before this is online anywhere.

### WhatsApp

Leave the WhatsApp settings in `.env` blank to begin with. Bookings still save
and the messages are printed to the terminal instead of being sent. Nothing
breaks.

To send real messages, create an app at developers.facebook.com, add the
WhatsApp product, and copy the phone number ID and access token into `.env`.

One thing to know about Meta's rules: you can only send free text within 24
hours of the person messaging you first. A confirmation or a reminder that you
send first needs a message template approved by Meta. `sendTemplate()` in
`server/src/services/whatsapp.js` is there for that.

## Tests

```bash
cd server
npm test          # unit, isolation and hosting tests; no database needed
npm run test:api  # the API end to end. Needs MongoDB.
```

`npm test` covers phone numbers across six countries, dates across time zones,
booking references, the catalog, and lab isolation. The isolation tests matter
most: they replace the database layer with stubs that record every query the
dashboard builds, then check that each one is filtered to the logged-in lab and
that a lab id sent in the body or query string is ignored.

`npm run test:api` writes to a separate database called `labbook_test` and
wipes it at the start of each run. It does not touch your real data, and it
never sends a WhatsApp message.

## How the multi-tenant part works

Every test, package, booking and user row carries a `lab` field. All queries
filter on it, so one lab can never see or book another lab's tests. The lab is
identified by the slug in the URL.

The public API only returns a safe subset of each lab's record. Plan, billing
and notification settings are not exposed.

Prices are always read from the database, never taken from the browser, so the
amount cannot be changed by editing the page.

## Adding a new lab

Run `npm run admin:create` in server once and sign in at `/dashboard` as that administrator.
Use **Add a diagnostic lab** to set the lab name, booking address, phone and owner login.
The lab and full unpriced catalog are created together. Share credentials privately;
the owner can change their password in Settings and enter prices in Prices.

## Layout

```
server/
  src/
    config.js                  settings from .env
    index.js                   the Express app
    models/                    Lab, Test, Package, Booking, User
    middleware/auth.js         checks the login token on every dashboard call
    routes/
      public.js                the booking page API, no login
      auth.js                  login
      dashboard-bookings.js    the lab's bookings
      dashboard-catalog.js     the lab's prices and settings
    services/whatsapp.js       Meta Cloud API calls
    lib/                       phone numbers, dates, references, tokens
    seed/catalog.js            the standard test catalog
  test/
client/
  src/
    pages/
      BookingPage.jsx          the patient's booking page
      CheckBookingPage.jsx     patient checks their status
      LoginPage.jsx            lab sign in
      DashboardPage.jsx        the lab's shell and tabs
      BookingsPage.jsx         bookings list and status changes
      PricesPage.jsx           test and package prices
      SettingsPage.jsx         lab details, days, slots, alerts
    components/                test list, packages, basket, form, confirmation
    lib/api.js                 public API calls, money and date formatting
    lib/dash.js                dashboard API calls and the login token
```

## A note on the test catalog

The names in `server/src/seed/catalog.js` are standard pathology test names,
written for this project. No price list is copied from any lab or chain. Every
price starts empty and each lab sets its own.
