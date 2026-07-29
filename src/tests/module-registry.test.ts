import { describe, it, expect } from 'vitest';
import { ModuleRegistry } from '../modules/registry';
import { RMSModule } from '@shared/types/module';

describe('ModuleRegistry', () => {
  it('should register a module and retrieve its routes and sidebar items', () => {
    const registry = ModuleRegistry.getInstance();

    const sampleModule: RMSModule = {
      id: 'test-module',
      name: 'Test Module',
      version: '1.0.0',
      description: 'Module for testing registry',
      routes: [
        {
          path: '/test',
          component: () => null,
        },
      ],
      sidebarItems: [
        {
          id: 'test-item',
          labelKey: 'test',
          icon: 'Package',
          path: '/test',
          order: 1,
        },
      ],
      permissions: ['test.view'],
    };

    registry.registerModule(sampleModule);

    const registered = registry.getModule('test-module');
    expect(registered).toEqual(sampleModule);

    const routes = registry.getAllRoutes();
    expect(routes.some((r) => r.path === '/test')).toBe(true);

    const items = registry.getAllSidebarItems();
    expect(items.some((i) => i.id === 'test-item')).toBe(true);
  });
});
