import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawn, type ChildProcess } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { LOOKBOOK_ITEMS, ROOTS_COLLECTION, STORE_INFO } from '../src/lib/catalog';

/**
 * HTTP smoke test for the deployed storefront contract.
 *
 * Boots the real Vite dev server (with the same /api routes Vercel exposes) on
 * a free port, checks the Roots Collection and lookbook artwork is served, and
 * completes a WhatsApp checkout request exactly like the bag dialog does.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STARTUP_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

let server: ChildProcess | undefined;
let baseUrl = '';
let serverLog = '';

function appendLog(chunk: Buffer | string) {
  serverLog = (serverLog + chunk.toString()).slice(-6_000);
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      if (!address || typeof address === 'string') {
        probe.close();
        reject(new Error('Could not allocate a port for the smoke test.'));
        return;
      }
      const { port } = address;
      probe.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForServer() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (!server || server.exitCode !== null) {
      throw new Error(`Vite exited before the smoke test could run.\n${serverLog}`);
    }
    try {
      const res = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (res.ok) return;
    } catch {
      // Server is still starting; poll again.
    }
    await delay(250);
  }

  throw new Error(`Timed out waiting for ${baseUrl}.\n${serverLog}`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;

  server.kill();
  for (let i = 0; i < 20 && server.exitCode === null; i += 1) {
    await delay(100);
  }
  if (server.exitCode === null) server.kill('SIGKILL');

  server.stdout?.destroy();
  server.stderr?.destroy();
}

before(async () => {
  const port = await getFreePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const viteBin = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');

  server = spawn(
    process.execPath,
    [viteBin, '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: ROOT,
      env: { ...process.env, DISABLE_HMR: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }
  );
  server.stdout?.on('data', appendLog);
  server.stderr?.on('data', appendLog);

  await waitForServer();
});

after(stopServer);

process.once('exit', () => {
  if (server && server.exitCode === null) server.kill();
});

function fetchApp(pathname: string, init?: RequestInit): Promise<Response> {
  return fetch(`${baseUrl}${pathname}`, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

async function assertWebp(pathname: string) {
  const res = await fetchApp(pathname);
  assert.equal(res.status, 200, `${pathname} should be served`);
  assert.match(
    res.headers.get('content-type') ?? '',
    /^image\/webp/,
    `${pathname} should be served as image/webp`
  );

  const bytes = Buffer.from(await res.arrayBuffer());
  assert.ok(bytes.length > 5_000, `${pathname} looks too small (${bytes.length} bytes)`);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIFF', `${pathname} is not a WebP (RIFF header)`);
  assert.equal(bytes.subarray(8, 12).toString('ascii'), 'WEBP', `${pathname} is not a WebP (WEBP header)`);

  return bytes;
}

test('storefront shell and health endpoint respond', async () => {
  const page = await fetchApp('/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type') ?? '', /^text\/html/);
  const html = await page.text();
  assert.match(html, /Esteem Gallery/);

  const health = await fetchApp('/api/health');
  assert.equal(health.status, 200);
  const healthBody = (await health.json()) as { status: string; store: string };
  assert.equal(healthBody.status, 'ok');
  assert.equal(healthBody.store, STORE_INFO.name);
});

test('serves crawlable SEO metadata, robots and sitemap', async () => {
  const robots = await fetchApp('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.headers.get('content-type') ?? '', /text\/plain/);
  const robotsBody = await robots.text();
  assert.match(robotsBody, /^User-agent: \*/m);
  assert.match(
    robotsBody,
    /Sitemap: https:\/\/esteem-gallery\.vercel\.app\/sitemap\.xml/,
    'robots.txt should point at the production sitemap'
  );

  const sitemap = await fetchApp('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get('content-type') ?? '', /xml/);
  const sitemapBody = await sitemap.text();
  assert.match(sitemapBody, /^<\?xml/);
  assert.ok(
    sitemapBody.includes('<loc>https://esteem-gallery.vercel.app/</loc>'),
    'sitemap should list the canonical homepage'
  );
  for (const product of ROOTS_COLLECTION) {
    assert.ok(
      sitemapBody.includes(`<image:loc>https://esteem-gallery.vercel.app/images/${product.id}.webp</image:loc>`),
      `sitemap should list the ${product.name} image`
    );
  }
  for (const item of LOOKBOOK_ITEMS) {
    assert.ok(
      sitemapBody.includes(
        `<image:loc>https://esteem-gallery.vercel.app/images/${item.image}-final.webp</image:loc>`
      ),
      `sitemap should list the ${item.title} lookbook image`
    );
  }

  const page = await fetchApp('/');
  const html = await page.text();
  assert.ok(
    html.includes('<title>Esteem Gallery | Streetwear &amp; Oversized Tees in Harare</title>'),
    'homepage should have the keyword-focused title'
  );
  assert.match(
    html,
    /rel="canonical" href="https:\/\/esteem-gallery\.vercel\.app\/"/,
    'homepage should declare the production canonical URL'
  );
  assert.match(
    html,
    /property="og:image"[\s\S]{0,80}content="https:\/\/esteem-gallery\.vercel\.app\/images\/og-cover\.jpg"/,
    'og:image should be an absolute URL'
  );

  const structuredData = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );
  assert.ok(structuredData, 'homepage should include JSON-LD');
  const graph = JSON.parse(structuredData[1]) as {
    '@graph': Array<{ '@type': string }>;
  };
  const types = graph['@graph'].map((node) => node['@type']);
  assert.ok(types.includes('ClothingStore'), 'JSON-LD should describe the store');
  assert.ok(types.includes('WebSite'), 'JSON-LD should describe the website');
  assert.ok(types.includes('ItemList'), 'JSON-LD should describe the Roots Collection');

  const ogImage = await fetchApp('/images/og-cover.jpg');
  assert.equal(ogImage.status, 200);
  assert.match(ogImage.headers.get('content-type') ?? '', /^image\/jpeg/);
  const ogBytes = Buffer.from(await ogImage.arrayBuffer());
  assert.ok(ogBytes.length > 10_000, 'social preview image looks too small');
  assert.equal(ogBytes[0], 0xff, 'social preview should be a JPEG');
  assert.equal(ogBytes[1], 0xd8, 'social preview should be a JPEG');
});

test('catalog still lists the five Roots colorways', () => {
  assert.equal(ROOTS_COLLECTION.length, 5);
});

for (const product of ROOTS_COLLECTION) {
  test(`serves the ${product.name} Roots image`, async () => {
    await assertWebp(`/images/${product.id}.webp`);
  });

  if (product.back) {
    test(`serves the ${product.name} back image`, async () => {
      await assertWebp(product.back!);
    });
  }
}

test('catalog still lists the four distinct lookbook images', () => {
  assert.equal(LOOKBOOK_ITEMS.length, 4);
  assert.equal(new Set(LOOKBOOK_ITEMS.map((item) => item.image)).size, 4);
});

for (const item of LOOKBOOK_ITEMS) {
  test(`serves the lookbook image for ${item.title}`, async () => {
    await assertWebp(`/images/${item.image}-final.webp`);
  });
}

test('completes a WhatsApp checkout with the selected Roots items', async () => {
  const res = await fetchApp('/api/orders/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { id: 'washed-black', size: 'M', quantity: 2 },
        { id: 'off-white', size: 'L', quantity: 1 },
      ],
    }),
  });

  assert.equal(res.status, 200);
  const order = (await res.json()) as {
    success: boolean;
    reference: string;
    whatsappUrl: string;
    message: string;
    totalQuantity: number;
    status: string;
    items: Array<{ id: string; size: string; quantity: number }>;
  };

  assert.equal(order.success, true);
  assert.match(order.reference, /^EG-[A-Z0-9]{6}$/);
  assert.equal(order.totalQuantity, 3);
  assert.equal(order.status, 'pending');
  assert.deepEqual(
    order.items.map(({ id, size, quantity }) => ({ id, size, quantity })),
    [
      { id: 'washed-black', size: 'M', quantity: 2 },
      { id: 'off-white', size: 'L', quantity: 1 },
    ]
  );

  const whatsapp = new URL(order.whatsappUrl);
  assert.equal(whatsapp.protocol, 'https:');
  assert.equal(whatsapp.hostname, 'wa.me');
  assert.equal(
    whatsapp.pathname,
    `/${STORE_INFO.phone.replace(/\D/g, '')}`,
    'checkout should target the configured store WhatsApp number'
  );

  const text = whatsapp.searchParams.get('text') ?? '';
  assert.ok(text.includes(order.reference), 'message should include the order reference');
  assert.ok(text.includes('Washed Black'), 'message should include the first colorway');
  assert.match(text, /Size: \*M\* \| Qty: \*2\*/, 'message should include size and quantity');
  assert.ok(text.includes('Off White'), 'message should include the second colorway');
  assert.equal(order.message, text, 'returned message should match the WhatsApp deep link');
});

test('rejects an unknown product instead of completing checkout', async () => {
  const res = await fetchApp('/api/orders/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ id: 'not-a-real-tee', size: 'M', quantity: 1 }],
    }),
  });

  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.match(body.error, /Unknown product ID/);
});
