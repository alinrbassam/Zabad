import Database from 'better-sqlite3';
import { BrandRepository } from '../database/repositories/brand.repository';
import { BrandInput } from '@shared/validation';
import { BrandEntity } from '@shared/types';

export class BrandService {
  private brandRepo: BrandRepository;

  constructor(db: Database.Database) {
    this.brandRepo = new BrandRepository(db);
  }

  public getAllBrands(): BrandEntity[] {
    return this.brandRepo.findAll();
  }

  public createBrand(input: BrandInput): BrandEntity {
    return this.brandRepo.createBrand({
      name_en: input.nameEn,
      name_ar: input.nameAr,
      description: input.description,
      logo: input.logo,
      country_of_origin: input.countryOfOrigin,
      is_active: input.isActive ? 1 : 0,
      notes: input.notes,
    });
  }

  public updateBrand(input: Partial<BrandInput> & { id: string }): BrandEntity {
    return this.brandRepo.updateBrand({
      id: input.id,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      description: input.description,
      logo: input.logo,
      country_of_origin: input.countryOfOrigin,
      is_active: input.isActive !== undefined ? (input.isActive ? 1 : 0) : undefined,
      notes: input.notes,
    });
  }
}
