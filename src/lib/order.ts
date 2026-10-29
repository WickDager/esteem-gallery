import { findProductById, STORE_INFO, AVAILABLE_SIZES, type BagItem, type ShirtSize } from './catalog';

export interface PreparedOrderItem {
  id: string;
  name: string;
  title: string;
  size: ShirtSize;
  quantity: number;
  color: string;
}

export interface PreparedOrder {
  reference: string;
  items: PreparedOrderItem[];
  totalQuantity: number;
  message: string;
  whatsappUrl: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'fulfilled' | 'cancelled';
  customerNotes?: string;
}

/**
 * Generate a unique Esteem Gallery order reference: EG-XXXXXX (6 alphanumeric chars)
 */
export function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * chars.length);
    code += chars[idx];
  }
  return `EG-${code}`;
}

/**
 * Validate and clean bag items from user input
 */
export function validateAndCleanItems(rawItems: unknown): BagItem[] {
  if (!Array.isArray(rawItems)) {
    throw new Error('Items must be an array.');
  }

  if (rawItems.length === 0) {
    throw new Error('Your bag is empty.');
  }

  if (rawItems.length > 50) {
    throw new Error('That is a lot of items. Please contact us directly for bulk orders.');
  }

  const cleaned: BagItem[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== 'object') {
      throw new Error('Invalid item entry.');
    }
    const { id, size, quantity } = item as Record<string, unknown>;

    if (typeof id !== 'string' || !findProductById(id)) {
      throw new Error(`Unknown product ID: "${id}".`);
    }

    if (typeof size !== 'string' || !AVAILABLE_SIZES.includes(size as ShirtSize)) {
      throw new Error(`Invalid size: "${size}". Must be one of S, M, L, XL, XXL.`);
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error(`Quantity must be an integer between 1 and 99.`);
    }

    // Combine identical product + size
    const existing = cleaned.find((c) => c.id === id && c.size === size);
    if (existing) {
      existing.quantity = Math.min(99, existing.quantity + qty);
    } else {
      cleaned.push({ id, size: size as ShirtSize, quantity: qty });
    }
  }

  return cleaned;
}

/**
 * Build WhatsApp order text message formatted with bold headers, items list, and order reference
 */
export function formatOrderWhatsAppMessage(params: {
  reference: string;
  items: PreparedOrderItem[];
  totalQuantity: number;
  notes?: string;
}): string {
  const { reference, items, totalQuantity, notes } = params;

  const lines: string[] = [
    `*NEW ORDER REQUEST — ${STORE_INFO.name.toUpperCase()}*`,
    `Ref: *${reference}*`,
    `Location: ${STORE_INFO.location}`,
    '',
    `*Requested Items (${totalQuantity} total):*`,
  ];

  items.forEach((item, idx) => {
    lines.push(`${idx + 1}. *${item.name}* (${item.title})`);
    lines.push(`   Size: *${item.size}* | Qty: *${item.quantity}*`);
  });

  lines.push('');
  lines.push('*Status:* Price & availability confirmation requested');

  if (notes && notes.trim().length > 0) {
    /**
     * Security: strip control characters (null bytes, newlines are kept for
     * readability) so customer notes cannot inject fake lines, fake totals or
     * copy-paste payloads into the WhatsApp message the merchant reads.
     * wa.me itself also rejects messages beyond ~4096 chars, so trim notes.
     */
    const safeNotes = notes
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .trim()
      .slice(0, 500);
    if (safeNotes) {
      lines.push(`*Customer Note:* ${safeNotes}`);
    }
  }

  lines.push('');
  lines.push('Hi Esteem Gallery team, I would like to confirm availability, pricing, and delivery/collection options for this order. Thank you!');

  return lines.join('\n');
}

/**
 * Build wa.me direct URL with pre-filled text
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Pure function to prepare an order from validated bag items
 */
export function prepareOrder(options: {
  items: unknown;
  notes?: string;
  phone?: string;
  customReference?: string;
}): PreparedOrder {
  const cleaned = validateAndCleanItems(options.items);
  const reference = options.customReference || generateOrderReference();
  const phone = options.phone || STORE_INFO.phone;

  const preparedItems: PreparedOrderItem[] = cleaned.map((c) => {
    const product = findProductById(c.id)!;
    return {
      id: c.id,
      name: product.name,
      title: product.title,
      size: c.size,
      quantity: c.quantity,
      color: product.color,
    };
  });

  const totalQuantity = preparedItems.reduce((acc, item) => acc + item.quantity, 0);

  const message = formatOrderWhatsAppMessage({
    reference,
    items: preparedItems,
    totalQuantity,
    notes: options.notes,
  });

  const whatsappUrl = buildWhatsAppUrl(phone, message);

  return {
    reference,
    items: preparedItems,
    totalQuantity,
    message,
    whatsappUrl,
    createdAt: new Date().toISOString(),
    status: 'pending',
    customerNotes: options.notes,
  };
}
