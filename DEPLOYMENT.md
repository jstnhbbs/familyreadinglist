# Deploying Family Reading List

## Why not GitHub Pages?

**GitHub Pages only serves static files** (HTML, CSS, JavaScript). It does not run a server.

This app needs:

- **API routes** – sign-in, register, books, reviews
- **NextAuth** – server-side sessions
- **A database** – Turso or SQLite (via Prisma)

So the app **cannot run on GitHub Pages**. You need a host that runs Node.js and supports serverless/API routes.

## Recommended: Deploy to Vercel (free)

[Vercel](https://vercel.com) runs Next.js with API routes and works well with Turso. You can connect your GitHub repo and get automatic deploys on every push.

### 1. Use Turso for the database

Vercel’s serverless environment doesn’t keep a local SQLite file, so use **Turso** in production:

1. Create a Turso database and get **URL** and **auth token** (see [Hosting the database with Turso](./README.md#hosting-the-database-with-turso) in the README).
2. Run the schema once against Turso:  
   `npm run db:push:turso`  
   (with `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in your `.env`)

### 2. Deploy on Vercel

1. Push your repo to **GitHub** (if you haven’t already).
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **Add New…** → **Project** and **import** your `familyreadinglist` repo.
4. Leave **Build Command** as `npm run build` and **Output Directory** as default.
5. Add **Environment Variables** in the Vercel project settings:

   | Name                 | Value                                      |
   | -------------------- | ------------------------------------------ |
   | `NEXTAUTH_SECRET`    | A long random string (e.g. `openssl rand -base64 32`) |
   | `NEXTAUTH_URL`       | Your app URL, e.g. `https://your-project.vercel.app` |
   | `TURSO_DATABASE_URL` | Your Turso database URL                    |
   | `TURSO_AUTH_TOKEN`   | Your Turso auth token                     |

6. Click **Deploy**. Vercel will build and deploy; later deploys happen automatically when you push to the connected branch (usually `main`).

### 3. After the first deploy

- Open your Vercel URL (e.g. `https://familyreadinglist.vercel.app`).
- In **Project Settings → Domains**, you can add a custom domain if you want.
- To change env vars or Turso credentials, update them in Vercel and redeploy.

---

## Troubleshooting: 404 on Vercel

If you see **404: not_found** (or a blank 404 page):

1. **Check the deployment**
   - In the Vercel dashboard, open your project → **Deployments**. Open the latest deployment.
   - If the status is **Failed** or **Error**, the app never deployed. Open the deployment and read the **Build Logs** to fix the error, then redeploy.

2. **Leave Output Directory empty**
   - **Project Settings → General → Build & Development Settings**
   - **Output Directory** must be **empty** (or the default). Do **not** set it to `out`, `build`, or `.next`. Next.js uses its own output; setting this wrong causes 404s.

3. **Root Directory**
   - If your app lives at the **root** of the repo, **Root Directory** should be **empty**.
   - If the app is in a subfolder (e.g. `apps/web`), set **Root Directory** to that folder.

4. **Build command**
   - Use **Build Command**: `npm run build` (or leave default so Vercel uses the repo’s `package.json`).

5. **Environment variables**
   - In **Project Settings → Environment Variables**, set **Production** (and Preview if you want):
     - `NEXTAUTH_SECRET` – long random string
     - `NEXTAUTH_URL` – **exactly** your Vercel URL, e.g. `https://your-project.vercel.app` (no trailing slash)
     - `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` – from Turso
   - Redeploy after changing env vars.

6. **Use the deployment URL**
   - Open the URL from the deployment (e.g. `https://familyreadinglist-xxx.vercel.app`). A wrong or old URL can show 404.

After changing any of the above, trigger a new deploy (push a commit or **Redeploy** in the Vercel dashboard).

---

**Summary:** Use **GitHub** for code and **Vercel** for hosting. Push to GitHub → Vercel builds and deploys. The app runs on Vercel with Turso as the database; GitHub Pages is not used for this app.
