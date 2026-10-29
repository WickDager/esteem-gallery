# Esteem Gallery — Wear Your Vision

The official online storefront for **Esteem Gallery**, a streetwear brand from Harare, Zimbabwe. Customers browse **The Roots Collection** and the **Design Archive**, build a bag, and check out straight into WhatsApp with a pre-filled order containing a tracking reference, items, sizes and quantities.

## Tech stack

- **Vite + React + TypeScript** (single-page app)
- **Tailwind CSS v4**
- **Vercel serverless functions** in `api/` for order validation, reference generation and WhatsApp deep-link building
- Optional **Express** server (`server.ts`) for self-hosting

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev     # http://localhost:3000
```

The dev server exposes the same `/api/*` routes through a Vite plugin, so no separate backend is needed locally.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run the order and rate-limit unit tests |
| `npm run lint` | TypeScript typecheck (`tsc --noEmit`) |
| `npm start` | Serve the built app with the optional Express server |

## Configuration

Copy `.env.example` to `.env.local` for local development, and add the same variable in **Vercel → Project → Settings → Environment Variables** for production.

| Variable | Required | Description |
| --- | --- | --- |
| `WHATSAPP_PHONE_NUMBER` | No | WhatsApp number that receives orders. Defaults to `+263 788 554 277`. |

No database is used: orders are delivered to WhatsApp, so the chat thread is the order log.

## API routes

| Route | Method | Description |
| --- | --- | --- |
| `/api/health` | GET | Health check |
| `/api/config` | GET | Public store configuration (contact details, socials) |
| `/api/orders/prepare` | POST | Validates bag items, generates an `EG-XXXXXX` reference and returns a pre-filled `wa.me` checkout URL |

`POST /api/orders/prepare` is rate limited to 20 requests per minute per IP.

## Deployment

Hosted on **Vercel**. Import the repository, and Vercel builds the Vite frontend and deploys the `api/` directory as serverless functions using `vercel.json`. Set `WHATSAPP_PHONE_NUMBER` if you want orders sent to a different number.

### Self-hosting (optional)

```bash
npm run build
npm start       # PORT defaults to 3000
```

## Project structure

```
api/              Vercel serverless functions
public/           Images, fonts and video assets
src/
  components/     UI components (product, bag, dialogs)
  lib/            Catalog, order logic and rate limiter (+ tests)
  App.tsx         Page composition
server.ts         Optional Express server
vercel.json       Vercel build/rewrite/security-header config
```
