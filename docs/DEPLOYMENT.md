# Deployment

The site deploys to Vercel as a standard Next.js project. Pages are statically generated; `/api/chat` runs as a Node.js serverless function with streaming.

## 1. Import the repository

1. Sign in at vercel.com with the GitHub account that owns `Sreevarshann/sree-portfolio`.
2. **Add New → Project → Import** `sree-portfolio`. Framework preset: Next.js (auto-detected). No build settings need changing.

Or from a terminal:

```bash
npx vercel login
npx vercel link
npx vercel deploy --prod
```

## 2. Environment variables

In **Project → Settings → Environment Variables** (Production and Preview):

| Name | Value |
| --- | --- |
| `ANTHROPIC_API_KEY` | key from console.anthropic.com (mark as Sensitive) |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-domain>` (used for canonical URLs, sitemap, Open Graph) |
| optional `ASK_SREE_*` | see [AI.md](AI.md) |

Redeploy after changing variables. Also set a monthly spend limit in the Anthropic Console.

## 3. Analytics

Enable **Web Analytics** and **Speed Insights** in the Vercel project (Analytics tab). The components are already in `src/app/layout.tsx`; they are cookie-free and collect no personal data.

## 4. Custom domain

1. Buy or use a domain you own (for example `sree.dev`).
2. Vercel → **Project → Settings → Domains → Add** `yourdomain.com` and `www.yourdomain.com`.
3. At your registrar, create the DNS records Vercel shows. Typically:
   - Apex `yourdomain.com`: `A` record → `76.76.21.21`
   - `www`: `CNAME` → `cname.vercel-dns.com`
   (Or switch nameservers to Vercel DNS.)
4. Choose which host redirects to the other (Vercel suggests `www` → apex or the reverse).
5. HTTPS certificates are issued automatically once DNS resolves.
6. Update `NEXT_PUBLIC_SITE_URL` and redeploy.

## 5. Verify the deployment

```bash
curl -sI https://yourdomain.com | grep -i -E "strict-transport|content-security"
curl -s https://yourdomain.com/api/chat            # {"ok":true,"model":"...","configured":true}
E2E_BASE_URL=https://yourdomain.com npx playwright test
```

The Playwright suite runs against any URL via `E2E_BASE_URL`. With a key configured, the "honest fallback" assertions in `interactions.spec.ts` expect search results, so run those against a preview without a key or skip them.
