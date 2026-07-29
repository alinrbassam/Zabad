import { RMSModule, SidebarItem, RouteDefinition } from '@shared/types/module';

export class ModuleRegistry {
  private static instance: ModuleRegistry;
  private modules: Map<string, RMSModule> = new Map();

  private constructor() {}

  public static getInstance(): ModuleRegistry {
    if (!ModuleRegistry.instance) {
      ModuleRegistry.instance = new ModuleRegistry();
    }
    return ModuleRegistry.instance;
  }

  public registerModule(module: RMSModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with ID ${module.id} is already registered.`);
    }
    this.modules.set(module.id, module);
    if (module.onInit) {
      module.onInit();
    }
  }

  public getModules(): RMSModule[] {
    return Array.from(this.modules.values());
  }

  public getModule(id: string): RMSModule | undefined {
    return this.modules.get(id);
  }

  public getAllRoutes(): RouteDefinition[] {
    const routes: RouteDefinition[] = [];
    for (const mod of this.modules.values()) {
      routes.push(...mod.routes);
    }
    return routes;
  }

  public getAllSidebarItems(): SidebarItem[] {
    const items: SidebarItem[] = [];
    for (const mod of this.modules.values()) {
      items.push(...mod.sidebarItems);
    }
    return items.sort((a, b) => a.order - b.order);
  }
}

export const moduleRegistry = ModuleRegistry.getInstance();
