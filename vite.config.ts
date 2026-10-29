import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { prepareOrder } from './src/lib/order.ts';
import { STORE_INFO } from './src/lib/catalog.ts';
import { createRateLimiter } from './src/lib/rate-limit.ts';

// Abuse guard, same policy as the Vercel function: 20 preparations/min per IP.
const checkOrderRateLimit = createRateLimiter({ windowMs: 60_000, max: 20 });

function apiPlugin(): Plugin {
  return {
    name: 'api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        let body: any = {};
        if (req.method === 'POST' || req.method === 'PATCH') {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const raw = Buffer.concat(buffers).toString('utf-8');
          try {
            if (raw) body = JSON.parse(raw);
          } catch {
            body = {};
          }
        }

        res.setHeader('Content-Type', 'application/json');

        if (req.url === '/api/health') {
          res.end(
            JSON.stringify({
              status: 'ok',
              store: STORE_INFO.name,
              timestamp: new Date().toISOString(),
            })
          );
          return;
        }

        if (req.url === '/api/config') {
          res.end(
            JSON.stringify({
              name: STORE_INFO.name,
              phone: STORE_INFO.phone,
              phoneFormatted: STORE_INFO.phoneFormatted,
              whatsappUrl: STORE_INFO.whatsappUrl,
              location: STORE_INFO.location,
            })
          );
          return;
        }

        if (req.url === '/api/orders/prepare' && req.method === 'POST') {
          const limiter = checkOrderRateLimit(req.socket?.remoteAddress ?? 'unknown');
          if (!limiter.ok) {
            res.statusCode = 429;
            res.setHeader('Retry-After', String(limiter.retryAfterSeconds ?? 60));
            res.end(
              JSON.stringify({ error: 'Too many order requests. Please try again shortly.' })
            );
            return;
          }
          try {
            const { items, notes, phone } = body || {};
            const order = prepareOrder({ items, notes, phone });
            res.end(
              JSON.stringify({
                success: true,
                reference: order.reference,
                whatsappUrl: order.whatsappUrl,
                message: order.message,
                items: order.items,
                totalQuantity: order.totalQuantity,
                createdAt: order.createdAt,
                status: order.status,
              })
            );
            return;
          } catch (err: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: err.message || 'Invalid order request' }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      allowedHosts: true as const,
      host: '0.0.0.0',
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
