import type { IncomingMessage, ServerResponse } from 'node:http';
import { STORE_INFO } from '../src/lib/catalog';

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      name: STORE_INFO.name,
      phone: STORE_INFO.phone,
      phoneFormatted: STORE_INFO.phoneFormatted,
      whatsappUrl: STORE_INFO.whatsappUrl,
      instagram: STORE_INFO.instagram,
      tiktok: STORE_INFO.tiktok,
      location: STORE_INFO.location,
    })
  );
}
