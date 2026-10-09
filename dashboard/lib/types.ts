export interface TopSellingProduct {
  id: string;
  name: string;
  qty: number;
  unit: string;
  revenue: number;
}

export interface PeriodMetrics {
  date: string;
  revenue: number;
  orderCount: number;
  grossProfit: number;
  cashAmount: number;
  mobileMoneyAmount: number;
  creditAmount: number;
  expensesTotal: number;
  netProfit: number;
  topProducts?: TopSellingProduct[];
}

export interface StoreSnapshot {
  storeName: string;
  timestamp: string;
  currency: string;
  today: PeriodMetrics;
  periods?: {
    today: PeriodMetrics;
    yesterday: PeriodMetrics;
    week: PeriodMetrics;
    month: PeriodMetrics;
  };
  debts: {
    totalOutstanding: number;
    debtorsCount: number;
    records: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      customerPhone?: string;
      dueDate?: string;
      totalAmount: number;
      paidAmount: number;
      dueAmount: number;
      createdAt: string;
    }>;
  };
  stockAlerts: {
    outOfStockCount: number;
    lowStockCount: number;
    items: Array<{
      id: string;
      name: string;
      currentStock: number;
      reorderLevel: number;
      unit: string;
      status: 'out_of_stock' | 'low_stock';
    }>;
  };
  recentSales: Array<{
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    paymentMethod: string;
    customerName?: string;
    createdAt: string;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    expenseDate: string;
  }>;
}

const emptyPeriod: PeriodMetrics = {
  date: new Date().toISOString().slice(0, 10),
  revenue: 0,
  orderCount: 0,
  grossProfit: 0,
  cashAmount: 0,
  mobileMoneyAmount: 0,
  creditAmount: 0,
  expensesTotal: 0,
  netProfit: 0,
  topProducts: [],
};

export const defaultDemoSnapshot: StoreSnapshot = {
  storeName: 'متجر علي خليل',
  timestamp: '',
  currency: 'FCFA',
  today: { ...emptyPeriod },
  periods: {
    today: { ...emptyPeriod },
    yesterday: { ...emptyPeriod },
    week: { ...emptyPeriod },
    month: { ...emptyPeriod },
  },
  debts: {
    totalOutstanding: 0,
    debtorsCount: 0,
    records: [],
  },
  stockAlerts: {
    outOfStockCount: 0,
    lowStockCount: 0,
    items: [],
  },
  recentSales: [],
  recentExpenses: [],
};

