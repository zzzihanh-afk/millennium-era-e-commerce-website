import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  parsePriceToPaisa,
  calcDiscountPercent,
  getStockInfo,
  generateSlug,
  generateIdempotencyKey,
} from '../src/lib/utils';

describe('Financial & Pricing Calculations (Paisa to BDT)', () => {
  it('formats paisa integer values to BDT display string correctly', () => {
    // 499900 paisa = ৳4,999.00
    expect(formatPrice(499900)).toBe('৳4,999.00');
    // 1000 paisa = ৳10.00
    expect(formatPrice(1000)).toBe('৳10.00');
    // 0 paisa = ৳0.00
    expect(formatPrice(0)).toBe('৳0.00');
    // Without decimals
    expect(formatPrice(499900, { showDecimals: false })).toBe('৳4,999');
    // Without symbol
    expect(formatPrice(499900, { showSymbol: false })).toBe('4,999.00');
  });

  it('parses BDT display string back to integer paisa without precision loss', () => {
    expect(parsePriceToPaisa('৳4,999.00')).toBe(499900);
    expect(parsePriceToPaisa('4999')).toBe(499900);
    expect(parsePriceToPaisa('৳10.50')).toBe(1050);
  });

  it('calculates accurate discount percentages', () => {
    // 5000 regular, 4000 sale = 20% discount
    expect(calcDiscountPercent(500000, 400000)).toBe(20);
    // 1000 regular, 850 sale = 15% discount
    expect(calcDiscountPercent(100000, 85000)).toBe(15);
    // Sale price >= regular price = 0%
    expect(calcDiscountPercent(100000, 100000)).toBe(0);
    expect(calcDiscountPercent(100000, 120000)).toBe(0);
  });
});

describe('Stock Info and Status', () => {
  it('returns out_of_stock for 0 or negative quantities', () => {
    const info = getStockInfo(0);
    expect(info.status).toBe('out_of_stock');
    expect(info.label).toBe('Out of Stock');
  });

  it('returns low_stock when quantity is below threshold', () => {
    const info = getStockInfo(3, 5);
    expect(info.status).toBe('low_stock');
    expect(info.label).toBe('Only 3 left');
  });

  it('returns in_stock when quantity is sufficient', () => {
    const info = getStockInfo(15, 5);
    expect(info.status).toBe('in_stock');
    expect(info.label).toBe('In Stock');
  });
});

describe('URL Slug & Idempotency Key Generation', () => {
  it('generates clean URL-safe slugs', () => {
    expect(generateSlug('Premium Running Shoes!')).toBe('premium-running-shoes');
    expect(generateSlug('Smart Watch — 2025 Edition')).toBe('smart-watch-2025-edition');
  });

  it('generates unique idempotency keys', () => {
    const key1 = generateIdempotencyKey();
    const key2 = generateIdempotencyKey();
    expect(key1).not.toBe(key2);
    expect(key1.length).toBeGreaterThan(10);
  });
});
