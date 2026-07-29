# Module Loader Architecture & Development Guide

## Overview
RMS uses a dynamic module architecture where business verticals (Inventory, POS, Reports, Pharmacy, Restaurant) are completely decoupled from core framework code.

## RMSModule Contract
```ts
export interface RMSModule {
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  routes: RouteDefinition[];
  sidebarItems: SidebarItem[];
  permissions: string[];
  translations?: Record<string, Record<string, unknown>>;
  onInit?: () => Promise<void> | void;
}
```

## How to Add a New Module
1. Create directory `src/modules/<module-name>/`.
2. Define `index.ts` exporting an instance of `RMSModule`.
3. Create module components in `src/modules/<module-name>/components/`.
4. Create module pages in `src/modules/<module-name>/pages/`.
5. Register the module in `src/renderer/App.tsx`:
   ```ts
   import { MyModule } from '@modules/my-module';
   moduleRegistry.registerModule(MyModule);
   ```

## How to Add a Page
Define a standard React component inside `pages/` and add its route path to the module's `routes` array.

## How to Add Translations
Include key-value entries in `translations.en` and `translations.ar` within the module contract.
