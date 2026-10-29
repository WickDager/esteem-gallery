import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { prepareOrder } from './src/lib/order';
import { STORE_INFO } from './src/lib/catalog';
import { createRateLimiter, clientIpFromHeaders } from './src/lib/rate-limit';

// Abuse guard, same policy as the serverless function: 20 preparations/min per IP.
const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 20 });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static(path.resolve(__dirname, 'dist')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    store: STORE_INFO.name,
    version: '1.0.0',
  });
});

app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    name: STORE_INFO.name,
    phone: STORE_INFO.phone,
    phoneFormatted: STORE_INFO.phoneFormatted,
    whatsappUrl: STORE_INFO.whatsappUrl,
    instagram: STORE_INFO.instagram,
    tiktok: STORE_INFO.tiktok,
    location: STORE_INFO.location,
  });
});

app.post('/api/orders/prepare', (req: Request, res: Response) => {
  const limiter = checkRateLimit(
    clientIpFromHeaders(req.headers, req.socket?.remoteAddress ?? null)
  );
  if (!limiter.ok) {
    res.status(429).set('Retry-After', String(limiter.retryAfterSeconds ?? 60));
    res.json({ error: 'Too many order requests. Please try again shortly.' });
    return;
  }
  try {
    const { items, notes, phone } = req.body || {};
    const order = prepareOrder({ items, notes, phone });
    res.json({
      success: true,
      reference: order.reference,
      whatsappUrl: order.whatsappUrl,
      message: order.message,
      items: order.items,
      totalQuantity: order.totalQuantity,
      createdAt: order.createdAt,
      status: order.status,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to prepare order.' });
  }
});

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Esteem Gallery server running on http://0.0.0.0:${PORT}`);
});
