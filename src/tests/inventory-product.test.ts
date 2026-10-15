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

  it('should parse pieceWeight and piecesPerPack properly', () => {
    const weightedProduct = {
      sku: 'SKU-TILE-1',
      nameEn: 'Floor Tiles 60x60',
      nameAr: 'بلاط أرضيات',
      productType: 'Standard stock item',
      categoryId: 'cat-tiles',
      baseUnitId: 'unit-box',
      purchaseCost: 50,
      sellingPrice: 100,
      minSellingPrice: 80,
      pieceWeight: 0.25,
      piecesPerPack: 12,
    };

    const parsed = ProductSchema.parse(weightedProduct);
    expect(parsed.pieceWeight).toBe(0.25);
    expect(parsed.piecesPerPack).toBe(12);
  });

  it('should gracefully handle empty or NaN pieceWeight and piecesPerPack', () => {
    const rawWithNaN = {
      sku: 'SKU-TILE-2',
      nameEn: 'Loose Tiles',
      productType: 'Standard stock item',
      categoryId: 'cat-tiles',
      baseUnitId: 'unit-box',
      purchaseCost: 10,
      sellingPrice: 20,
      minSellingPrice: 15,
      pieceWeight: NaN,
      piecesPerPack: '',
    };

    const parsed = ProductSchema.parse(rawWithNaN);
    expect(parsed.pieceWeight).toBe(0);
    expect(parsed.piecesPerPack).toBe(1);
  });
});
