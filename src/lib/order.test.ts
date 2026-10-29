import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateOrderReference,
  validateAndCleanItems,
  formatOrderWhatsAppMessage,
  buildWhatsAppUrl,
  prepareOrder,
} from './order';

test('generateOrderReference returns valid EG- prefixed string', () => {
  const ref = generateOrderReference();
  assert.match(ref, /^EG-[A-Z0-9]{6}$/);
});

test('validateAndCleanItems rejects non-array and empty items', () => {
  assert.throws(() => validateAndCleanItems(null), /Items must be an array/);
  assert.throws(() => validateAndCleanItems([]), /Your bag is empty/);
});

test('validateAndCleanItems rejects invalid products and sizes', () => {
  assert.throws(
    () => validateAndCleanItems([{ id: 'nonexistent-tee', size: 'M', quantity: 1 }]),
    /Unknown product ID/
  );
  assert.throws(
    () => validateAndCleanItems([{ id: 'washed-black', size: 'XXXL', quantity: 1 }]),
    /Invalid size/
  );
  assert.throws(
    () => validateAndCleanItems([{ id: 'washed-black', size: 'M', quantity: 0 }]),
    /Quantity must be an integer between 1 and 99/
  );
});

test('validateAndCleanItems aggregates identical items and cleans quantities', () => {
  const raw = [
    { id: 'washed-black', size: 'M', quantity: 1 },
    { id: 'washed-black', size: 'M', quantity: 2 },
    { id: 'sza-portrait', size: 'L', quantity: 1 },
  ];
  const cleaned = validateAndCleanItems(raw);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].id, 'washed-black');
  assert.equal(cleaned[0].quantity, 3);
  assert.equal(cleaned[1].id, 'sza-portrait');
  assert.equal(cleaned[1].quantity, 1);
});

test('buildWhatsAppUrl constructs wa.me url properly encoded', () => {
  const url = buildWhatsAppUrl('+263 788 554 277', 'Hello Esteem Gallery & Team!');
  assert.ok(url.startsWith('https://wa.me/263788554277?text='));
  assert.ok(url.includes('Hello%20Esteem%20Gallery%20%26%20Team!'));
});

test('prepareOrder builds complete order with message and reference', () => {
  const order = prepareOrder({
    items: [
      { id: 'washed-black', size: 'XL', quantity: 2 },
      { id: 'olive-green', size: 'M', quantity: 1 },
    ],
    notes: 'Please let me know if pickup in Harare CBD is possible.',
  });

  assert.ok(order.reference.startsWith('EG-'));
  assert.equal(order.totalQuantity, 3);
  assert.equal(order.items.length, 2);
  assert.ok(order.message.includes(order.reference));
  assert.ok(order.message.includes('Washed Black'));
  assert.ok(order.message.includes('Size: *XL* | Qty: *2*'));
  assert.ok(order.message.includes('Harare CBD'));
  assert.ok(order.whatsappUrl.includes(encodeURIComponent(order.reference)));
});
