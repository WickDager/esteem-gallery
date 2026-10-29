import type { IncomingMessage, ServerResponse } from 'node:http';
import { prepareOrder } from '../../src/lib/order';
import { createRateLimiter, clientIpFromHeaders } from '../../src/lib/rate-limit';

/** Abuse guard: max 20 order preparations per minute per IP, per instance. */
const checkRateLimit = createRateLimiter({ windowMs: 60_000, max: 20 });

/**
 * Vercel serverless function: POST /api/orders/prepare
 * Validates the bag contents, generates an order reference and returns the
 * pre-filled WhatsApp checkout URL (same logic as the Vite dev plugin).
 */
export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const limiter = checkRateLimit(
    clientIpFromHeaders(req.headers, req.socket?.remoteAddress ?? null)
  );
  if (!limiter.ok) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Retry-After', String(limiter.retryAfterSeconds ?? 60));
    res.end(
      JSON.stringify({ error: 'Too many order requests. Please try again shortly.' })
    );
    return;
  }

  let raw = '';

  req.on('data', (chunk: Buffer | string) => {
    raw += typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
    // DoS guard: reject oversized payloads (expected body is well under 10 KB)
    if (raw.length > 10_000) {
      raw = '';
      res.statusCode = 413;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Request body too large.' }));
      req.destroy();
    }
  });

  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');

    let body: { items?: unknown; notes?: string } = {};
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = {};
      }
    }

    try {
      const order = prepareOrder({
        items: body?.items,
        notes: typeof body?.notes === 'string' ? body.notes.slice(0, 500) : undefined,
        // Security: never trust a client-supplied phone number — the checkout
        // target must always come from the server (env override or catalog).
        phone: process.env.WHATSAPP_PHONE_NUMBER || undefined,
      });
      res.statusCode = 200;
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
    } catch (err: any) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: err.message || 'Invalid order request' }));
    }
  });
}
