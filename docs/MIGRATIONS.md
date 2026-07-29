# Database Migration Plan & Execution Guide

## DatabaseMigrator Engine
Migrations are stored as versioned objects in `src/main/database/migrator.ts`.

```ts
export interface Migration {
  version: number;
  name: string;
  sql: string;
}
```

## Creating a Migration
1. Assign an incremental integer `version`.
2. Provide a descriptive `name` (e.g., `create_products_table`).
3. Add raw SQL statements inside `sql`.
4. Wrap table creations with `CREATE TABLE IF NOT EXISTS` and include standard fields (`id`, `created_at`, `updated_at`, `deleted_at`).
5. Execute `migrator.runMigrations([...])` during main process app initialization.
