import { test, expect } from '@playwright/test';

interface PreparedOrder {
  success: boolean;
  reference: string;
  whatsappUrl: string;
  message: string;
  totalQuantity: number;
  status: string;
  items: Array<{
    id: string;
    name: string;
    title: string;
    size: string;
    quantity: number;
    color: string;
  }>;
}

test('adds a Roots tee to the bag and checks out on WhatsApp', async ({ page, context }) => {
  test.setTimeout(60_000);

  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  // Never contact the real WhatsApp site: fulfil the popup navigation locally.
  await context.route('https://wa.me/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>WhatsApp checkout stub</title></head><body>stub</body></html>',
    });
  });

  await page.goto('/');
  await expect(page).toHaveTitle(/Esteem Gallery/);
  await expect(page.locator('.loader')).toHaveCount(0, { timeout: 5_000 });

  // Open the signature Roots piece and verify its artwork actually renders.
  const washedBlackCard = page.getByRole('button', {
    name: 'View Washed Black Signature Distressed Tee',
  });
  await expect(washedBlackCard).toBeVisible();
  await washedBlackCard.click();

  const productDialog = page.getByRole('dialog', { name: 'Collection preview' });
  await expect(productDialog).toBeVisible();

  const productImage = productDialog.getByRole('img', {
    name: 'Washed Black Signature Distressed Tee',
  });
  await expect(productImage).toBeVisible();
  await expect
    .poll(() => productImage.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);

  await productDialog.getByRole('button', { name: 'M', exact: true }).click();
  await productDialog.getByRole('button', { name: /Add to bag/ }).click();
  await productDialog.getByRole('button', { name: /View bag & checkout/ }).click();

  const bag = page.getByRole('dialog', { name: 'Your bag' });
  await expect(bag).toBeVisible();
  await expect(bag.getByRole('heading', { name: /Your bag \(1\)/ })).toBeVisible();

  const popupPromise = page.waitForEvent('popup');
  const checkoutResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/orders/prepare') &&
      response.request().method() === 'POST'
  );

  await bag.getByRole('button', { name: /Checkout on WhatsApp/ }).click();

  const response = await checkoutResponse;
  expect(response.status()).toBe(200);

  const order = (await response.json()) as PreparedOrder;
  expect(order.success).toBe(true);
  expect(order.reference).toMatch(/^EG-[A-Z0-9]{6}$/);
  expect(order.totalQuantity).toBe(1);
  expect(order.status).toBe('pending');
  expect(order.items).toHaveLength(1);
  expect(order.items[0]).toMatchObject({
    id: 'washed-black',
    size: 'M',
    quantity: 1,
  });

  const popup = await popupPromise;
  await popup.waitForURL(/^https:\/\/wa\.me\//, { timeout: 15_000 });
  expect(popup.url()).toBe(order.whatsappUrl);

  const whatsappMessage = new URL(popup.url()).searchParams.get('text') ?? '';
  expect(whatsappMessage).toContain(order.reference);
  expect(whatsappMessage).toContain('*Washed Black*');
  expect(whatsappMessage).toContain('Size: *M*');
  expect(whatsappMessage).toContain('Qty: *1*');

  const note = bag.getByRole('note');
  await expect(note).toContainText('Request saved:');
  await expect(note).toContainText(order.reference);
  await expect(bag.getByRole('link', { name: /Open WhatsApp to send/ })).toHaveAttribute(
    'href',
    order.whatsappUrl
  );

  expect(pageErrors).toEqual([]);

  await popup.close();
});
