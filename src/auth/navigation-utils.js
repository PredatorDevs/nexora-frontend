import { hasPermission } from '@/auth/permission-utils.js';

export function filterNavigationItems(items, effectivePermissions) {
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    if (!item || item.enabled === false || item.available === false) return [];

    const children = filterNavigationItems(item.children, effectivePermissions);
    const allowed =
      !item.permission || hasPermission(effectivePermissions, item.permission);
    const hasVisibleChildren = children.length > 0;

    if (!allowed || (!item.path && !hasVisibleChildren)) return [];

    return [
      {
        ...item,
        ...(item.children ? { children } : {}),
      },
    ];
  });
}
