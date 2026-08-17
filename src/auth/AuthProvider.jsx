import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuthContext } from '@/auth/auth-context.js';
import { queryClient } from '@/app/query-client.js';
import { hasPermission as checkPermission } from '@/auth/permission-utils.js';
import { authService } from '@/modules/auth/auth.api.js';

const unauthenticatedState = Object.freeze({
  user: null,
  permissions: [],
  platformPermissions: [],
  companyPermissions: [],
  memberships: [],
  activeMembership: null,
  requiresCompanySelection: false,
  status: 'unauthenticated',
  initializationError: null,
});

const expectedSessionErrors = new Set([
  'AUTHENTICATION_REQUIRED',
  'SESSION_EXPIRED',
  'SESSION_REVOKED',
]);

export function AuthProvider({
  children,
  service = authService,
  queryClientInstance = queryClient,
}) {
  const [state, setState] = useState({
    ...unauthenticatedState,
    status: 'loading',
  });
  const mountedRef = useRef(false);
  const initializationPromiseRef = useRef(null);

  const clearPrivateState = useCallback(async () => {
    service.clearSession();
    await queryClientInstance.cancelQueries();
    queryClientInstance.clear();
    if (mountedRef.current) setState(unauthenticatedState);
  }, [queryClientInstance, service]);

  useEffect(() => {
    mountedRef.current = true;
    service.setSessionExpiredHandler(clearPrivateState);

    return () => {
      mountedRef.current = false;
      service.setSessionExpiredHandler(null);
    };
  }, [clearPrivateState, service]);

  useEffect(() => {
    if (!initializationPromiseRef.current) {
      initializationPromiseRef.current = service.recoverSession();
    }

    initializationPromiseRef.current.then(
      (session) => {
        if (!mountedRef.current) return;
        setState({
          ...session,
          status: 'authenticated',
          initializationError: null,
        });
      },
      (error) => {
        if (!mountedRef.current) return;
        service.clearSession();
        setState({
          ...unauthenticatedState,
          initializationError: expectedSessionErrors.has(error?.code)
            ? null
            : error,
        });
      },
    );
  }, [service]);

  const login = useCallback(
    async (credentials) => {
      const session = await service.login(credentials);
      await queryClientInstance.cancelQueries();
      queryClientInstance.clear();
      if (mountedRef.current) {
        setState({
          ...session,
          status: 'authenticated',
          initializationError: null,
        });
      }
      return session;
    },
    [queryClientInstance, service],
  );

  const logout = useCallback(async () => {
    try {
      await service.logout();
    } finally {
      await clearPrivateState();
    }
  }, [clearPrivateState, service]);

  const switchCompany = useCallback(
    async (companyId) => {
      const session = await service.switchCompany(companyId);
      await queryClientInstance.cancelQueries();
      queryClientInstance.clear();
      if (mountedRef.current)
        setState({
          ...session,
          status: 'authenticated',
          initializationError: null,
        });
      return session;
    },
    [queryClientInstance, service],
  );

  const switchPlatform = useCallback(async () => {
    const session = await service.switchPlatform();
    await queryClientInstance.cancelQueries();
    queryClientInstance.clear();
    if (mountedRef.current)
      setState({
        ...session,
        status: 'authenticated',
        initializationError: null,
      });
    return session;
  }, [queryClientInstance, service]);

  const refreshCompanyContext = useCallback(async () => {
    const session = await service.refreshCompanyContext();
    if (mountedRef.current) setState((current) => ({ ...current, ...session }));
    return session;
  }, [service]);

  const logoutAll = useCallback(async () => {
    try {
      await service.logoutAll();
    } finally {
      await clearPrivateState();
    }
  }, [clearPrivateState, service]);

  const updateProfile = useCallback(
    async (data) => {
      const user = await service.updateProfile(data);
      setState((current) => ({ ...current, user }));
      return user;
    },
    [service],
  );

  const changePassword = useCallback(
    async (data) => {
      const user = await service.changePassword(data);
      await queryClientInstance.cancelQueries();
      queryClientInstance.clear();
      setState((current) => ({ ...current, user }));
      return user;
    },
    [queryClientInstance, service],
  );

  const hasPermission = useCallback(
    (permission) => checkPermission(state.permissions, permission),
    [state.permissions],
  );

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      logoutAll,
      updateProfile,
      changePassword,
      hasPermission,
      switchCompany,
      switchPlatform,
      refreshCompanyContext,
    }),
    [
      changePassword,
      hasPermission,
      login,
      logout,
      logoutAll,
      state,
      switchCompany,
      switchPlatform,
      refreshCompanyContext,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
