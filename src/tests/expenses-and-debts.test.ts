import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { POSSalesService } from '../main/services/pos-sales.service';
import { ExpenseService } from '../main/services/expense.service';

describe('Borrowing / Debt Sales & Operational Expenses', () => {
  let mockDb: any;
  let salesService: POSSalesService;
  let expenseService: ExpenseService;

  beforeEach(() => {
    const products: Record<string, any> = {
      'fish-salmon': {
        id: 'fish-salmon',
        name_en: 'Fresh Salmon',
        sku: 'FISH-001',
        track_batches: 0,
        purchase_cost: 4000,
        avg_cost: 4000,
        selling_price: 6500,
        tax_rate: 0,
        is_tax_exempt: 1,
      },
    };

    const salesMap = new Map<string, any>();
    salesMap.set('sale-borrow-1', {
      id: 'sale-borrow-1',
      invoice_number: 'INV-2026-000001',
      customer_name: 'Amadou Diallo',
      customer_phone: '0612345678',
      grand_total: 13000,
      paid_amount: 3000,
      payment_status: 'Partially paid',
    });

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM products WHERE id')) {
          return {
            get: (id: string) => products[id],
          };
        }
        if (sql.includes('SELECT * FROM numbering_sequences')) {
          return {
            get: () => ({ prefix: 'INV', current_number: 1, padding: 6, include_year: 1 }),
          };
        }
        if (sql.includes('SELECT * FROM inventory_balances')) {
          return {
            get: () => ({ quantity_on_hand: 50 }),
          };
        }
        if (sql.includes('INSERT INTO sales_orders')) {
          return {
            run: (...args: any[]) => {
              const [
                id,
                invNum,
                _custId,
                custName,
                custPhone,
                dueDate,
                notes,
                _subtotal,
                _itemDisc,
                _orderDisc,
                _taxTotal,
                grandTotal,
                paidAmount,
                _changeAmount,
                paymentStatus,
              ] = args;
              salesMap.set(id, {
                id,
                invoice_number: invNum,
                customer_name: custName,
                customer_phone: custPhone,
                due_date: dueDate,
                notes,
                grand_total: grandTotal,
                paid_amount: paidAmount,
                payment_status: paymentStatus,
              });
              return { changes: 1 };
            },
          };
        }
        if (sql.includes('UPDATE sales_orders')) {
          return {
            run: (...args: any[]) => {
              const [newPaid, newStatus, saleId] = args;
              const existing = salesMap.get(saleId);
              if (existing) {
                existing.paid_amount = newPaid;
                existing.payment_status = newStatus;
              }
              return { changes: 1 };
            },
          };
        }
        if (sql.includes('INSERT INTO sales_payments')) {
          return {
            run: () => ({ changes: 1 }),
          };
        }
        if (sql.includes('INSERT INTO expenses')) {
          return {
            run: () => ({ changes: 1 }),
          };
        }
        if (sql.includes('SELECT * FROM expenses WHERE id')) {
          return {
            get: () => ({
              id: 'exp-1',
              category: 'Electricity',
              title: 'Monthly Electric Bill',
              amount: 25000,
              payment_method: 'Cash',
              expense_date: '2026-09-04',
              created_at: new Date().toISOString(),
            }),
          };
        }
        if (sql.includes('SELECT * FROM expenses')) {
          return {
            all: () => [
              {
                id: 'exp-1',
                category: 'Electricity',
                title: 'Monthly Electric Bill',
                amount: 25000,
                payment_method: 'Cash',
                expense_date: '2026-09-04',
                created_at: new Date().toISOString(),
              },
              {
                id: 'exp-2',
                category: 'Ice & Cooling',
                title: '10 Ice Blocks',
                amount: 15000,
                payment_method: 'Cash',
                expense_date: '2026-09-04',
                created_at: new Date().toISOString(),
              },
            ],
          };
        }
        if (sql.includes('SELECT COALESCE(SUM(amount), 0) as total FROM expenses')) {
          return {
            get: () => ({ total: 40000 }),
          };
        }
        if (sql.includes('SELECT category, SUM(amount) as total')) {
          return {
            all: () => [
              { category: 'Electricity', total: 25000, count: 1 },
              { category: 'Ice & Cooling', total: 15000, count: 1 },
            ],
          };
        }
        if (sql.includes('SELECT * FROM sales_orders WHERE id')) {
          return {
            get: (id: string) => salesMap.get(id),
          };
        }
        return { get: () => undefined, all: () => [], run: vi.fn() };
      },
      transaction: (fn: any) => fn,
    };

    salesService = new POSSalesService(mockDb as unknown as Database.Database);
    expenseService = new ExpenseService(mockDb as unknown as Database.Database);
  });

  it('should handle On-Credit (Borrow) sale with 0 upfront payment as Unpaid debt', () => {
    const res = salesService.processCheckout(
      {
        orderDiscount: 0,
        amountTendered: 0,
        customerName: 'Ousmane Sow',
        customerPhone: '0688776655',
        dueDate: '2026-09-15',
        notes: 'Will pay next Friday',
        items: [
          {
            productId: 'fish-salmon',
            unitId: 'Kg',
            quantity: 2,
            unitPrice: 6500,
            discount: 0,
            taxRate: 0,
          },
        ],
        payments: [{ paymentMethod: 'Borrow', amount: 13000 }],
      },
      'cashier-1',
    );

    expect(res.grand_total).toBe(13000);
    expect(res.paid_amount).toBe(0);
    expect(res.payment_status).toBe('Unpaid');
    expect(res.customer_name).toBe('Ousmane Sow');
  });

  it('should handle Partial Down Payment with remaining balance as Partially paid', () => {
    const res = salesService.processCheckout(
      {
        orderDiscount: 0,
        amountTendered: 5000,
        customerName: 'Fatou Ndiaye',
        items: [
          {
            productId: 'fish-salmon',
            unitId: 'Kg',
            quantity: 2,
            unitPrice: 6500,
            discount: 0,
            taxRate: 0,
          },
        ],
        payments: [
          { paymentMethod: 'Cash', amount: 5000 },
          { paymentMethod: 'Borrow', amount: 8000 },
        ],
      },
      'cashier-1',
    );

    expect(res.grand_total).toBe(13000);
    expect(res.paid_amount).toBe(5000);
    expect(res.payment_status).toBe('Partially paid');
    expect(res.customer_name).toBe('Fatou Ndiaye');
  });

  it('should settle customer debt and update paid amount', () => {
    const updated = salesService.settleDebt('sale-borrow-1', 10000, 'Cash', 'cashier-1', 'Cleared balance');
    expect(updated.paid_amount).toBe(13000);
    expect(updated.payment_status).toBe('Paid');
  });

  it('should create and summarize store operating expenses', () => {
    const exp = expenseService.createExpense({
      category: 'Electricity',
      title: 'Monthly Electric Bill',
      amount: 25000,
      paymentMethod: 'Cash',
      expenseDate: '2026-09-04',
    });

    expect(exp.category).toBe('Electricity');
    expect(exp.amount).toBe(25000);

    const summary = expenseService.getSummary();
    expect(summary.total).toBe(40000);
    expect(summary.byCategory.length).toBe(2);
  });
});
