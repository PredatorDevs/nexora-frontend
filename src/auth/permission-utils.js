const permissionCodePattern = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export function isPermissionCode(value) {
  return typeof value === 'string' && permissionCodePattern.test(value);
}

function permissionSet(effectivePermissions) {
  if (effectivePermissions instanceof Set) return effectivePermissions;
  return new Set(
    Array.isArray(effectivePermissions) ? effectivePermissions : [],
  );
}

export function hasPermission(effectivePermissions, permission) {
  return (
    isPermissionCode(permission) &&
    permissionSet(effectivePermissions).has(permission)
  );
}

export function hasAnyPermission(effectivePermissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
    return false;
  }

  const effective = permissionSet(effectivePermissions);
  return requiredPermissions.some(
    (permission) => isPermissionCode(permission) && effective.has(permission),
  );
}

export function hasAllPermissions(effectivePermissions, requiredPermissions) {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) {
    return false;
  }

  const effective = permissionSet(effectivePermissions);
  return requiredPermissions.every(
    (permission) => isPermissionCode(permission) && effective.has(permission),
  );
}

export function matchesPermissionRequirement(
  effectivePermissions,
  { permission, anyOf, allOf } = {},
) {
  const requirements = [];

  if (permission !== undefined) {
    requirements.push(hasPermission(effectivePermissions, permission));
  }
  if (anyOf !== undefined) {
    requirements.push(hasAnyPermission(effectivePermissions, anyOf));
  }
  if (allOf !== undefined) {
    requirements.push(hasAllPermissions(effectivePermissions, allOf));
  }

  return requirements.length > 0 && requirements.every(Boolean);
}
