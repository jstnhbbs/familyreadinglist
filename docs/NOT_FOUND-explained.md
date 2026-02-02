# Understanding Vercel’s NOT_FOUND Error

This doc explains **why** NOT_FOUND happens, how to fix it, and how to avoid it next time.

---

## 1. The fix (what to change)

Do these in order:

### A. Vercel project settings

1. **Dashboard → Your Project → Settings → General → Build & Development Settings**
2. **Root Directory:** Leave **empty** (your app is at the repo root).
3. **Output Directory:** Leave **empty**. Do **not** set `out`, `build`, `.next`, or anything else.  
   Next.js is not a static export by default; Vercel runs it as a serverless app. If Output Directory is set, Vercel looks for static files in that folder, finds nothing useful, and returns NOT_FOUND.
4. **Build Command:** `npm run build` (or leave default).
5. **Install Command:** `npm install` (or leave default).

### B. Environment variables

1. **Settings → Environment Variables**
2. For **Production** (and Preview if you use it), set:
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` = your Vercel URL, e.g. `https://your-project.vercel.app` (no trailing slash)
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
3. **Redeploy** after changing env vars (env vars are baked in at build/deploy time).

### C. Deployment and URL

1. **Deployments** tab: confirm the latest deployment status is **Ready** (not Failed/Canceled).
2. If the build **failed**, open that deployment and read the **Build Logs**. Fix the error and redeploy.
3. Open the **exact** URL from the deployment (e.g. the “Visit” link). Using an old or wrong URL can show NOT_FOUND.

### D. Node version (already in this repo)

`package.json` includes `"engines": { "node": ">=18" }` so Vercel uses Node 18+. Next.js 16 and Prisma expect a recent Node; an older default can cause build/runtime issues that surface as NOT_FOUND.

---

## 2. Root cause (what was going wrong)

### What the code is doing vs what it needs to do

- **What your app is:** A Next.js App Router app with:
  - One page at `/` (`src/app/page.tsx`)
  - API routes under `/api/...`
  - No `output: 'export'` (so it’s **dynamic**, not a static file tree)

- **What Vercel needs to do:** For each request, Vercel must:
  1. Resolve the request to a **deployment**
  2. Within that deployment, resolve the path to a **route** (page, API, or asset)
  3. Run the right serverless function or serve the right file

**NOT_FOUND** means “at least one of those steps failed: I couldn’t find a resource to serve for this request.”

### What usually triggers NOT_FOUND for this app

1. **Output Directory set**  
   Vercel is told “serve static files from `out` (or `build`, etc.).” Next.js didn’t produce that folder (you’re not using static export), so there’s no `index.html` or route tree. Result: every request → NOT_FOUND.

2. **Build failed**  
   No valid deployment. The “deployment” URL exists but there’s no built app behind it → NOT_FOUND (or error page).

3. **Wrong Root Directory**  
   If the app lives at repo root but Root Directory is set to a subfolder (or the opposite), Vercel builds the wrong thing or looks in the wrong place → NOT_FOUND.

4. **Wrong or old URL**  
   You’re opening a URL that doesn’t match any deployment (typo, old preview, different project) → NOT_FOUND.

### Misconception / oversight

- **Misconception:** “I set Output Directory to `out` or `build` so Vercel knows where my app is.”  
  For a **non-exported** Next.js app, there is no single “output folder” to serve. The app is a **runtime**: Vercel runs `next build`, then invokes serverless functions and serves assets from `.next` and the framework. Telling Vercel to “serve from `out`” is wrong and causes NOT_FOUND.

- **Oversight:** Not checking deployment status and build logs. A failed build still produces a deployment URL; visiting it often shows NOT_FOUND or a generic error.

---

## 3. Underlying concept

### Why NOT_FOUND exists

- **HTTP 404 / NOT_FOUND** means: “The server understood the request, but there is no resource at that URL.”  
- Vercel uses it when **it** can’t find a resource: wrong project, wrong deployment, or no matching route/asset in the built app.

So NOT_FOUND is there to:

- Tell the client “this URL doesn’t exist here”
- Avoid serving the wrong app or random files
- Separate “route not found” from “server error” (5xx)

### Mental model: request → resource

1. **Request** → Vercel (edge).
2. Vercel picks **project** and **deployment** (e.g. latest production).
3. For that deployment, Vercel matches the path to:
   - A **Next.js page** (e.g. `/` → `src/app/page.tsx`)
   - An **API route** (e.g. `/api/books` → `src/app/api/books/route.ts`)
   - A **static file** (e.g. from `public/` or `.next/static/`)
4. If nothing matches → **NOT_FOUND**.

So NOT_FOUND = “no matching resource in this deployment for this URL.”

### How this fits framework design

- **Next.js** can run in two modes on Vercel:
  - **Serverless (default):** Build produces `.next` + serverless functions. Vercel **runs** the app; it doesn’t “serve an output folder.”
  - **Static export (`output: 'export'`):** Build produces a tree of HTML/JS/CSS. Then you **do** have an output folder (e.g. `out`), and you could point Vercel at it—but your app uses API routes and server features, so it’s not in this mode.

- **Vercel** assumes “Next.js = serverless” unless you override something. Overriding **Output Directory** is for static sites or other generators; for a normal Next.js app it breaks the match between “request path” and “Next.js route” and leads to NOT_FOUND.

---

## 4. Warning signs and similar mistakes

### What to watch for

- **Output Directory** set for a Next.js app that uses API routes or server features → high chance of NOT_FOUND.
- **Root Directory** set to the wrong folder (or left set from another project) → wrong app built, NOT_FOUND.
- **Build failing** but not checking logs → deployment exists but is broken → NOT_FOUND or error page.
- **Assuming** “it works locally so it’s the same on Vercel” → env vars, Node version, or project settings can differ and cause NOT_FOUND.

### Similar mistakes

- Using **Rewrites** in `vercel.json` to send `/` to a file that doesn’t exist in the build.
- Setting **Framework Preset** to something other than Next.js (e.g. Other) so Vercel doesn’t run the Next.js runtime.
- Deploying a **branch** that doesn’t have the app (e.g. empty branch or wrong root) and opening that deployment’s URL.

### Code smells / patterns

- In **Vercel**: “Output Directory” or “Root Directory” set when you’re not sure why.
- In **Next.js**: Adding `output: 'export'` while still using API routes or server-only code (will break or 404).
- **Docs**: “Deploy to Vercel” instructions that tell you to set Output Directory for a normal Next.js app (outdated or for static export only).

---

## 5. Alternatives and trade-offs

### Option A: Fix project settings (recommended)

- **What:** Leave Output Directory and Root Directory empty, fix env vars, ensure build passes.
- **Trade-off:** No code change; works with your current App Router + API + Turso setup.
- **When:** This is the right approach for your app.

### Option B: Static export (not for this app)

- **What:** Set `output: 'export'` in `next.config.ts` and build; deploy the generated `out` folder; set Vercel Output Directory to `out`.
- **Trade-off:** No server, no API routes, no NextAuth, no DB. You’d have to move auth and data to an external backend and call it from the client.
- **When:** Only for fully static marketing sites or similar. **Not** for Family Reading List.

### Option C: Other hosts (Railway, Render, etc.)

- **What:** Deploy the same repo to a host that runs Node and supports Next.js (e.g. Railway, Render).
- **Trade-off:** Different config and env setup; same “don’t set Output Directory” idea if they have a similar setting.
- **When:** If you prefer another platform; the **concept** (request → resource, no wrong output dir) stays the same.

### Option D: Debug with Vercel CLI

- **What:** Run `vercel` locally, inspect the generated output and deployment.
- **Trade-off:** More insight into what Vercel is building and deploying; doesn’t by itself fix a wrong Output Directory.
- **When:** When project settings look correct but you still get NOT_FOUND.

---

## Summary

| Cause | Fix |
|-------|-----|
| Output Directory set | Leave it **empty** in Vercel project settings |
| Build failed | Check Build Logs, fix error, redeploy |
| Wrong Root Directory | Set to app root (empty if app is repo root) |
| Missing / wrong env vars | Set NEXTAUTH_* and TURSO_*, then redeploy |
| Wrong or old URL | Use the deployment’s “Visit” URL |

NOT_FOUND = “Vercel could not find a resource for this URL.” For your app, that’s almost always **project settings** (Output/Root Directory) or a **failed build**; fixing those and redeploying resolves it.
