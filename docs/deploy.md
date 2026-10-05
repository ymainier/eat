# Deploying Eat

This guide takes Eat from this repository to a production URL that your Household can sign in to, using only free tiers (ADR-0003). The pieces are:

- **Vercel Hobby** runs the Next.js app and deploys every push to `main`.
- **Neon** (added through the Vercel Marketplace) hosts Postgres.
- **Resend** sends the magic-link sign-in emails.

Allow 30–60 minutes, most of it waiting for DNS if you verify a domain for email.

What the repository already handles:

- `vercel.json` sets the build command to `npm run build:vercel`. That command applies database migrations before `next build`, on production deployments only. It also runs the app's functions in London (`lhr1`).
- `package.json` pins Node.js to 24.x.
- In production the app refuses to start without `RESEND_API_KEY`, so sign-in emails can't silently go nowhere.

## 0. Before you start

You need:

- A Vercel account connected to GitHub, with access to `ymainier/eat`.
- Node.js 24 and this repository checked out locally (for the one-off seed step).
- The Vercel CLI:

  ```sh
  npm i -g vercel
  vercel login
  ```

Write down the emails that should be able to sign in (yours, your partner's, …). Only these can sign in.

## 1. Email: choose how sign-in emails are sent

Resend only delivers to arbitrary addresses from a **domain you have verified**. Pick one path:

| Path | You need | Who can sign in |
| --- | --- | --- |
| **A. No domain (quick start)** | Nothing | Only the single email address your Resend account is registered with |
| **B. Your own domain** | A domain whose DNS you can edit | Anyone on the allow list |

Path A is fine to get going alone. Move to B before adding a second Member: with A, sending to any other address fails with a 403 "You can only send testing emails to your own email address".

If you don't own a domain, you can buy one (a few euros/dollars a year, the only non-free part). The simplest place is the Vercel dashboard (**Domains → Buy**): Resend can then add the DNS records automatically.

### 1.1 Create the Resend account

1. Sign up at <https://resend.com/signup>. **For path A, sign up with the email you will sign in to Eat with.**
2. The free plan covers 3,000 emails a month and 100 a day, far more than sign-in links need.

### 1.2 Path B only: verify a sending domain

Send from a subdomain such as `mail.example.com` rather than `example.com` itself. That's Resend's recommendation, and it keeps these records apart from any email you already receive on the domain.

1. In Resend, go to **Domains → Add Domain**.
2. Enter the subdomain, e.g. `mail.example.com`.
3. Choose the region closest to you (for the UK: **Ireland, eu-west-1**).
4. Resend shows the DNS records to create, typically:
   - an `MX` record on `send.mail` (priority 10): the bounce/return path;
   - a `TXT` record on `send.mail`: SPF;
   - a `TXT` record on `resend._domainkey.mail`: DKIM.

   Copy the names and values **exactly** from Resend's screen, which is the source of truth. Many DNS providers (Vercel included) want the name without your domain, e.g. `send.mail`, not `send.mail.example.com`.
   - **If your DNS is on Vercel:** click **Auto Configure** in Resend and authorise Vercel. It adds the records for you.
   - **Otherwise:** add the records at your DNS provider.
5. Recommended: add a DMARC record. Create a `TXT` record named `_dmarc` (on the root domain) with value `v=DMARC1; p=none;`. It improves deliverability, so sign-in links are less likely to land in spam.
6. Click **Verify DNS Records**. Verification usually takes minutes, but can take up to 72 hours. Wait until the domain shows **Verified** before testing sign-in.

### 1.3 Create the API key

1. In Resend, go to **API Keys → Create API Key**.
2. Name it `eat-production`.
3. Set the permission to **Sending access**. For path B, also restrict it to your domain.
4. Copy the key, which starts with `re_`. **Resend shows it only once.** You'll paste it into Vercel in step 4.

### 1.4 Decide the sender (`EMAIL_FROM`)

- Path A: `Eat <onboarding@resend.dev>`
- Path B: `Eat <eat@mail.example.com>`. Any local part works, but the domain must be the one you verified.

## 2. Create the Vercel project

Do this either from the terminal (2a, no failed first deployment) or from the dashboard (2b). Either way the build settings come from `vercel.json`, so there's nothing to configure.

### 2a. From the terminal

From the repository root:

```sh
vercel link
```

Answer the prompts:

1. **Set up "~/src/eat"?** Yes.
2. **Which scope?** Your personal account.
3. **Link to existing project?** **No**. This creates a new project.
4. **Project name?** `eat`.
5. **In which directory is your code located?** `./`.
6. It detects **Next.js**. Don't modify the settings.

This creates the project without deploying anything, and writes `.vercel/` locally. `.vercel/` is gitignored, so it isn't committed.

Then connect the GitHub repository, so every push to `main` deploys:

```sh
vercel git connect
```

The CLI reads the `origin` remote (`github.com/ymainier/eat`) and asks for confirmation. If it says it can't access the repository, Vercel's GitHub app doesn't have access yet. Grant it at <https://github.com/apps/vercel> (**Configure** → add `ymainier/eat`), then run the command again.

### 2b. From the dashboard

1. In Vercel, click **Add New… → Project** and import the GitHub repository `ymainier/eat`.
2. Leave the defaults (Next.js, root directory `./`, build command from `vercel.json`) and click **Deploy**.
3. **This first deployment is expected to fail** with `DATABASE_URL is not set`, because there is no database yet. That's fine: it created the project.
4. Run `vercel link` from the repository and pick the existing `eat` project. Steps 3 to 5 use the CLI.

### Your production URL

Production deployments are served at `https://<project-name>.vercel.app`. If that name is taken, the domain gets a suffix, e.g. `eat-ymainier.vercel.app`. Find the exact domain under **Settings → Domains** in the project (`vercel project inspect` also shows it).

You need it for `BETTER_AUTH_URL` in step 4. With 2a the domain may only appear after the first production deployment. If so, add `BETTER_AUTH_URL` after step 6 and redeploy once more. Sign-in won't work until it's set, but everything else deploys fine.

## 3. Add the database (Neon via the Vercel Marketplace)

### From the terminal

With the project linked (step 2):

```sh
vercel integration add neon --help    # shows the plans and metadata keys, e.g. the region key and its values
vercel integration add neon --name eat --environment production --no-env-pull
```

- The command prompts for anything you don't pass as flags. Choose the **free** plan and the **London** region, as described in the settings below. To skip the prompts, pass the plan with `--plan` and the region with `--metadata <key>=<value>`, using the exact names that `--help` printed.
- `--environment production` connects the database to Production only.
- `--no-env-pull` stops the CLI writing the production database URL into a local `.env.local`, which would override your local Docker database.

If Neon isn't installed on your Vercel account yet, the command installs it first and may ask you to accept Neon's terms.

### From the dashboard

1. In the project, open the **Storage** tab, then **Create Database → Neon**. Alternatively, go to <https://vercel.com/marketplace/neon> and click **Install**.
2. If asked, choose **Create New Neon Account**. This Vercel-managed account is billed through Vercel and stays on the free plan. If you already have a Neon account you can link it instead; either works.
3. Settings:
   - **Region:** **AWS Europe (London), eu-west-2**, next to the app's `lhr1` functions. Choosing another region still works but adds latency. To avoid that, change `regions` in `vercel.json` to the matching Vercel region (e.g. `fra1` for Frankfurt, `iad1` for US East).
   - **Plan:** **Free**.
   - **Name:** `eat`.
4. Once created, open the database and click **Connect Project**. Select the `eat` project and **only the Production environment**:
   - Leave Development and Preview unticked.
   - Leave preview branching off.

   Vercel then adds `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED` (direct) and a few `PG*`/`POSTGRES_*` variables to the project. The app uses `DATABASE_URL`; migrations on Vercel use `DATABASE_URL_UNPOOLED`.

Neon's free plan suspends the database after a few minutes without traffic. The first page load after a quiet period is therefore a little slower while it wakes up. That's expected.

## 4. Set the environment variables

In **Settings → Environment Variables**, add these with the **Production** environment only. Mark the secrets as **Sensitive**.

| Name | Value | Sensitive |
| --- | --- | --- |
| `BETTER_AUTH_URL` | Your production URL from step 2, e.g. `https://eat-ymainier.vercel.app`: `https://`, no trailing slash | no |
| `BETTER_AUTH_SECRET` | Output of `openssl rand -base64 32` | yes |
| `ALLOWED_EMAILS` | Comma-separated emails, e.g. `you@example.com,partner@example.com` (case doesn't matter) | no |
| `RESEND_API_KEY` | The `re_…` key from step 1.3 | yes |
| `EMAIL_FROM` | The sender from step 1.4, e.g. `Eat <eat@mail.example.com>` | no |

`DATABASE_URL` is already there from step 3. **Don't** set `EAT_CLOCK_NOW` (it's for tests and is ignored in production anyway).

You can also add them from the terminal after linking the project (step 5). The CLI prompts for each value, so secrets stay out of your shell history:

```sh
vercel env add BETTER_AUTH_SECRET production
```

Environment variables only reach **new** deployments, so you'll redeploy in step 6.

## 5. Link your checkout and create the Household

The database needs its tables and the single Household before anyone can sign in. Run these once, from the repository:

```sh
vercel link                                          # only if not already linked in step 2
vercel env run -e production -- npm run db:migrate   # create the tables in Neon
vercel env run -e production -- npm run db:seed      # create the Household
```

`vercel env run` runs the command with the project's production variables, without writing them to disk.

The seed creates the Household with these settings. You can change all of them later on the app's **Settings** page.

| Setting | Value |
| --- | --- |
| Start day | Saturday |
| Meal Count | 14 |
| Timezone | Europe/London |

The seed does nothing if the Household already exists, so running it twice is harmless.

> If either command says `DATABASE_URL is not set`, the CLI couldn't read the variable. One cause is a variable marked Sensitive, which the CLI can't read. Instead, copy the connection string from **Storage → eat → Quickstart** in Vercel (or from the Neon console) and run:
>
> ```sh
> DATABASE_URL='postgresql://…' npm run db:migrate
> DATABASE_URL='postgresql://…' npm run db:seed
> ```

## 6. Deploy

1. Trigger a production deployment, either way:
   - **If you created the project from the dashboard (2b):** open **Deployments**, then on the failed deployment choose **⋯ → Redeploy**.
   - **Any time, including 2a:** push a commit to `main`. With nothing to change, an empty commit works: `git commit --allow-empty -m "Deploy" && git push`.
2. In the build log, check for `Migrations applied.` before the Next.js build output.
3. When the deployment is **Ready**, open the production URL.

From now on, every push to `main` deploys to production and applies any new migrations first. Preview deployments (other branches) skip migrations. They have no database or secrets, so their pages don't work; that's expected. Use local development to try changes.

## 7. Check it works

1. Open the production URL. You're redirected to **Sign in to Eat**.
2. Enter an allow-listed email and click **Email me a sign-in link**. You see "Check your email".
3. The email "Sign in to Eat" arrives. Open the link within 5 minutes and you land on the current Meal Week. Resend's **Emails** page shows each send and its delivery status.
4. Sign out, then try an email that isn't on the allow list. You're told you can't sign in, and Resend shows no email sent.
5. On a second device or browser, sign in as another Member (path B only) and check you both see the same Meal Week.

Once all of that works, issue #12 is done.

## Changing things later

| To change | Do this |
| --- | --- |
| Who can sign in | Edit `ALLOWED_EMAILS`, then redeploy. Removing an email stops new sign-ins; that person's existing session lasts until it expires. |
| Start day, Meal Count, timezone | Use the app's **Settings** page; no deploy needed. |
| The schema | Run `npm run db:generate` locally, commit the new migration under `drizzle/`, and push. The production build applies it. |
| `BETTER_AUTH_SECRET` | Generate a new one, update it in Vercel and redeploy. Everyone is signed out. |

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Build fails with `DATABASE_URL is not set` | Neon isn't connected to the **Production** environment (step 3.4). |
| Build or pages fail with `RESEND_API_KEY is required in production` | Add `RESEND_API_KEY` for Production (step 4) and redeploy. |
| "Application error" after asking for a link; the Vercel function logs show `Resend refused the email (403)` | Path A can only send to the Resend account's own email. For path B: the domain isn't **Verified** yet, or `EMAIL_FROM` uses a different domain than the verified one, or the API key is restricted to another domain. |
| The email never arrives, but Resend shows it as delivered | Check spam. Add the DMARC record (step 1.2.5) and send from a subdomain. |
| The link opens the sign-in page with "That sign-in link didn't work" | The link expired (5 minutes) or was already used. Ask for a new one. |
| Sign-in fails when using a long `…-git-…vercel.app` or deployment URL | Always use the production domain in `BETTER_AUTH_URL`. Sign-in only accepts requests from that origin. |
| Error `No Household exists yet; run the seed` | Run the seed (step 5). |
| First page after a while is slow | Neon waking from scale-to-zero; normal on the free plan. |

## Free-tier limits worth knowing

- **Vercel Hobby** is for non-commercial, personal use only.
- **Resend Free:** 100 emails a day, 3,000 a month.
- **Neon Free:** a small database that scales to zero when idle. It is plenty for one Household's Meals, Dishes and Recipes.
