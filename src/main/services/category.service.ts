import Database from 'better-sqlite3';
import { CategoryRepository } from '../database/repositories/category.repository';
import { CategoryInput } from '@shared/validation';
import { CategoryEntity } from '@shared/types';

export class CategoryService {
  private categoryRepo: CategoryRepository;
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.categoryRepo = new CategoryRepository(db);
  }

  public getAllCategories(): CategoryEntity[] {
    return this.categoryRepo.findAll();
  }

  public createCategory(input: CategoryInput): CategoryEntity {
    return this.categoryRepo.createCategory({
      code: input.code,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      description: input.description,
      parent_id: input.parentId,
      display_order: input.displayOrder,
      icon: input.icon,
      is_active: input.isActive ? 1 : 0,
    });
  }

  public updateCategory(input: Partial<CategoryInput> & { id: string }): CategoryEntity {
    return this.categoryRepo.updateCategory({
      id: input.id,
      code: input.code,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      description: input.description,
      parent_id: input.parentId,
      display_order: input.displayOrder,
      icon: input.icon,
      is_active: input.isActive !== undefined ? (input.isActive ? 1 : 0) : undefined,
    });
  }

  public deleteCategory(id: string, forceDeleteProducts = false): void {
    const count = this.categoryRepo.countProductsInCategory(id);
    if (count > 0) {
      if (!forceDeleteProducts) {
        throw new Error(
          `Cannot delete category because it contains ${count} active product(s). Please delete or reassign products first.`,
        );
      }
      this.db
        .prepare(
          `UPDATE products SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE category_id = ? OR subcategory_id = ?`,
        )
        .run(id, id);
    }
    this.categoryRepo.softDelete(id);
  }
}
