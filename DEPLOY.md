# Putting LabBook online

You end up with two addresses:

- the website, where patients book and the lab signs in
- the API, which the website talks to

They are two separate Vercel projects from the same GitHub repository. That
sounds like extra work but it is simpler: a website is just files, while the
API needs a database connection and secrets, and Vercel handles those
differently.

Everything here is free. No card needed.

---

## Before you start

- A GitHub account
- A Vercel account, signed in with GitHub
- Your MongoDB Atlas connection string, the one already in `server/.env`

---

## Step 1: let Vercel reach your database

Atlas currently only allows your home internet. Vercel's servers are somewhere
else and change address constantly, so they have to be allowed too.

1. Open Atlas and go to your LabBook project
2. Click **Network Access** in the left sidebar
3. Click **Add IP Address**
4. Click **Allow Access from Anywhere**, which shows `0.0.0.0/0`
5. Click **Confirm**

Your database is still protected by its username and password. This only means
Atlas stops refusing connections based on where they come from.

---

## Step 2: put the code on GitHub

In the `labBook` folder, not inside `server` or `client`:

```bash
git init
git add .
git commit -m "LabBook: booking page and lab dashboard"
```

Then make an empty repository on GitHub, named `labbook`, and **do not** tick
"Add a README". GitHub shows you two commands to run. They look like:

```bash
git remote add origin https://github.com/YOUR-NAME/labbook.git
git branch -M main
git push -u origin main
```

### Check your password did not go up with it

This matters.

```
git ls-files | findstr .env
```

That should print nothing except `.env.example` files. If it prints
`server/.env`, your database password is now on GitHub. Tell me and we will fix
it properly, which means changing the password, not just deleting the file.

`.gitignore` already excludes `.env`, so this should be fine. Check anyway.

---

## Step 3: deploy the API

1. In Vercel, click **Add New** then **Project**
2. Pick your `labbook` repository
3. Set **Root Directory** to `server`

   This is the important one. Click **Edit** next to Root Directory and choose
   the `server` folder.

4. Leave the framework as **Other**
5. Open **Environment Variables** and add these three:

   | Name | Value |
   |---|---|
   | `MONGODB_URI` | your full Atlas connection string, the same one in `server/.env` |
   | `JWT_SECRET` | a long random string. Not the one from your `.env`, make a new one |
   | `CLIENT_ORIGIN` | leave this out for now, we fill it in at step 5 |

6. Click **Deploy**

When it finishes, Vercel gives you an address like
`https://labbook-api-xxxx.vercel.app`. Write it down.

**Test it.** Open that address with `/api/health` on the end:

```
https://labbook-api-xxxx.vercel.app/api/health
```

You should see:

```json
{"ok":true,"env":"production","whatsapp":false}
```

If you see an error instead, go to your Vercel project, click the deployment,
then **Functions**, and read the log. It will say what is missing.

### If you get "404 Not Found" instead of the health reply

This is the one part of the setup I could not test, because deploying needs
your accounts. `server/vercel.json` sends every address to the one function,
and Express then decides what to do with it. If Vercel does not pass the
original address through, every route returns 404.

If that happens, send me what you see and I will switch it to the other
arrangement, which is a small change: one file per route group instead of one
for everything. Ten minutes, not a rebuild.

---

## Step 4: deploy the website

1. **Add New** then **Project** again
2. Pick the same `labbook` repository
3. Set **Root Directory** to `client`
4. Framework should be detected as **Vite**. Leave the build settings alone.
5. Add one environment variable:

   | Name | Value |
   |---|---|
   | `VITE_API_BASE` | your API address plus `/api`, for example `https://labbook-api-xxxx.vercel.app/api` |

   The `/api` on the end is required. Without it nothing will load.

6. Click **Deploy**

You now have a second address, something like `https://labbook-xxxx.vercel.app`.

---

## Step 5: let the website talk to the API

The API refuses calls from websites it does not know, so tell it about the one
you just made.

1. Go to your **API** project in Vercel
2. **Settings**, then **Environment Variables**
3. Add:

   | Name | Value |
   |---|---|
   | `CLIENT_ORIGIN` | `https://labbook-xxxx.vercel.app,*.vercel.app` |

   Use your real website address. The `*.vercel.app` part allows the extra
   addresses Vercel creates for each deployment.

4. Go to **Deployments**, click the three dots on the most recent one, and
   choose **Redeploy**

Environment variables only take effect on a new deployment, which is why this
last step is needed.

---

## Step 6: check it works

Open these on your phone, not just your laptop:

```
https://labbook-xxxx.vercel.app/nandu
https://labbook-xxxx.vercel.app/dashboard
```

Then:

1. Make a booking on the `/nandu` page
2. Sign in to the dashboard with `owner@nandu.test`
3. Check the booking is there
4. Press refresh on the dashboard page. It should stay on the dashboard, not
   show a "404 Not Found"

That last one is what `client/vercel.json` is for. Without it, visiting any
address other than the home page would fail.

---

## Change the demo password

`nandu1234` is now reachable by anyone who finds the address. Change it.

In the `server` folder on your computer:

```bash
node -e "const b=await import('bcryptjs');console.log(await b.default.hash('YOUR-NEW-PASSWORD',10))" --input-type=module
```

That prints a long string starting with `$2a$`. Then in Atlas:

1. **Browse Collections**
2. Open the `labbook` database, then the `users` collection
3. Find `owner@nandu.test`, click edit
4. Replace `passwordHash` with the string you just generated
5. Save

---

## Things to know

**The first visit after a quiet spell is slow.** Vercel stops your API when
nobody is using it and starts it again on the next request, which takes a few
seconds. Normal for the free plan. Load the page once before showing anyone.

**Bookings keep saving even if WhatsApp is not set up.** The messages are
written to the Vercel logs instead of being sent, exactly as they are on your
computer now.

**The rate limit resets more often than it should.** It counts bookings per
device in memory, and Vercel may run several copies of your API at once, each
with its own count. So the limit is looser when hosted than it is locally. Not
a problem at your scale. The proper fix is to keep the count in the database.

**Your real data is live now.** The hosted site uses the same Atlas database as
your computer, so bookings you make while testing on the live site show up in
your local dashboard too. That is usually what you want while developing. Keep
it in mind before showing a lab.

---

## Before a client uses this for real

- Fix the slot capacity race (see the README)
- Change the demo password, as above
- Narrow `0.0.0.0/0` in Atlas if Vercel ever publishes a fixed IP range
- Create a separate lab for public demos so no real business's name and phone
  number sit on a page anyone can find
