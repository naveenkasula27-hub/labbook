# LabBook status

Updated 2 November 2026. This describes local source, not a verified deployment.

## Implemented

- Separate lab booking pages, catalog/prices, dashboard and home sample collection.
- Atomic slot seats to prevent simultaneous bookings taking the same place.
- Booking status lookup requires four matching phone digits; checks have a shared rate limit.
- Dashboard summary aggregates use a MongoDB ObjectId.
- Rejected asynchronous route and middleware operations reach the JSON error handler.
- Home bookings check individual tests and every test inside selected packages.
- Slot times are valid 24-hour times and must end after they start.
- Password changes and administrator resets invalidate older sessions, including pre-update tokens.
- Password changes in Settings; administrators manage labs and reset owner/staff passwords.
- Shared MongoDB fixed-window counters for bookings, login, password attempts and public lookups.
- Private PDF upload/download/delete in booking details. PDF files up to 2 MB live in MongoDB.
- Patients download ready/completed reports using their reference and full booking phone number.
- WhatsApp template sends, patient reminders via GitHub Actions, demo reset via Vercel cron.
- Manual billing tracking; payment collection remains outside the app.

## Set up an administrator

From server, run `npm run admin:create`, then sign in at `/dashboard`.
This creates one new account; it does not change any existing account.
The terminal password prompt explicitly displays typed characters. Use a private terminal.
Use the administration screen to create a lab, its catalog and owner account together.
New catalogs start with empty prices. The owner fills them in under Prices.
Onboarding transactions require MongoDB Atlas or a replica set, not a standalone local MongoDB.
Existing owners change passwords in Settings; forgotten passwords are reset by the administrator.
Self-service email password recovery and public self-registration are not implemented.

## Reports

Staff upload PDFs from expanded booking details. Upload replaces the previous PDF.
Mark the booking report ready to release the file to the patient. Upload alone does not send a message.
Patients open `/<lab-slug>/check`, look up their booking, then enter their full phone to download.
Files are attachments with no-store headers; never public URLs. A reference plus full phone is
knowledge-based access, not phone ownership verification. Keep the reference private.
Demo reset removes the demo lab's reports. Real reports are kept until the lab deletes them.

## Before deploying

1. Run `npm test`, `npm run test:api` in server and `npm run build` in client.
2. API integration tests use isolated `labbook_test_*` databases, never the production database.
3. Review these local changes, then deploy both server and client. Check `/api/health` afterward.
4. Create the administrator intentionally; no administrator or new real lab was created by this change.
5. Confirm the GitHub Actions reminder secrets and latest run; local source cannot prove delivery.
6. Confirm the Vercel cron secret and nightly reset execution.
7. Use separate development and production MongoDB credentials/databases.

## Remaining product work

- Payment gateway/subscription automation (manual billing exists).
- Optional phone OTP for report downloads, email verification and email password recovery.
- Agree report retention/deletion and backup procedures with each lab.
- Validate the landing-page copy with a real lab owner before paid advertising.
- Confirm WhatsApp delivery and production hosting settings after deployment.

Legacy deployment addresses in DEPLOY.md must be verified before relying on them.
