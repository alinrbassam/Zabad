export type ThemeMode = 'light' | 'dark' | 'system';
export type LanguageCode = 'en' | 'ar' | 'fr';
export type TextDirection = 'ltr' | 'rtl';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface BusinessEntity extends BaseEntity {
  name: string;
  type: string;
  logo?: string;
  tax_number?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  currency: string;
  timezone: string;
  date_format: string;
  time_format: string;
}

export interface RoleEntity extends BaseEntity {
  name: string;
  description?: string;
  is_system: number;
}

export interface PermissionEntity {
  id: string;
  key: string;
  name: string;
  module: string;
  description?: string;
}

export interface UserEntity extends BaseEntity {
  full_name: string;
  username: string;
  password_hash: string;
  salt: string;
  pin_code_hash?: string;
  phone?: string;
  email?: string;
  role_id: string;
  is_active: number;
  must_change_password: number;
  password_last_changed?: string;
  failed_login_attempts: number;
  locked_until?: string | null;
  notes?: string;
}

export interface SessionEntity {
  id: string;
  user_id: string;
  token: string;
  login_time: string;
  expires_at: string;
  is_active: number;
  ip_address?: string;
  device_info?: string;
}

export interface AuditLogEntity {
  id: string;
  user_id?: string;
  username?: string;
  action: string;
  module: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface LoginResult {
  token: string;
  user: UserEntity;
  role: RoleEntity;
  permissions: string[];
  expiresAt: string;
}

// Inventory Entities (Phase 3)
export interface CategoryEntity extends BaseEntity {
  code?: string;
  name_en: string;
  name_ar: string;
  description?: string;
  parent_id?: string | null;
  display_order: number;
  icon?: string;
  is_active: number;
}

export interface BrandEntity extends BaseEntity {
  name_en: string;
  name_ar: string;
  description?: string;
  logo?: string;
  country_of_origin?: string;
  is_active: number;
  notes?: string;
}

export interface UnitEntity {
  id: string;
  code: string;
  name_en: string;
  name_ar: string;
  symbol: string;
  unit_category: 'Count' | 'Weight' | 'Volume' | 'Length' | 'Packaging' | 'Custom';
  allow_decimals: number;
  decimal_precision: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SupplierEntity extends BaseEntity {
  code: string;
  name: string;
  contact_person?: string;
  phone?: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_number?: string;
  website?: string;
  notes?: string;
  is_active: number;
}

export interface BarcodeEntity {
  id: string;
  product_id: string;
  barcode: string;
  barcode_type: string;
  unit_id?: string;
  quantity_represented: number;
  is_primary: number;
  is_active: number;
  created_at: string;
}

export interface ProductEntity extends BaseEntity {
  sku: string;
  product_code?: string;
  primary_barcode?: string;
  name_en: string;
  name_ar: string;
  short_name?: string;
  description?: string;
  internal_notes?: string;
  category_id: string;
  subcategory_id?: string | null;
  brand_id?: string | null;
  primary_supplier_id?: string | null;
  product_type:
    'Standard stock item' | 'Non-stock item' | 'Service' | 'Weighted product' | 'Measured product';
  base_unit_id: string;
  selling_unit_id?: string;
  purchasing_unit_id?: string;
  allow_decimal_qty: number;
  qty_precision: number;
  purchase_cost: number;
  avg_cost: number;
  last_purchase_cost: number;
  selling_price: number;
  wholesale_price: number;
  min_selling_price: number;
  tax_rate: number;
  prices_include_tax: number;
  is_tax_exempt: number;
  allow_discount: number;
  track_inventory: number;
  min_stock: number;
  max_stock: number;
  reorder_level: number;
  default_reorder_qty: number;
  allow_negative_stock: number;
  storage_location?: string;
  shelf_code?: string;
  track_batches: number;
  track_expiry: number;
  track_serials: number;
  shelf_life_days: number;
  image_url?: string;
  thumbnail_url?: string;
  preferred_receipt_name?: string;
  is_active: number;
  is_featured: number;
  quantity_on_hand?: number;
  unit_symbol?: string;
  created_by?: string;
  updated_by?: string;
  archived_at?: string | null;
}

export interface InventoryBalanceEntity {
  product_id: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  damaged_quantity: number;
  expired_quantity: number;
  updated_at: string;
}

export interface InventoryMovementEntity {
  id: string;
  product_id: string;
  batch_id?: string;
  movement_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_id: string;
  cost_at_time: number;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  reason?: string;
  notes?: string;
  user_id?: string;
  created_at: string;
  product_name?: string;
  sku?: string;
  unit_symbol?: string;
}

export interface BatchEntity {
  id: string;
  product_id: string;
  batch_number: string;
  supplier_id?: string;
  mfg_date?: string;
  expiry_date?: string;
  received_qty: number;
  remaining_qty: number;
  unit_cost: number;
  status: 'Active' | 'Expiring soon' | 'Expired' | 'Depleted' | 'Blocked';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Phase 4 Purchasing Entities
export type POStatus =
  | 'Draft'
  | 'Awaiting approval'
  | 'Approved'
  | 'Ordered'
  | 'Partially received'
  | 'Fully received'
  | 'Closed'
  | 'Cancelled';

export interface PurchaseOrderEntity extends BaseEntity {
  po_number: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  currency: string;
  tax_mode: 'inclusive' | 'exclusive';
  discount_mode: 'amount' | 'percentage';
  subtotal: number;
  item_discount: number;
  order_discount: number;
  tax_subtotal: number;
  shipping_cost: number;
  additional_charges: number;
  grand_total: number;
  status: POStatus;
  approval_status: string;
  notes?: string;
  internal_notes?: string;
  cancellation_reason?: string;
  created_by?: string;
  approved_by?: string;
  ordered_by?: string;
  cancelled_at?: string | null;
}

export interface PurchaseOrderItemEntity {
  id: string;
  po_id: string;
  product_id: string;
  description?: string;
  purchasing_unit_id: string;
  conversion_ratio: number;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  line_subtotal: number;
  line_total: number;
  notes?: string;
}

export interface GoodsReceiptEntity {
  id: string;
  receipt_number: string;
  po_id?: string;
  supplier_id: string;
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;
  receipt_date: string;
  delivery_note_number?: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled' | 'Reversed';
  received_by?: string;
  notes?: string;
  created_at: string;
}

export interface GoodsReceiptItemEntity {
  id: string;
  receipt_id: string;
  po_item_id?: string;
  product_id: string;
  unit_id: string;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  unit_cost: number;
  discount: number;
  tax_rate: number;
  batch_number?: string;
  mfg_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface SupplierInvoiceEntity {
  id: string;
  invoice_number: string;
  supplier_id: string;
  po_id?: string;
  receipt_id?: string;
  invoice_date: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  status: string;
  created_by?: string;
  created_at: string;
}

export interface PurchaseReturnEntity {
  id: string;
  return_number: string;
  supplier_id: string;
  receipt_id?: string;
  return_date: string;
  reason: string;
  status: string;
  notes?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
}

// Phase 5 POS & Sales Entities
export interface SalesOrderEntity {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  due_date?: string;
  notes?: string;
  subtotal: number;
  item_discount: number;
  order_discount: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_status: 'Paid' | 'Partially paid' | 'Unpaid' | 'Refunded' | 'Voided' | string;
  payment_method: 'Cash' | 'Card' | 'Split' | 'Borrow' | 'Credit' | 'Digital Wallet' | 'Store Credit' | string;
  shift_id?: string;
  cashier_id?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'Electricity'
  | 'Water'
  | 'Ice & Cooling'
  | 'Rent'
  | 'Salaries'
  | 'Transport'
  | 'Maintenance'
  | 'Other';

export interface ExpenseEntity {
  id: string;
  category: ExpenseCategory | string;
  title: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  receipt_reference?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface SalesOrderItemEntity {
  id: string;
  sale_id: string;
  product_id: string;
  batch_id?: string;
  unit_id: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
}

export interface SalesPaymentEntity {
  id: string;
  sale_id: string;
  payment_method: 'Cash' | 'Card' | 'Digital Wallet' | 'Store Credit';
  amount: number;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface SuspendedSaleEntity {
  id: string;
  reference_name: string;
  customer_id?: string;
  cashier_id?: string;
  subtotal: number;
  grand_total: number;
  notes?: string;
  created_at: string;
}

export interface SalesRefundEntity {
  id: string;
  refund_number: string;
  sale_id: string;
  reason: string;
  refund_amount: number;
  refund_method: string;
  processed_by?: string;
  created_at: string;
}

export interface POSShiftEntity {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at?: string | null;
  opening_cash: number;
  closing_cash_actual?: number | null;
  closing_cash_expected?: number | null;
  status: 'Open' | 'Closed';
  notes?: string;
}

export interface AppConfig {
  theme: ThemeMode;
  language: LanguageCode;
  currency: string;
  businessName: string;
  businessType: string;
  taxRate: number;
  taxNumber: string;
  address: string;
  phone: string;
  backupPath: string;
  receiptHeader: string;
  receiptFooter: string;
  appVersion: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
