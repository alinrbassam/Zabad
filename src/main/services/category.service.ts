import Database from 'better-sqlite3';
import { CategoryRepository } from '../database/repositories/category.repository';
import { CategoryInput } from '@shared/validation';
import { CategoryEntity } from '@shared/types';

export class CategoryService {
  private categoryRepo: CategoryRepository;

  constructor(db: Database.Database) {
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

  public deleteCategory(id: string): void {
    const count = this.categoryRepo.countProductsInCategory(id);
    if (count > 0) {
      throw new Error(
        `Cannot delete category because it contains ${count} active product(s). Please reassign products first.`,
      );
    }
    this.categoryRepo.softDelete(id);
  }
}
