import type { IncomingMessage, ServerResponse } from 'node:http';
import { STORE_INFO } from '../src/lib/catalog';

export default function handler(_req: IncomingMessage, res: ServerResponse): void {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      store: STORE_INFO.name,
      version: '1.0.0',
    })
  );
}
