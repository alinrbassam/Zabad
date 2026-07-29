# Coding Standards & Clean Architecture Guidelines

## Architecture Rules
1. **SOLID Principles**:
   - Single Responsibility: Each service/component handles one task.
   - Open/Closed: Business modules extend system features via `RMSModule` contract without editing main renderer files.
   - Interface Segregation: Services expose narrow interfaces (`IBackupService`, `IPrintingService`, etc.).
   - Dependency Inversion: Main process services depend on abstract service interfaces.
2. **Zero Any Policy**: Strict TypeScript typing across entire codebase.
3. **No Inline SQL**: All SQL statements reside inside repository classes (`src/main/database/repositories/`).
4. **No Direct Node Access**: React components interact only through safe IPC `window.api`.
