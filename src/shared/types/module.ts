import React from 'react';

export interface SidebarItem {
  id: string;
  labelKey: string;
  icon: string;
  path: string;
  order: number;
  requiredPermission?: string;
}

export interface RouteDefinition {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  requiredPermission?: string;
}

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
