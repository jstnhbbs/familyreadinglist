# Family Reading List

A small Next.js app for a group of 8–10 people to share books they've read or want to read, and view the list by genre.

## Features

- **Sign in / register** – Each person has an account (email + password). You must be signed in to add books and to add your own ratings and notes.
- **Add books** – Title, author, genre, status (read / want to read). Your name is taken from your account.
- **Your ratings and notes** – For each book you can give a 1–5 star rating and optional notes. Everyone sees their own review and everyone else’s.
- **View by genre** – Filter the list with the genre dropdown.
- **Shared list** – See who added each book and read the group’s ratings and notes.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`). For local dev, the example values are fine.

3. Create the database (SQLite) and run migrations:

   ```bash
   npm run db:push
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and register an account to get started.

## Tech stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **NextAuth.js** (credentials + JWT) for sign-in
- **Prisma** with **SQLite** for persistence (no separate database server needed)

## Hosting the database with Turso

By default the app uses a local SQLite file (`prisma/dev.db`). To use [Turso](https://turso.tech) (hosted libSQL) instead:

1. **Create a Turso account and database**
   - Install the [Turso CLI](https://docs.turso.tech/cli/installation).
   - Log in: `turso auth login`
   - Create a database: `turso db create familyreadinglist --region <region>`
   - Get the URL and token:
     - `turso db show familyreadinglist --url`
     - `turso db tokens create familyreadinglist`

2. **Configure the app**
   - In `.env`, set:
     - `TURSO_DATABASE_URL` – the database URL (e.g. `libsql://familyreadinglist-username.turso.io`)
     - `TURSO_AUTH_TOKEN` – the token from step 1  
   - Leave `DATABASE_URL` as-is (it’s still used for local `db:push`).

3. **Push the schema to Turso**
   - Run: `npm run db:push:turso`  
   - This creates the tables in your Turso database.

4. **Run the app**
   - Start the app as usual (`npm run dev` or `npm run start`).  
   - If both `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set, the app will use Turso; otherwise it uses the local SQLite file.

## Deploy

This app needs a **server** (API routes, NextAuth, database), so it **cannot run on GitHub Pages** (static only). Deploy to **[Vercel](https://vercel.com)** instead: connect your GitHub repo, add env vars (Turso + NextAuth), and Vercel will build and deploy on every push. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step instructions.

## Scripts

- `npm run dev` – Start development server
- `npm run build` – Generate Prisma client and build for production
- `npm run start` – Start production server
- `npm run db:push` – Push Prisma schema to the **local** SQLite database (creates/updates tables)
- `npm run db:push:turso` – Push Prisma schema to your **Turso** database (use after setting Turso env vars)
