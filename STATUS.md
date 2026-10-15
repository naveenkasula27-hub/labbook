# LabBook: where things stand

Last updated 15 October 2026, end of day.

## Addresses

| What | Address |
|---|---|
| Front page, where ads should point | https://labbook-d5sm.vercel.app |
| Public demo lab | https://labbook-d5sm.vercel.app/maheera |
| Dashboard | https://labbook-d5sm.vercel.app/dashboard |
| Nandu's page | https://labbook-d5sm.vercel.app/nandu |
| API | https://labbook-ten.vercel.app |
| Health check | https://labbook-ten.vercel.app/api/health |

Vercel projects: `labbook` is the API, `labbook-d5sm` is the website. Both build
from the same GitHub repo, each pointed at a different folder.

Demo login, published on purpose: `demo@maheera.test` / `demo1234`

---

## What exists

**Two labs on one site.** Nandu Diagnostics at `/nandu`, and Maheera
Diagnostics at `/maheera`. Separate data. A lab signed into one cannot see the
other's bookings, and there are tests for that.

**Maheera is the public demo.** An invented lab in Ramayampet with Naveen's own
phone number, marked as a demo in the database, so its page carries a notice
saying it is a sample rather than a real business. Anyone can sign in and
change whatever they like.

**A front page.** Explains what the product is, shows both sides of a booking,
links to the demo, and ends on WhatsApp. The root address used to redirect to
`/nandu`, which meant anyone typing the bare address landed on a real
business's booking page.

**The UnityWebWorks palette on the demo.** Navy header, orange buttons, Poppins
and Lato, the split-U logo and the tagline in a strip above the page. Colours
are set per lab, not in the stylesheet, so a real client's site is their own
colours. That is part of what the demo is showing.

**Double booking is fixed.** Two people pressing Book at the same moment can no
longer take the same last place in a slot. Each booking claims a numbered place
and the database refuses a second claim on the same number. There is a test
that fires eight requests at a two-place slot and checks exactly two get in.

**Passwords changed.** The Atlas database user, and the dashboard login. The
old `nandu1234` no longer works anywhere.

---

## Still open

### No landing page copy has been tested on a real lab owner

The page says what the product does and offers a free demo first. Nobody has
read it yet except us. Show it to one lab owner before spending money on ads.

### The demo does not reset itself

Visitors can change prices and cancel bookings, and it stays that way until it
is cleaned by hand:

```bash
cd server
npm run demo-lab:reset
```

Making that run nightly needs a Vercel cron job, about half an hour of work.
Worth doing once people are actually visiting, not before.

### The API root returns a 500

`https://labbook-ten.vercel.app/` crashes instead of answering. Nothing uses
it, the website never calls it.

Vercel builds two functions from the `server` folder. One from `api/index.js`
serves `/api/*` and works. Another, from `src/index.js`, serves everything else
and has no valid entry point.

Fixing it by moving the handler into `src/index.js` and re-exporting it from
`api/index.js` broke `/api/*` entirely, because Vercel's build could not parse
`export { default } from "..."` even though Node can. It was reverted within
twenty minutes. The two approaches not yet tried are changing the project's
Framework Preset away from Express, or writing explicit function configuration
in `server/vercel.json`. Both only show their behaviour once deployed, so
change one thing, deploy, and check `/api/health` immediately.

### Changing a password does not sign anyone out

Existing sessions keep working until their token expires.

### The rate limit is looser when hosted

Bookings per device are counted in memory, and Vercel runs several copies of
the API, each with its own count. The proper fix is to keep the count in the
database.

### The live site and the laptop share one database

Test bookings made locally show up on the live site and the other way round.

### Nandu Diagnostics is a real business

Its page is still public at `/nandu`. Nobody will guess the address, and ads
point at `/maheera` instead, but it is there.

---

## Commands

All from the `server` folder.

```bash
npm run dev                          # local API on port 4000
npm run seed                         # Nandu's demo data
npm test                             # 71 tests, no database needed
npm run test:api                     # 77 tests against a real database

npm run demo-lab                     # create or update Maheera
npm run demo-lab:reset               # wipe what visitors did to it
npm run set-password -- EMAIL        # change a dashboard password
npm run backfill:seats               # show what place numbers would change
npm run backfill:seats -- --write    # apply them
```

The database tests use separate databases named `labbook_test_*` and wipe
those. The real `labbook` data is never touched: `test/_dburi.mjs` refuses to
run against anything not named as a test database.

---

## Environment variables

API project (`labbook`): `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`

Website project (`labbook-d5sm`): `VITE_API_BASE`, `VITE_DEMO_EMAIL`,
`VITE_DEMO_PASSWORD`

Changing any of them needs a new deployment of that project. Vercel does not
apply them to deployments that already exist. The `VITE_` ones are read when
the site is built, not when it loads, so they need a rebuild rather than a
restart.

---

## Setting up a new lab

1. Copy `server/src/scripts/demo-lab.js` and change the lab details at the top
2. Run it to create the lab, its tests and its login
3. `npm run set-password -- their@email` to set a password you can give them
4. Send them `labbook-d5sm.vercel.app/their-slug`

Their colours go in the lab's `theme` field: `primary` for the header, `cta`
for the buttons. Leave `cta` empty and the buttons match the header.

---

## Before a paying client

- Keep the rate limit count in the database rather than in memory
- Give each lab its own database user, rather than one `atlasAdmin` for all
- Turn WhatsApp on, so confirmations actually send instead of going to the logs
- Narrow `0.0.0.0/0` in Atlas if Vercel ever publishes a fixed IP range

---

## Two things worth remembering

**Vercel's build is not Node.** Code that passes `npm test` locally can still
fail once deployed, as the `export { default } from` change proved. After any
change to `api/index.js`, `src/index.js` or `vercel.json`, open
`/api/health` straight after the deploy rather than trusting the test suite.

**Close files in VS Code before Claude writes to them.** A write was silently
overwritten by VS Code saving its older copy of the same file.
