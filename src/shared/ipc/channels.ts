export const IPC_CHANNELS = {
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
  LICENSING_SELECT_FILE: 'licensing:select_file',
  LICENSING_ACTIVATE_SECRET: 'licensing:activate_secret',

  BACKUP_LIST: 'backup:list',
  BACKUP_CREATE_FULL: 'backup:create_full',
  BACKUP_CREATE_AUTO: 'backup:create_auto',
  BACKUP_RESTORE_FILE: 'backup:restore_file',

  MAINTENANCE_VACUUM: 'maintenance:vacuum',
  MAINTENANCE_INTEGRITY_CHECK: 'maintenance:integrity_check',
  MAINTENANCE_DIAGNOSTICS: 'maintenance:diagnostics',

  UPDATER_CHECK_GITHUB: 'updater:check_github',

  // Debts & Borrowing Channels
  POS_DEBTS_LIST: 'pos:debts_list',
  POS_SETTLE_DEBT: 'pos:settle_debt',

  // Expenses Channels
  EXPENSES_LIST: 'expenses:list',
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_DELETE: 'expenses:delete',
  EXPENSES_SUMMARY: 'expenses:summary',

  // Cloud Sync Channels
  CLOUD_SYNC_NOW: 'cloud:sync_now',
  CLOUD_GET_CONFIG: 'cloud:get_config',
  CLOUD_UPDATE_CONFIG: 'cloud:update_config',
  CLOUD_GET_SNAPSHOT: 'cloud:get_snapshot',
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
