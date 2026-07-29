import Database from 'better-sqlite3';
import { SupplierRepository } from '../database/repositories/supplier.repository';
import { SupplierInput } from '@shared/validation';
import { SupplierEntity } from '@shared/types';

export class SupplierService {
  private supplierRepo: SupplierRepository;

  constructor(db: Database.Database) {
    this.supplierRepo = new SupplierRepository(db);
  }

  public getAllSuppliers(): SupplierEntity[] {
    return this.supplierRepo.findAll();
  }

  public createSupplier(input: SupplierInput): SupplierEntity {
    return this.supplierRepo.createSupplier({
      code: input.code,
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      secondary_phone: input.secondaryPhone,
      email: input.email,
      address: input.address,
      city: input.city,
      country: input.country,
      tax_number: input.taxNumber,
      website: input.website,
      notes: input.notes,
      is_active: input.isActive ? 1 : 0,
    });
  }

  public updateSupplier(input: Partial<SupplierInput> & { id: string }): SupplierEntity {
    return this.supplierRepo.updateSupplier({
      id: input.id,
      code: input.code,
      name: input.name,
      contact_person: input.contactPerson,
      phone: input.phone,
      secondary_phone: input.secondaryPhone,
      email: input.email,
      address: input.address,
      city: input.city,
      country: input.country,
      tax_number: input.taxNumber,
      website: input.website,
      notes: input.notes,
      is_active: input.isActive !== undefined ? (input.isActive ? 1 : 0) : undefined,
    });
  }
}
