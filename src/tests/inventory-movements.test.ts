import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { InventoryRepository } from '../main/database/repositories/inventory.repository';

interface MockBalance {
  product_id: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  available_quantity: number;
  damaged_quantity: number;
  expired_quantity: number;
  updated_at: string;
}

interface MockMovement {
  id: string;
  product_id: string;
  batch_id?: string;
  movement_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_id: string;
  cost_at_time: number;
  created_at: string;
}

describe('Inventory Movement Ledger & Balance Engine', () => {
  let mockDb: Record<string, unknown>;
  let inventoryRepo: InventoryRepository;
  let movements: MockMovement[];
  let balances: Record<string, MockBalance>;

  beforeEach(() => {
    movements = [];
    balances = {};

    mockDb = {
      prepare: (sql: string) => {
        if (sql.includes('SELECT * FROM inventory_balances WHERE product_id')) {
          return {
            get: (id: string) => balances[id] || undefined,
          };
        }
        if (sql.includes('INSERT OR IGNORE INTO inventory_balances')) {
          return {
            run: (id: string) => {
              if (!balances[id]) {
                balances[id] = {
                  product_id: id,
                  quantity_on_hand: 0,
                  reserved_quantity: 0,
                  available_quantity: 0,
                  damaged_quantity: 0,
                  expired_quantity: 0,
                  updated_at: new Date().toISOString(),
                };
              }
            },
          };
        }
        if (sql.includes('INSERT INTO inventory_movements')) {
          return {
            run: (
              id: string,
              productId: string,
              batchId: string,
              movementType: string,
              change: number,
              before: number,
              after: number,
              unitId: string,
              cost: number,
            ) => {
              movements.push({
                id,
                product_id: productId,
                batch_id: batchId,
                movement_type: movementType,
                quantity_change: change,
                quantity_before: before,
                quantity_after: after,
                unit_id: unitId,
                cost_at_time: cost,
                created_at: new Date().toISOString(),
              });
            },
          };
        }
        if (sql.includes('UPDATE inventory_balances SET')) {
          return {
            run: (
              qtyAfter: number,
              availAfter: number,
              damagedDelta: number,
              expiredDelta: number,
              _now: string,
              productId: string,
            ) => {
              if (balances[productId]) {
                balances[productId].quantity_on_hand = qtyAfter;
                balances[productId].available_quantity = availAfter;
                balances[productId].damaged_quantity += damagedDelta;
                balances[productId].expired_quantity += expiredDelta;
              }
            },
          };
        }
        if (sql.includes('SELECT product_id, SUM(quantity_change)')) {
          return {
            run: () => {
              const totals: Record<string, number> = {};
              movements.forEach((m) => {
                totals[m.product_id] = (totals[m.product_id] || 0) + m.quantity_change;
              });
              Object.keys(totals).forEach((pid) => {
                balances[pid] = {
                  product_id: pid,
                  quantity_on_hand: totals[pid],
                  reserved_quantity: 0,
                  available_quantity: totals[pid],
                  damaged_quantity: 0,
                  expired_quantity: 0,
                  updated_at: new Date().toISOString(),
                };
              });
            },
          };
        }
        return {
          get: () => undefined,
          all: () => movements,
          run: vi.fn(),
        };
      },
      transaction: (fn: () => void) => () => fn(),
    };

    inventoryRepo = new InventoryRepository(mockDb as unknown as Database.Database);
  });

  it('should calculate initial stock balance as 0', () => {
    const bal = inventoryRepo.getBalance('p-100');
    expect(bal.quantity_on_hand).toBe(0);
    expect(bal.available_quantity).toBe(0);
  });

  it('should update stock balance atomically upon movement recording', () => {
    const m1 = inventoryRepo.recordStockMovement({
      productId: 'p-100',
      movementType: 'Opening stock',
      quantityChange: 50,
      unitId: 'u-1',
      costAtTime: 10,
    });

    expect(m1.quantity_before).toBe(0);
    expect(m1.quantity_after).toBe(50);

    const bal1 = inventoryRepo.getBalance('p-100');
    expect(bal1.quantity_on_hand).toBe(50);

    const m2 = inventoryRepo.recordStockMovement({
      productId: 'p-100',
      movementType: 'Manual deduction',
      quantityChange: -15,
      unitId: 'u-1',
    });

    expect(m2.quantity_before).toBe(50);
    expect(m2.quantity_after).toBe(35);

    const bal2 = inventoryRepo.getBalance('p-100');
    expect(bal2.quantity_on_hand).toBe(35);
  });

  it('should reconcile balances accurately from ledger records', () => {
    inventoryRepo.recordStockMovement({
      productId: 'p-200',
      movementType: 'Opening stock',
      quantityChange: 100,
      unitId: 'u-1',
    });
    inventoryRepo.recordStockMovement({
      productId: 'p-200',
      movementType: 'Manual deduction',
      quantityChange: -25,
      unitId: 'u-1',
    });

    inventoryRepo.reconcileBalancesFromLedger();

    const bal = inventoryRepo.getBalance('p-200');
    expect(bal.quantity_on_hand).toBe(75);
  });
});
