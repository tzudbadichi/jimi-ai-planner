# Deployment Runbook (Vercel + Postgres)

## 1. Prepare a managed Postgres database
1. Create a DB in Neon or Supabase.
2. Copy the `DATABASE_URL` connection string (pooled URL with SSL).

## 2. Configure environment variables
Set these in Vercel Project Settings -> Environment Variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_API_KEY`

Generate a strong auth secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Connect repository to Vercel
1. Import this GitHub repo into Vercel.
2. Framework preset: Next.js.
3. Build command: `npm run build`
4. Install command: `npm install`

`postinstall` already runs `prisma generate`.

## 4. Apply schema to production DB
After first deploy, run once locally against the production `DATABASE_URL`:
```bash
npm run db:push
```

## 5. Verify production
1. Open `/login`.
2. Sign in with Google.
3. Verify that dashboard data is private per user.
4. Verify `Reset All` clears only current user's data.

## 6. Connect custom domain
1. Add domain in Vercel Project -> Domains.
2. Update DNS records at registrar (A/CNAME as Vercel shows).
3. Wait for SSL issuance (automatic).
