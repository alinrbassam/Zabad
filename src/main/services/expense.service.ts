import Database from 'better-sqlite3';
import { ExpenseRepository } from '../database/repositories/expense.repository';
import { AuditRepository } from '../database/repositories/audit.repository';
import { ExpenseEntity } from '../../shared/types';
import { ExpenseInput } from '../../shared/validation';
import { logger } from './logger.service';

export class ExpenseService {
  private repo: ExpenseRepository;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.repo = new ExpenseRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  public createExpense(input: ExpenseInput, userId?: string): ExpenseEntity {
    logger.info('ExpenseService', `Creating expense: ${input.title} - ${input.amount} FCFA`);
    const expense = this.repo.create(input, userId);

    try {
      this.auditRepo.logAction({
        user_id: userId,
        action: 'EXPENSE_CREATED',
        module: 'Expenses',
        details: `Created ${expense.category} expense: ${expense.title} (${expense.amount} FCFA)`,
      });
    } catch {
      // audit failure shouldn't block creation
    }

    return expense;
  }

  public listExpenses(options?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    limit?: number;
  }): ExpenseEntity[] {
    return this.repo.list(options);
  }

  public deleteExpense(id: string, userId?: string): boolean {
    const existing = this.repo.findById(id);
    if (!existing) return false;

    const ok = this.repo.delete(id);
    if (ok) {
      try {
        this.auditRepo.logAction({
          user_id: userId,
          action: 'EXPENSE_DELETED',
          module: 'Expenses',
          details: `Deleted ${existing.category} expense: ${existing.title} (${existing.amount} FCFA)`,
        });
      } catch {
        // ignore
      }
    }
    return ok;
  }

  public getSummary(startDate?: string, endDate?: string) {
    const total = this.repo.getTotalExpenses(startDate, endDate);
    const byCategory = this.repo.getCategorySummary(startDate, endDate);
    return {
      total,
      byCategory,
    };
  }
}
