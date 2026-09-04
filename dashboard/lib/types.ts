export interface StoreSnapshot {
  storeName: string;
  timestamp: string;
  currency: string;
  today: {
    date: string;
    revenue: number;
    orderCount: number;
    grossProfit: number;
    cashAmount: number;
    mobileMoneyAmount: number;
    creditAmount: number;
    expensesTotal: number;
    netProfit: number;
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

export const defaultDemoSnapshot: StoreSnapshot = {
  storeName: 'Zabad Seafood',
  timestamp: new Date().toISOString(),
  currency: 'FCFA',
  today: {
    date: new Date().toISOString().slice(0, 10),
    revenue: 185000,
    orderCount: 14,
    grossProfit: 62500,
    cashAmount: 110000,
    mobileMoneyAmount: 75000,
    creditAmount: 0,
    expensesTotal: 12000,
    netProfit: 50500,
  },
  debts: {
    totalOutstanding: 45000,
    debtorsCount: 2,
    records: [
      {
        id: 'd1',
        invoiceNumber: 'INV-2026-0042',
        customerName: 'Hassan Darwish',
        customerPhone: '+237 670 11 22 33',
        dueDate: '2026-09-10',
        totalAmount: 35000,
        paidAmount: 10000,
        dueAmount: 25000,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'd2',
        invoiceNumber: 'INV-2026-0038',
        customerName: 'Chez Paul Restaurant',
        customerPhone: '+237 699 44 55 66',
        dueDate: '2026-09-08',
        totalAmount: 20000,
        paidAmount: 0,
        dueAmount: 20000,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  stockAlerts: {
    outOfStockCount: 2,
    lowStockCount: 3,
    items: [
      {
        id: 'p1',
        name: 'Fresh Salmon Fillet',
        currentStock: 0,
        reorderLevel: 100,
        unit: 'Kg',
        status: 'out_of_stock',
      },
      {
        id: 'p2',
        name: 'Tiger Prawns (Large)',
        currentStock: 0,
        reorderLevel: 100,
        unit: 'Kg',
        status: 'out_of_stock',
      },
      {
        id: 'p3',
        name: 'Whole White Snapper',
        currentStock: 35,
        reorderLevel: 100,
        unit: 'Kg',
        status: 'low_stock',
      },
    ],
  },
  recentSales: [
    {
      id: 's1',
      invoiceNumber: 'INV-2026-0050',
      grandTotal: 18500,
      paymentMethod: 'Cash',
      customerName: 'Walk-in Customer',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 's2',
      invoiceNumber: 'INV-2026-0049',
      grandTotal: 32000,
      paymentMethod: 'Orange Money',
      customerName: 'Alain M.',
      createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    },
  ],
  recentExpenses: [
    {
      id: 'e1',
      title: 'Ice blocks for seafood display counter',
      category: 'Utilities',
      amount: 7000,
      paymentMethod: 'Cash',
      expenseDate: new Date().toISOString().slice(0, 10),
    },
    {
      id: 'e2',
      title: 'Packaging polythene bags',
      category: 'Supplies',
      amount: 5000,
      paymentMethod: 'Cash',
      expenseDate: new Date().toISOString().slice(0, 10),
    },
  ],
};
