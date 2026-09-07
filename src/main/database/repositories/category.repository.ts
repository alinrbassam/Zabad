import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { CategoryEntity } from '@shared/types';

export class CategoryRepository extends BaseRepository<CategoryEntity> {
  constructor(db: Database.Database) {
    super(db, 'categories');
  }

  public createCategory(cat: Partial<CategoryEntity>): CategoryEntity {
    const id = cat.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO categories (id, code, name_en, name_ar, description, parent_id, display_order, icon, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      cat.code || null,
      cat.name_en,
      cat.name_ar,
      cat.description || null,
      cat.parent_id || null,
      cat.display_order || 0,
      cat.icon || null,
      cat.is_active ? 1 : 0,
      now,
      now,
    );

    return this.findById(id)!;
  }

  public updateCategory(cat: Partial<CategoryEntity> & { id: string }): CategoryEntity {
    const now = new Date().toISOString();
    const existing = this.findById(cat.id);
    if (!existing) throw new Error('Category not found');

    const stmt = this.db.prepare(`
      UPDATE categories SET
        code = ?, name_en = ?, name_ar = ?, description = ?, parent_id = ?,
        display_order = ?, icon = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      cat.code || existing.code || null,
      cat.name_en || existing.name_en,
      cat.name_ar || existing.name_ar,
      cat.description || existing.description || null,
      cat.parent_id !== undefined ? cat.parent_id : existing.parent_id,
      cat.display_order !== undefined ? cat.display_order : existing.display_order,
      cat.icon || existing.icon || null,
      cat.is_active !== undefined ? (cat.is_active ? 1 : 0) : existing.is_active,
      now,
      cat.id,
    );

    return this.findById(cat.id)!;
  }

  public countProductsInCategory(categoryId: string): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM products WHERE (category_id = ? OR subcategory_id = ?) AND (deleted_at IS NULL OR deleted_at = '')`,
    );
    const res = stmt.get(categoryId, categoryId) as { count: number };
    return res.count;
  }
}
