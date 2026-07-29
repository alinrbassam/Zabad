import { describe, it, expect } from 'vitest';
import { ProductSchema } from '../shared/validation';

describe('Product Schema & Validation', () => {
  it('should validate complete product creation schema', () => {
    const validProduct = {
      sku: 'SKU-001',
      primaryBarcode: '6291001001',
      nameEn: 'Organic Fresh Milk 1L',
      nameAr: 'حليب طازج عضوي 1 لتر',
      productType: 'Standard stock item',
      categoryId: 'cat-dairy-id',
      baseUnitId: 'unit-pcs-id',
      purchaseCost: 1.5,
      sellingPrice: 2.5,
      minSellingPrice: 2.0,
      trackInventory: true,
      trackBatches: true,
      trackExpiry: true,
      isActive: true,
    };

    const parsed = ProductSchema.parse(validProduct);
    expect(parsed.sku).toBe('SKU-001');
    expect(parsed.sellingPrice).toBe(2.5);
  });

  it('should reject selling price lower than minimum allowed selling price', () => {
    const invalidProduct = {
      sku: 'SKU-002',
      nameEn: 'Juice',
      nameAr: 'عصير',
      productType: 'Standard stock item',
      categoryId: 'cat-beverage',
      baseUnitId: 'unit-pcs',
      purchaseCost: 1.0,
      sellingPrice: 1.2, // Below min selling price 1.5
      minSellingPrice: 1.5,
    };

    expect(() => ProductSchema.parse(invalidProduct)).toThrow();
  });
});
