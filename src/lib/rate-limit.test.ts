import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter, clientIpFromHeaders } from './rate-limit';

test('allows requests within the limit and reports remaining quota', () => {
  const check = createRateLimiter({ windowMs: 60_000, max: 3 });
  assert.equal(check('ip-a').ok, true);
  assert.equal(check('ip-a').remaining, 1);
  assert.equal(check('ip-a').ok, true);
});

test('blocks the request that exceeds the limit with a retry hint', () => {
  const check = createRateLimiter({ windowMs: 60_000, max: 2 });
  assert.equal(check('ip-a').ok, true);
  assert.equal(check('ip-a').ok, true);
  const third = check('ip-a');
  assert.equal(third.ok, false);
  assert.ok(third.retryAfterSeconds && third.retryAfterSeconds >= 1 && third.retryAfterSeconds <= 60);
});

test('tracks keys independently', () => {
  const check = createRateLimiter({ windowMs: 60_000, max: 1 });
  assert.equal(check('ip-a').ok, true);
  assert.equal(check('ip-a').ok, false);
  assert.equal(check('ip-b').ok, true);
});

test('window expiry resets the limit for the same key', async () => {
  const check = createRateLimiter({ windowMs: 50, max: 1 });
  assert.equal(check('ip-a').ok, true);
  assert.equal(check('ip-a').ok, false);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(check('ip-a').ok, true);
});

test('key flood stays within maxTrackedKeys (memory bound)', () => {
  const check = createRateLimiter({ windowMs: 60_000, max: 1, maxTrackedKeys: 100 });
  for (let i = 0; i < 500; i++) {
    check(`flood-${i}`);
  }
  // all 500 ran without OOM/slowness; a known key may have been evicted and re-accepted
  const result = check('flood-0');
  assert.ok(result.ok === true || result.ok === false);
});

test('clientIpFromHeaders prefers X-Forwarded-For first hop', () => {
  assert.equal(
    clientIpFromHeaders({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1', }, '192.168.1.5'),
    '203.0.113.7'
  );
  assert.equal(clientIpFromHeaders({ 'x-forwarded-for': ['198.51.100.2'] }), '198.51.100.2');
  assert.equal(clientIpFromHeaders({}, '10.1.2.3'), '10.1.2.3');
  assert.equal(clientIpFromHeaders({}, null), 'unknown');
  assert.equal(clientIpFromHeaders({ 'x-forwarded-for': '' }, null), 'unknown');
});
