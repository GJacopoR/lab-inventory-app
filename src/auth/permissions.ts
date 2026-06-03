/**
 * Simple role‑based permission map for the demo app.
 * Permissions are strings that UI components can check via `hasPermission`.
 */
export type Permission =
  | 'inventory:create'
  | 'inventory:update'
  | 'inventory:delete'
  | 'inventory:print'
  | 'recipes:create'
  | 'recipes:update'
  | 'recipes:delete'
  | 'labels:print'
  | 'documents:upload';

export const rolePermissions: Record<string, Permission[]> = {
  admin: [
    'inventory:create',
    'inventory:update',
    'inventory:delete',
    'inventory:print',
    'recipes:create',
    'recipes:update',
    'recipes:delete',
    'labels:print',
    'documents:upload',
  ],
  operatore: [
    'inventory:update',
    'inventory:print',
    'recipes:create',
    'recipes:update',
    'labels:print',
    'documents:upload',
  ],
  lettura: ['inventory:print', 'labels:print', 'documents:upload'],
};
