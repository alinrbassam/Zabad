import { ipcRenderer } from 'electron';
const IPC_CHANNELS = {
  CONFIG_GET: 'config:get',
  CONFIG_UPDATE: 'config:update',
  DB_EXECUTE: 'db:execute',
  DB_QUERY: 'db:query',
  LOG_WRITE: 'log:write',
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  LICENSING_VERIFY: 'licensing:verify',
  PRINTING_RECEIPT: 'printing:receipt',
  UPDATER_CHECK: 'updater:check',

  // Phase 2 Channels
  AUTH_CHECK_SETUP: 'auth:check_setup',
  AUTH_COMPLETE_SETUP: 'auth:complete_setup',
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGIN_PIN: 'auth:login_pin',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_VERIFY_SESSION: 'auth:verify_session',
  AUTH_CHANGE_PASSWORD: 'auth:change_password',
  AUTH_RECOVER_PASSWORD: 'auth:recover_password',
  AUTH_GET_SECURITY_QUESTION: 'auth:get_security_question',

  USERS_LIST: 'users:list',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_TOGGLE_STATUS: 'users:toggle_status',
  USERS_RESET_PASSWORD: 'users:reset_password',

  ROLES_LIST: 'roles:list',
  PERMISSIONS_LIST: 'permissions:list',

  SETTINGS_GET_SECTION: 'settings:get_section',
  SETTINGS_UPDATE_SECTION: 'settings:update_section',

  AUDIT_LIST: 'audit:list',

  // Phase 3 Inventory Channels
  PRODUCTS_LIST: 'products:list',
  PRODUCTS_GET_BY_ID: 'products:get_by_id',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_ARCHIVE: 'products:archive',
  PRODUCTS_SEARCH: 'products:search',

  CATEGORIES_LIST: 'categories:list',
  CATEGORIES_CREATE: 'categories:create',
  CATEGORIES_UPDATE: 'categories:update',
  CATEGORIES_DELETE: 'categories:delete',

  BRANDS_LIST: 'brands:list',
  BRANDS_CREATE: 'brands:create',
  BRANDS_UPDATE: 'brands:update',

  UNITS_LIST: 'units:list',
  UNITS_CREATE: 'units:create',

  SUPPLIERS_LIST: 'suppliers:list',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_UPDATE: 'suppliers:update',

  BARCODES_LOOKUP: 'barcodes:lookup',
  BARCODES_ADD_ALTERNATE: 'barcodes:add_alternate',

  STOCK_GET_SUMMARY: 'stock:get_summary',
  STOCK_LIST_MOVEMENTS: 'stock:list_movements',
  STOCK_CREATE_ADJUSTMENT: 'stock:create_adjustment',

  BATCHES_LIST: 'batches:list',
  EXPIRY_LIST: 'expiry:list',

  IMPORT_PRODUCTS: 'import:products',
  EXPORT_PRODUCTS: 'export:products',

  // Phase 4 Purchasing Channels
  PURCHASE_ORDERS_LIST: 'po:list',
  PURCHASE_ORDERS_GET_BY_ID: 'po:get_by_id',
  PURCHASE_ORDERS_CREATE: 'po:create',
  PURCHASE_ORDERS_UPDATE_STATUS: 'po:update_status',

  GOODS_RECEIPTS_CONFIRM: 'gr:confirm',
  DIRECT_PURCHASES_CREATE: 'direct_purchase:create',

  SUPPLIER_INVOICES_LIST: 'supplier_invoices:list',
  PURCHASE_RETURNS_CREATE: 'purchase_returns:create',

  PURCHASING_DASHBOARD_GET: 'purchasing:dashboard_get',

  // Phase 5 POS Channels
  POS_CHECKOUT: 'pos:checkout',
  POS_SALES_LIST: 'pos:sales_list',
  POS_SALES_GET_BY_ID: 'pos:sales_get_by_id',
  POS_HOLD_SALE: 'pos:hold_sale',
  POS_RESUME_SALE: 'pos:resume_sale',
  POS_SUSPENDED_LIST: 'pos:suspended_list',
  POS_SUSPENDED_DELETE: 'pos:suspended_delete',
  POS_REFUND: 'pos:refund',
  POS_SHIFT_GET_ACTIVE: 'pos:shift_get_active',
  POS_SHIFT_OPEN: 'pos:shift_open',
  POS_SHIFT_CLOSE: 'pos:shift_close',

  // Phase 6 Reports Channels
  REPORTS_DASHBOARD: 'reports:dashboard',
  REPORTS_SALES: 'reports:sales',
  REPORTS_PRODUCTS: 'reports:products',
  REPORTS_INVENTORY: 'reports:inventory',
  REPORTS_PURCHASING: 'reports:purchasing',
  REPORTS_FINANCIAL: 'reports:financial',
  REPORTS_EXPORT_CSV: 'reports:export_csv',

  // Phase 7 Commercial Channels
  LICENSING_GET_DEVICE_ID: 'licensing:get_device_id',
  LICENSING_GET_INFO: 'licensing:get_info',
  LICENSING_ACTIVATE_FILE: 'licensing:activate_file',

  BACKUP_LIST: 'backup:list',
  BACKUP_CREATE_FULL: 'backup:create_full',
  BACKUP_CREATE_AUTO: 'backup:create_auto',
  BACKUP_RESTORE_FILE: 'backup:restore_file',

  MAINTENANCE_VACUUM: 'maintenance:vacuum',
  MAINTENANCE_INTEGRITY_CHECK: 'maintenance:integrity_check',
  MAINTENANCE_DIAGNOSTICS: 'maintenance:diagnostics',

  UPDATER_CHECK_GITHUB: 'updater:check_github',
  SYSTEM_SELECT_DIRECTORY: 'system:select_directory',
} as const;
import {
  ApiResponse,
  UserEntity,
  RoleEntity,
  PermissionEntity,
  AuditLogEntity,
  LoginResult,
  ProductEntity,
  CategoryEntity,
  BrandEntity,
  UnitEntity,
  SupplierEntity,
  InventoryMovementEntity,
  BatchEntity,
  PurchaseOrderEntity,
  PurchaseOrderItemEntity,
  GoodsReceiptEntity,
  PurchaseReturnEntity,
  SalesOrderEntity,
  SalesOrderItemEntity,
  SuspendedSaleEntity,
  SalesRefundEntity,
  POStatus,
  AppConfig,
} from '../shared/types';
import {
  SetupWizardPayloadInput,
  LoginInput,
  PinLoginInput,
  UserCreateInput,
  UserUpdateInput,
  ProductInput,
  CategoryInput,
  BrandInput,
  UnitInput,
  SupplierInput,
  StockAdjustmentInput,
  PurchaseOrderInput,
  GoodsReceivingInput,
  PurchaseReturnInput,
  POSCheckoutInput,
  POSRefundInput,
} from '../shared/validation';

export const api = {
  // Phase 1 Core
  getConfig: (): Promise<ApiResponse<AppConfig>> => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
  updateConfig: (config: unknown): Promise<ApiResponse<AppConfig>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CONFIG_UPDATE, config),
  writeLog: (level: string, module: string, message: string, details?: unknown) =>
    ipcRenderer.invoke(IPC_CHANNELS.LOG_WRITE, { level, module, message, details }),

  // Phase 2 Auth & Users
  checkSetup: (): Promise<ApiResponse<{ isSetupComplete: boolean }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHECK_SETUP),
  completeSetup: (payload: SetupWizardPayloadInput): Promise<ApiResponse<LoginResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_COMPLETE_SETUP, payload),
  login: (credentials: LoginInput): Promise<ApiResponse<LoginResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, credentials),
  loginPin: (credentials: PinLoginInput): Promise<ApiResponse<LoginResult>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN_PIN, credentials),
  logout: (token: string): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT, token),
  verifySession: (
    token: string,
  ): Promise<ApiResponse<{ user: UserEntity; role: string; permissions: string[] }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_VERIFY_SESSION, token),
  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, { currentPassword, newPassword }),
  getSecurityQuestion: (username: string): Promise<ApiResponse<{ question: string }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_GET_SECURITY_QUESTION, username),
  recoverPassword: (
    username: string,
    securityAnswer: string,
    newPassword: string,
  ): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUTH_RECOVER_PASSWORD, {
      username,
      securityAnswer,
      newPassword,
    }),

  getUsers: (): Promise<ApiResponse<(UserEntity & { role_name: string })[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.USERS_LIST),
  getUsersList: (): Promise<ApiResponse<(UserEntity & { role_name: string })[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.USERS_LIST),
  createUser: (user: UserCreateInput, operatorUserId?: string): Promise<ApiResponse<UserEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.USERS_CREATE, user, operatorUserId),
  updateUser: (user: UserUpdateInput, operatorUserId?: string): Promise<ApiResponse<UserEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.USERS_UPDATE, user, operatorUserId),
  toggleUserStatus: (
    targetUserId: string,
    isActive: boolean,
    operatorUserId: string,
  ): Promise<ApiResponse<UserEntity>> =>
    ipcRenderer.invoke(
      IPC_CHANNELS.USERS_TOGGLE_STATUS,
      { targetUserId, isActive },
      operatorUserId,
    ),
  resetUserPassword: (
    targetUserId: string,
    newPassword: string,
    operatorUserId: string,
  ): Promise<ApiResponse> =>
    ipcRenderer.invoke(
      IPC_CHANNELS.USERS_RESET_PASSWORD,
      { targetUserId, newPassword },
      operatorUserId,
    ),

  getRoles: (): Promise<ApiResponse<RoleEntity[]>> => ipcRenderer.invoke(IPC_CHANNELS.ROLES_LIST),
  getPermissions: (): Promise<ApiResponse<PermissionEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PERMISSIONS_LIST),

  getSectionSettings: (category: string): Promise<ApiResponse<Record<string, string>>> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_SECTION, category),
  updateSectionSettings: (
    category: string,
    values: Record<string, string>,
  ): Promise<ApiResponse<Record<string, string>>> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE_SECTION, category, values),

  getAuditLogs: (limit?: number): Promise<ApiResponse<AuditLogEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.AUDIT_LIST, limit),

  // Phase 3 Inventory APIs
  searchProducts: (
    query: string,
    limit?: number,
    offset?: number,
  ): Promise<ApiResponse<ProductEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_SEARCH, query, limit, offset),
  getProductById: (id: string): Promise<ApiResponse<ProductEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_GET_BY_ID, id),
  createProduct: (payload: ProductInput, userId?: string): Promise<ApiResponse<ProductEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_CREATE, payload, userId),
  updateProduct: (
    payload: Partial<ProductInput> & { id: string },
    userId?: string,
  ): Promise<ApiResponse<ProductEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_UPDATE, payload, userId),
  archiveProduct: (id: string, userId?: string): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.PRODUCTS_ARCHIVE, id, userId),

  getCategories: (): Promise<ApiResponse<CategoryEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_LIST),
  createCategory: (payload: CategoryInput): Promise<ApiResponse<CategoryEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_CREATE, payload),
  updateCategory: (
    payload: Partial<CategoryInput> & { id: string },
  ): Promise<ApiResponse<CategoryEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_UPDATE, payload),
  deleteCategory: (id: string): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.CATEGORIES_DELETE, id),

  getBrands: (): Promise<ApiResponse<BrandEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BRANDS_LIST),
  createBrand: (payload: BrandInput): Promise<ApiResponse<BrandEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BRANDS_CREATE, payload),

  getUnits: (): Promise<ApiResponse<UnitEntity[]>> => ipcRenderer.invoke(IPC_CHANNELS.UNITS_LIST),
  createUnit: (payload: UnitInput): Promise<ApiResponse<UnitEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.UNITS_CREATE, payload),

  getSuppliers: (): Promise<ApiResponse<SupplierEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.SUPPLIERS_LIST),
  createSupplier: (payload: SupplierInput): Promise<ApiResponse<SupplierEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.SUPPLIERS_CREATE, payload),

  getStockSummary: (): Promise<
    ApiResponse<{
      totalProducts: number;
      totalStockQty: number;
      totalCostValue: number;
      totalSellingValue: number;
      lowStockCount: number;
      outOfStockCount: number;
      expiredCount: number;
      expiringSoonCount: number;
    }>
  > => ipcRenderer.invoke(IPC_CHANNELS.STOCK_GET_SUMMARY),

  getStockMovements: (
    productId?: string,
    limit?: number,
  ): Promise<ApiResponse<InventoryMovementEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.STOCK_LIST_MOVEMENTS, productId, limit),
  createStockAdjustment: (
    payload: StockAdjustmentInput,
    userId?: string,
  ): Promise<ApiResponse<InventoryMovementEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.STOCK_CREATE_ADJUSTMENT, payload, userId),

  getBatches: (productId: string): Promise<ApiResponse<BatchEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BATCHES_LIST, productId),
  getExpiringBatches: (daysWindow?: number): Promise<ApiResponse<BatchEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPIRY_LIST, daysWindow),

  importProducts: (
    rows: unknown[],
    userId?: string,
  ): Promise<
    ApiResponse<{
      total: number;
      imported: number;
      failed: number;
      errors: { row: number; error: string }[];
    }>
  > => ipcRenderer.invoke(IPC_CHANNELS.IMPORT_PRODUCTS, rows, userId),
  exportProducts: (query?: string, includeCost?: boolean): Promise<ApiResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.EXPORT_PRODUCTS, query, includeCost),

  // Phase 4 Purchasing APIs
  getPurchaseOrders: (
    query?: string,
    status?: string,
  ): Promise<ApiResponse<(PurchaseOrderEntity & { supplier_name?: string })[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PURCHASE_ORDERS_LIST, query, status),
  getPurchaseOrderById: (
    id: string,
  ): Promise<ApiResponse<PurchaseOrderEntity & { items: PurchaseOrderItemEntity[] }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PURCHASE_ORDERS_GET_BY_ID, id),
  createPurchaseOrder: (
    payload: PurchaseOrderInput,
    userId?: string,
  ): Promise<ApiResponse<PurchaseOrderEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PURCHASE_ORDERS_CREATE, payload, userId),
  updatePurchaseOrderStatus: (
    id: string,
    toStatus: POStatus,
    notes?: string,
  ): Promise<ApiResponse> =>
    ipcRenderer.invoke(IPC_CHANNELS.PURCHASE_ORDERS_UPDATE_STATUS, { id, toStatus, notes }),

  confirmGoodsReceipt: (
    payload: GoodsReceivingInput,
    userId?: string,
  ): Promise<ApiResponse<GoodsReceiptEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.GOODS_RECEIPTS_CONFIRM, payload, userId),

  createPurchaseReturn: (
    payload: PurchaseReturnInput,
    userId?: string,
  ): Promise<ApiResponse<PurchaseReturnEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.PURCHASE_RETURNS_CREATE, payload, userId),

  getPurchasingDashboard: (): Promise<
    ApiResponse<{
      draftsCount: number;
      awaitingApprovalCount: number;
      orderedCount: number;
      overdueCount: number;
      monthlyPurchasesTotal: number;
      topSuppliers: { name: string; total_purchases: number }[];
    }>
  > => ipcRenderer.invoke(IPC_CHANNELS.PURCHASING_DASHBOARD_GET),

  // Phase 5 POS APIs
  posCheckout: (
    payload: POSCheckoutInput,
    cashierId?: string,
  ): Promise<ApiResponse<SalesOrderEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_CHECKOUT, payload, cashierId),
  getSalesList: (query?: string): Promise<ApiResponse<SalesOrderEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_SALES_LIST, query),
  getSaleById: (
    id: string,
  ): Promise<ApiResponse<SalesOrderEntity & { items: SalesOrderItemEntity[] }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_SALES_GET_BY_ID, id),
  posHoldSale: (payload: unknown, cashierId?: string): Promise<ApiResponse<SuspendedSaleEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_HOLD_SALE, payload, cashierId),
  getSuspendedSales: (): Promise<ApiResponse<SuspendedSaleEntity[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_SUSPENDED_LIST),
  resumeSuspendedSale: (
    id: string,
  ): Promise<ApiResponse<{ sale: SuspendedSaleEntity; items: unknown[] }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_RESUME_SALE, id),
  posRefund: (payload: POSRefundInput, userId?: string): Promise<ApiResponse<SalesRefundEntity>> =>
    ipcRenderer.invoke(IPC_CHANNELS.POS_REFUND, payload, userId),

  // Phase 6 Reports APIs
  getReportsDashboard: (options: unknown): Promise<ApiResponse<unknown>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_DASHBOARD, options),
  getSalesReport: (options: unknown): Promise<ApiResponse<unknown[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_SALES, options),
  getProductReport: (options: unknown): Promise<ApiResponse<unknown[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_PRODUCTS, options),
  getInventoryReport: (options: unknown): Promise<ApiResponse<unknown[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_INVENTORY, options),
  getFinancialReport: (
    options: unknown,
  ): Promise<
    ApiResponse<{
      revenue: number;
      cogs: number;
      grossProfit: number;
      expenses: number;
      netProfit: number;
      profitMarginPercent: number;
      taxCollected: number;
      discountsGiven: number;
    }>
  > => ipcRenderer.invoke(IPC_CHANNELS.REPORTS_FINANCIAL, options),
  exportReportCsv: (data: Record<string, unknown>[]): Promise<ApiResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_EXPORT_CSV, data),

  // Phase 7 Commercial APIs
  getDeviceFingerprint: (): Promise<ApiResponse<string>> =>
    ipcRenderer.invoke(IPC_CHANNELS.LICENSING_GET_DEVICE_ID),
  getActiveLicense: (): Promise<ApiResponse<unknown>> =>
    ipcRenderer.invoke(IPC_CHANNELS.LICENSING_GET_INFO),
  activateLicenseFile: (payloadStr: string): Promise<ApiResponse<unknown>> =>
    ipcRenderer.invoke(IPC_CHANNELS.LICENSING_ACTIVATE_FILE, payloadStr),

  getBackupsList: (): Promise<ApiResponse<unknown[]>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_LIST),
  createFullBackup: (folder: string): Promise<ApiResponse<unknown>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE_FULL, folder),
  createAutoBackup: (folder: string, retention?: number): Promise<ApiResponse<unknown>> =>
    ipcRenderer.invoke(IPC_CHANNELS.BACKUP_CREATE_AUTO, folder, retention),

  runVacuum: (): Promise<ApiResponse> => ipcRenderer.invoke(IPC_CHANNELS.MAINTENANCE_VACUUM),
  runIntegrityCheck: (): Promise<ApiResponse<{ status: string; result: string }>> =>
    ipcRenderer.invoke(IPC_CHANNELS.MAINTENANCE_INTEGRITY_CHECK),
  getDiagnosticsMetrics: (): Promise<
    ApiResponse<{
      appVersion: string;
      electronVersion: string;
      nodeVersion: string;
      sqliteVersion: string;
      osPlatform: string;
      osRelease: string;
      totalMemoryMB: number;
      freeMemoryMB: number;
      productCount: number;
      salesCount: number;
      purchaseCount: number;
      lastBackupDate?: string | null;
    }>
  > => ipcRenderer.invoke(IPC_CHANNELS.MAINTENANCE_DIAGNOSTICS),

  checkForUpdatesGithub: (): Promise<
    ApiResponse<{
      hasUpdate: boolean;
      currentVersion: string;
      latestVersion: string;
      releaseNotes?: string;
    }>
  > => ipcRenderer.invoke(IPC_CHANNELS.UPDATER_CHECK_GITHUB),

  selectDirectory: (): Promise<ApiResponse<string | null>> =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_DIRECTORY),
};

export type WindowApi = typeof api;
