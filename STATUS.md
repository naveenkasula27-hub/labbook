# LabBook: where things stand

Last updated 15 October 2026.

Live and working:

- Website: https://labbook-d5sm.vercel.app
- Booking page: https://labbook-d5sm.vercel.app/nandu
- Dashboard: https://labbook-d5sm.vercel.app/dashboard
- API: https://labbook-ten.vercel.app
- Health check: https://labbook-ten.vercel.app/api/health

Vercel projects: `labbook` is the API, `labbook-d5sm` is the website. Both
build from the same GitHub repo, each pointed at a different folder.

---

## Done

**Deployed.** Two Vercel projects from one repo, Atlas open to Vercel,
environment variables set on both.

**Double booking fixed.** Two people pressing Book at the same moment can no
longer take the same last place in a slot. Each booking claims a numbered
place and the database refuses a second claim on the same number. Proved by a
test that fires eight requests at a two-place slot and checks exactly two get
in. Existing bookings were given place numbers by the backfill script.

**Passwords changed.** The Atlas database user, and the dashboard login for
`owner@nandu.test`. The demo `nandu1234` no longer works.

**Tests.** 71 offline, 77 against a real database. All passing.

```bash
cd server
npm test          # no database needed, a few seconds
npm run test:api  # talks to Atlas, about 20 seconds
```

The database tests use separate databases named `labbook_test_*` and wipe
those. Your real `labbook` data is never touched, there is a check in
`test/_dburi.mjs` that refuses to run against anything else.

---

## Still open

### The demo lab is a real business

"Nandu Diagnostics", Gajwel, phone 99490 70916 is on a page anyone can find.

If they have agreed to it, fine. If not, change it: Atlas, `labbook` database,
`labs` collection, edit `name`, `tagline`, `phone` and `whatsapp`. Use your own
number so demo bookings reach you. The `slug` field controls the URL, so
changing it changes the address from `/nandu` to `/your-new-slug`.

### The API root returns a 500

`https://labbook-ten.vercel.app/` crashes rather than answering. Nothing uses
it, the website never calls it.

The cause: Vercel builds two functions from the `server` folder. One from
`api/index.js` serves `/api/*` and works. Another, from `src/index.js`, serves
everything else and has no valid entry point.

We tried fixing it by moving the handler into `src/index.js` and re-exporting
it from `api/index.js`. That broke `/api/*` entirely, because Vercel's build
could not parse `export { default } from "..."` even though Node can. It was
reverted within a few minutes.

If it is ever worth fixing, the two approaches not yet tried are changing the
project's Framework Preset away from Express, or writing explicit function
configuration in `server/vercel.json`. Both only show their behaviour once
deployed, so change one thing, deploy, and check `/api/health` immediately.

### Changing a password does not sign anyone out

Existing sessions keep working until their token expires. If you ever need to
lock someone out of a lab's dashboard straight away, changing the password is
not enough on its own.

### The rate limit is looser when hosted

Bookings per device are counted in memory, and Vercel runs several copies of
the API, each with its own count. Not a problem at your volume. The proper fix
is to keep the count in the database.

### The live site and your laptop share one database

Test bookings made on the live site show up in your local dashboard. Useful
while developing. Worth remembering before a demo so you are not scrolling
past your own test entries.

### Leftover test databases in Atlas

`labbook_test_api`, `labbook_test_dash`, `labbook_test_ratelimit` and
`labbook_test_slots` are created by the test suite. Harmless, and recreated
each run. Delete them if the clutter bothers you.

---

## Useful commands

All from the `server` folder.

```bash
npm run dev                          # local API on port 4000
npm run seed                         # demo lab, tests, packages, bookings
npm test                             # offline tests
npm run test:api                     # tests against a real database

npm run set-password -- EMAIL        # change a dashboard password
npm run backfill:seats               # show what place numbers would change
npm run backfill:seats -- --write    # apply them, and build the unique index
```

`set-password` asks for the password rather than taking it as an argument, so
it stays out of your shell history. Use it for every lab you set up.

---

## Environment variables

API project (`labbook`):

| Name | What it is |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | signs login sessions |
| `CLIENT_ORIGIN` | which websites may call the API |

Website project (`labbook-d5sm`):

| Name | What it is |
|---|---|
| `VITE_API_BASE` | the API address plus `/api` |

Changing any of these needs a redeploy of that project before it takes effect.
Vercel does not apply them to deployments that already exist.

---

## Before a paying client

- Change the demo lab's details, or create a separate one for demos
- Keep the count for the rate limit in the database rather than in memory
- Give each lab its own database user, rather than one `atlasAdmin` for
  everything
- Narrow `0.0.0.0/0` in Atlas if Vercel ever publishes a fixed IP range
