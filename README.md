# PantryPulse — private hosted app (Curious Inc only)

This wraps the PantryPulse HTML behind **Google login**, allowing **only `@curiousinc.com`** accounts.
Anyone else — even with the URL — is bounced to the login page and cannot load the app.

## How it works (30-second version)
- The PantryPulse HTML lives in `private/pantrypulse.html` — **outside** `public/`, so it is never directly downloadable.
- The only way to see it is `/api/app`, which first checks you have a valid `@curiousinc.com` session.
- Login is Google OAuth via NextAuth. The domain check is enforced **server-side** (can't be bypassed from the browser).

---

## ONE-TIME SETUP

### 1. Create Google OAuth credentials
1. Go to https://console.cloud.google.com/ → create a project (or reuse one).
2. **APIs & Services → OAuth consent screen**:
   - User type: **Internal** (this alone already limits to your Google Workspace — do this if curiousinc.com is a Google Workspace domain).
   - Fill app name (e.g. "PantryPulse"), support email, save.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins:** `https://YOUR-PROJECT.vercel.app`
   - **Authorized redirect URIs:** `https://YOUR-PROJECT.vercel.app/api/auth/callback/google`
   - Create → copy the **Client ID** and **Client secret**.

> You won't know the exact `YOUR-PROJECT.vercel.app` URL until after the first Vercel deploy.
> Easiest order: deploy once (step 3), copy the URL Vercel gives you, then come back and fill these two fields.

### 2. Generate an auth secret
Run locally: `openssl rand -base64 32` → copy the output (used as `NEXTAUTH_SECRET`).

### 3. Deploy to Vercel
1. Push this whole folder to your Git repo.
2. Vercel → **Add New → Project** → import the repo.
   - Framework preset: **Next.js** (auto-detected).
   - Build command / output: **leave default**.
3. Before (or right after) deploy, add **Environment Variables** in Vercel → Settings → Environment Variables:
   | Name | Value |
   |------|-------|
   | `GOOGLE_CLIENT_ID` | (from step 1) |
   | `GOOGLE_CLIENT_SECRET` | (from step 1) |
   | `NEXTAUTH_SECRET` | (from step 2) |
   | `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` |
4. Deploy. Copy the final URL, and make sure it matches the redirect URIs in step 1 and `NEXTAUTH_URL`.
5. **Redeploy** once after setting env vars (Vercel → Deployments → ⋯ → Redeploy) so they take effect.

### 4. Share with your team
Send them `https://YOUR-PROJECT.vercel.app`. They click "Sign in with Google", pick their
`@curiousinc.com` account, and they're in. Non-curiousinc accounts get a clear "not permitted" message.

---

## UPDATING THE APP (your regular workflow — unchanged)
When you rebuild the PantryPulse HTML (new build tag, re-embedded workbook):
1. Replace `private/pantrypulse.html` with the new file (keep the same name).
2. Commit + push. Vercel auto-redeploys in ~1 minute.
3. Team hard-refreshes — they see the new build.

Nothing about how you edit the model changes. This project only *publishes* the current HTML behind login.

---

## Files
- `pages/api/auth/[...nextauth].js` — Google provider + `@curiousinc.com` gate
- `pages/api/app.js` — serves the private HTML only to valid sessions
- `pages/index.js` — root: redirects to app (if logged in) or login
- `pages/login.js` — the Google sign-in page
- `private/pantrypulse.html` — the app itself (not publicly reachable)
