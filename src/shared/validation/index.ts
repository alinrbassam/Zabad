import { z } from 'zod';

export const AppConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.enum(['en', 'ar']),
  currency: z.string().min(1),
  businessName: z.string().min(1),
  businessType: z.string().min(1),
  taxRate: z.number().min(0).max(100),
  taxNumber: z.string(),
  address: z.string(),
  phone: z.string(),
  backupPath: z.string(),
  receiptHeader: z.string(),
  receiptFooter: z.string(),
  appVersion: z.string(),
});

export const LogPayloadSchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  module: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const OwnerPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const SetupWizardPayloadSchema = z.object({
  language: z.enum(['en', 'ar']),
  theme: z.enum(['light', 'dark', 'system']),
  businessName: z.string().min(2, 'Business name is required'),
  businessType: z.enum([
    'Supermarket',
    'Mini Market',
    'Fish Market',
    'Clothing',
    'Electronics',
    'Cosmetics',
    'Hardware',
    'Bakery',
    'Pharmacy',
    'Stationery',
    'General Retail',
  ]),
  logo: z.string().optional(),
  ownerName: z.string().min(2, 'Owner name is required'),
  phone: z.string().min(3, 'Phone number is required'),
  email: z.string().email('Invalid email address').or(z.literal('')),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxNumber: z.string().optional(),
  currency: z.string().default('FCFA'),
  timezone: z.string().default('UTC'),
  dateFormat: z.string().default('DD-MM-YYYY'),
  timeFormat: z.string().default('24h'),
  taxEnabled: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  taxRate: z.number().min(0).max(100).default(15),
  pricesIncludeTax: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  receiptWidth: z.enum(['58mm', '80mm', 'A4']).default('80mm'),
  receiptLanguage: z.enum(['en', 'ar']).default('en'),
  showReceiptLogo: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  showReceiptAddress: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  showReceiptPhone: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  showReceiptTaxNumber: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  showCashierName: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  receiptFooterMessage: z.string().optional(),
  returnPolicy: z.string().optional(),
  autoPrintReceipt: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  saveReceiptAsPdf: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  autoBackupEnabled: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  backupFolder: z.string().optional(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  cloudSyncFolder: z.string().optional(),
  backupRetentionCount: z.number().min(1).default(7),
  backupCompressionEnabled: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(true),
  backupEncryptionEnabled: z.preprocess((val) => val === 'true' || val === true, z.boolean()).default(false),
  ownerUsername: z.string().min(3, 'Username must be at least 3 characters'),
  ownerPassword: OwnerPasswordSchema,
  securityQuestion: z.string().min(3, 'Security question is required'),
  securityAnswer: z.string().min(2, 'Security answer is required'),
});

export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberUsername: z.boolean().optional(),
});

export const PinLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  pin: z.string().min(4).max(6).regex(/^\d+$/, 'PIN must be 4 to 6 digits'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: OwnerPasswordSchema,
});

export const RecoverPasswordSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  securityAnswer: z.string().min(1, 'Answer is required'),
  newPassword: OwnerPasswordSchema,
});

export const UserCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: OwnerPasswordSchema,
  pin: z.string().min(4).max(6).regex(/^\d+$/).optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  roleId: z.string().min(1, 'Role is required'),
  notes: z.string().optional(),
});

export const UserUpdateSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  roleId: z.string().min(1),
  pin: z.string().min(4).max(6).regex(/^\d+$/).optional().or(z.literal('')),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

// Phase 3 Inventory Schemas
export const CategorySchema = z.object({
  id: z.string().optional(),
  code: z.string().optional(),
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const BrandSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  description: z.string().optional(),
  logo: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export const UnitSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Unit code is required'),
  nameEn: z.string().min(1, 'English name is required'),
  nameAr: z.string().min(1, 'Arabic name is required'),
  symbol: z.string().min(1, 'Symbol is required'),
  unitCategory: z.enum(['Count', 'Weight', 'Volume', 'Length', 'Packaging', 'Custom']),
  allowDecimals: z.boolean().default(false),
  decimalPrecision: z.number().min(0).max(4).default(0),
  isActive: z.boolean().default(true),
});

export const SupplierSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'Supplier code is required'),
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  taxNumber: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const RawProductSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional().default(() => 'SKU-' + Math.floor(100000 + Math.random() * 900000)),
  productCode: z.string().optional(),
  primaryBarcode: z.string().optional(),
  nameEn: z.string().min(1, 'Product name is required'),
  nameAr: z.string().optional().default(''),
  shortName: z.string().optional(),
  description: z.string().optional(),
  internalNotes: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  subcategoryId: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  primarySupplierId: z.string().nullable().optional(),
  productType: z.enum([
    'Standard stock item',
    'Non-stock item',
    'Service',
    'Weighted product',
    'Measured product',
  ]),
  baseUnitId: z.string().min(1, 'Base unit is required'),
  sellingUnitId: z.string().optional(),
  purchasingUnitId: z.string().optional(),
  allowDecimalQty: z.boolean().default(false),
  qtyPrecision: z.number().min(0).max(4).default(0),
  purchaseCost: z.number().min(0, 'Purchase cost cannot be negative'),
  avgCost: z.number().min(0).default(0),
  lastPurchaseCost: z.number().min(0).default(0),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  wholesalePrice: z.number().min(0).default(0),
  minSellingPrice: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  pricesIncludeTax: z.boolean().default(false),
  isTaxExempt: z.boolean().default(false),
  allowDiscount: z.boolean().default(true),
  trackInventory: z.boolean().default(true),
  minStock: z.number().min(0).default(0),
  maxStock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  defaultReorderQty: z.number().min(0).default(0),
  allowNegativeStock: z.boolean().default(false),
  storageLocation: z.string().optional(),
  shelfCode: z.string().optional(),
  trackBatches: z.boolean().default(false),
  trackExpiry: z.boolean().default(false),
  trackSerials: z.boolean().default(false),
  shelfLifeDays: z.number().min(0).default(0),
  imageUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  preferredReceiptName: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // Initial Stock (Opening Stock)
  openingStockQty: z.number().min(0).optional(),
  openingBatchNumber: z.string().optional(),
  openingExpiryDate: z.string().optional(),
});

export const ProductSchema = RawProductSchema.refine(
  (data) => data.sellingPrice >= data.minSellingPrice,
  {
    message: 'Selling price cannot be less than minimum allowed selling price',
    path: ['sellingPrice'],
  },
);

export const StockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  batchId: z.string().optional(),
  movementType: z.enum([
    'Manual addition',
    'Manual deduction',
    'Stock correction',
    'Damaged stock',
    'Expired stock',
    'Lost stock',
    'Future purchase receipt',
    'Future purchase return',
    'Customer sale',
    'Customer sale refund',
  ]),
  quantityChange: z.number(),
  unitCost: z.number().min(0).optional(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
});

// Phase 4 Purchasing Schemas
export const PurchaseOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  description: z.string().optional(),
  purchasingUnitId: z.string().min(1, 'Unit is required'),
  conversionRatio: z.number().min(0.0001).default(1),
  orderedQty: z.number().min(0.0001, 'Quantity must be greater than zero'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

export const PurchaseOrderSchema = z.object({
  id: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDeliveryDate: z.string().optional(),
  currency: z.string().default('USD'),
  taxMode: z.enum(['inclusive', 'exclusive']).default('exclusive'),
  discountMode: z.enum(['amount', 'percentage']).default('amount'),
  orderDiscount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  additionalCharges: z.number().min(0).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(PurchaseOrderItemSchema).min(1, 'At least one product line is required'),
});

export const GoodsReceivingItemSchema = z.object({
  poItemId: z.string().optional(),
  productId: z.string().min(1),
  unitId: z.string().min(1),
  receivedQty: z.number().min(0.0001),
  acceptedQty: z.number().min(0),
  rejectedQty: z.number().min(0).default(0),
  unitCost: z.number().min(0),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
  batchNumber: z.string().optional(),
  mfgDate: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export const GoodsReceivingSchema = z.object({
  poId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierInvoiceNumber: z.string().optional(),
  supplierInvoiceDate: z.string().optional(),
  receiptDate: z.string().min(1),
  deliveryNoteNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(GoodsReceivingItemSchema).min(1, 'At least one item must be received'),
});

export const PurchaseReturnSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  receiptId: z.string().optional(),
  returnDate: z.string().min(1),
  reason: z.string().min(1, 'Return reason is required'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        batchId: z.string().optional(),
        unitId: z.string().min(1),
        returnedQty: z.number().min(0.0001, 'Returned quantity must be greater than zero'),
        unitCost: z.number().min(0),
        reason: z.string().optional(),
        stockDisposition: z.string().default('Remove from sellable stock'),
      }),
    )
    .min(1, 'At least one item to return is required'),
});

// Phase 5 POS Schemas
export const POSCartItemSchema = z.object({
  productId: z.string().min(1),
  batchId: z.string().optional(),
  unitId: z.string().min(1),
  quantity: z.number().min(0.0001, 'Quantity must be positive'),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  discount: z.number().min(0).default(0),
  taxRate: z.number().min(0).default(0),
});

export const POSPaymentSchema = z.object({
  paymentMethod: z.enum(['Cash', 'Card', 'Digital Wallet', 'Store Credit', 'Borrow', 'Credit']),
  amount: z.number().min(0, 'Payment amount cannot be negative'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const POSCheckoutSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  orderDiscount: z.number().min(0).default(0),
  amountTendered: z.number().min(0).default(0),
  shiftId: z.string().optional(),
  items: z.array(POSCartItemSchema).min(1, 'Cart cannot be empty'),
  payments: z.array(POSPaymentSchema).min(1, 'At least one payment is required'),
});

export const ExpenseSchema = z.object({
  category: z.enum([
    'Electricity',
    'Water',
    'Ice & Cooling',
    'Rent',
    'Salaries',
    'Transport',
    'Maintenance',
    'Other',
  ]),
  title: z.string().min(1, 'Title or description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than zero'),
  paymentMethod: z.enum(['Cash', 'Card', 'Bank Transfer', 'Digital Wallet', 'Other']).default('Cash'),
  expenseDate: z.string().min(1, 'Expense date is required'),
  receiptReference: z.string().optional(),
  notes: z.string().optional(),
});

export const POSRefundSchema = z.object({
  saleId: z.string().min(1, 'Sale reference is required'),
  reason: z.string().min(1, 'Refund reason is required'),
  refundMethod: z.enum(['Cash', 'Card', 'Store Credit']).default('Cash'),
  items: z
    .array(
      z.object({
        saleItemId: z.string().min(1),
        productId: z.string().min(1),
        batchId: z.string().optional(),
        returnedQty: z.number().min(0.0001),
        refundAmount: z.number().min(0),
      }),
    )
    .min(1, 'At least one line to refund is required'),
});

export type SetupWizardPayloadInput = z.infer<typeof SetupWizardPayloadSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PinLoginInput = z.infer<typeof PinLoginSchema>;
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type AppConfigInput = z.infer<typeof AppConfigSchema>;
export type LogPayloadInput = z.infer<typeof LogPayloadSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
export type BrandInput = z.infer<typeof BrandSchema>;
export type UnitInput = z.infer<typeof UnitSchema>;
export type SupplierInput = z.infer<typeof SupplierSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;
export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;
export type GoodsReceivingInput = z.infer<typeof GoodsReceivingSchema>;
export type PurchaseReturnInput = z.infer<typeof PurchaseReturnSchema>;
export type POSCheckoutInput = z.infer<typeof POSCheckoutSchema>;
export type POSRefundInput = z.infer<typeof POSRefundSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
