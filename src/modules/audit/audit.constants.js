export const auditActionOptions = Object.freeze(
  [
    'AUTH.LOGIN_SUCCEEDED',
    'AUTH.LOGIN_FAILED',
    'AUTH.TOKEN_REFRESHED',
    'AUTH.LOGOUT',
    'AUTH.LOGOUT_ALL',
    'USER.CREATED',
    'USER.UPDATED',
    'USER.STATUS_CHANGED',
    'USER.ROLES_CHANGED',
    'ROLE.CREATED',
    'ROLE.UPDATED',
    'ROLE.DELETED',
    'ROLE.PERMISSIONS_CHANGED',
    'SESSION.REVOKED',
  ].map((value) => Object.freeze({ value, label: value })),
);

export const resourceTypeOptions = Object.freeze(
  ['user', 'role', 'auth_session'].map((value) =>
    Object.freeze({ value, label: value }),
  ),
);
