# Strongly Typed IPC Architecture

## Principles
1. **Zero Raw SQL Exposure**: React components invoke typed service methods via `window.api`.
2. **Double Validation**:
   - Client-side validation using React Hook Form & Zod schemas.
   - Server-side (Main Process) validation using Zod schemas inside IPC handlers.
3. **Structured Response Payload**:
   Every IPC handler returns an `ApiResponse<T>` object:
   ```ts
   export interface ApiResponse<T = unknown> {
     success: boolean;
     data?: T;
     error?: {
       code: string;
       message: string;
       details?: unknown;
     };
   }
   ```

## Channel Declarations (`IPC_CHANNELS`)
- `config:get` - Retrieves current app configuration.
- `config:update` - Validates and persists configuration updates.
- `log:write` - Logs structured messages to rotating log file.
- `db:query` / `db:execute` - Internal repository dispatchers.
