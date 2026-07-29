import Database from 'better-sqlite3';
import { UnitRepository } from '../database/repositories/unit.repository';
import { UnitInput } from '@shared/validation';
import { UnitEntity } from '@shared/types';

export class UnitService {
  private unitRepo: UnitRepository;

  constructor(db: Database.Database) {
    this.unitRepo = new UnitRepository(db);
  }

  public getAllUnits(): UnitEntity[] {
    return this.unitRepo.findAll();
  }

  public createUnit(input: UnitInput): UnitEntity {
    return this.unitRepo.createUnit({
      code: input.code,
      name_en: input.nameEn,
      name_ar: input.nameAr,
      symbol: input.symbol,
      unit_category: input.unitCategory,
      allow_decimals: input.allowDecimals ? 1 : 0,
      decimal_precision: input.decimalPrecision,
      is_active: input.isActive ? 1 : 0,
    });
  }
}
