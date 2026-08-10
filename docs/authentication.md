# Autenticación del frontend

## Modelo de sesión

El frontend usa dos credenciales con responsabilidades diferentes:

- El access token se conserva únicamente en memoria mediante
  `access-token-store.js`.
- El refresh token permanece en una cookie HttpOnly creada, rotada y eliminada
  por el backend.

El contexto de React no expone el access token y ningún flujo lo persiste en
`localStorage`, `sessionStorage` ni IndexedDB.

## Recuperación inicial

`AuthProvider` inicia con `status: 'loading'` y ejecuta:

```text
POST /auth/refresh
  ↓
GET /auth/me + GET /auth/permissions
  ↓
authenticated
```

`SESSION_EXPIRED`, `SESSION_REVOKED` y `AUTHENTICATION_REQUIRED` representan la
ausencia normal de una sesión recuperable. Un fallo de red o contrato también
termina como usuario anónimo, pero se conserva en `initializationError` para que
el login pueda informar que la recuperación no fue posible.

La inicialización se comparte durante el ciclo estricto de desarrollo de React;
no se lanzan refresh duplicados por el montaje de `StrictMode`.

## Estado público

`useAuth()` expone:

```js
{
  user,
  permissions,
  status: 'loading' | 'authenticated' | 'unauthenticated',
  initializationError,
  login,
  logout,
  logoutAll,
  hasPermission
}
```

`hasPermission` sirve para adaptar la interfaz. El backend continúa siendo la
autoridad definitiva.

## Login

El formulario acepta `email` y `password`, exactamente como el backend. React
Hook Form administra interacción y Zod aplica los mismos límites públicos.

Después de un login exitoso:

1. Se guarda el access token en memoria.
2. Se consultan los permisos efectivos.
3. Se limpia cualquier caché perteneciente a una sesión anterior.
4. Se publica el usuario autenticado.
5. `RequireGuest` regresa a la ruta privada solicitada o a `/`.

Si no se pueden obtener los permisos, el login no queda parcialmente activo y
el token se elimina.

Los errores se presentan mediante códigos públicos. `INVALID_CREDENTIALS` usa un
mensaje único que no revela si falló el correo, la contraseña o el estado de la
cuenta.

No existen enlaces, formularios ni rutas de registro público.

## Logout y expiración

Logout intenta revocar la sesión en el backend y siempre limpia localmente:

- Access token.
- Usuario y permisos.
- Consultas activas.
- Caché completa de TanStack Query.

El cliente HTTP registra un callback del provider. Cuando un refresh automático
falla, ejecuta la misma limpieza una sola vez y las rutas privadas reaccionan al
nuevo estado anónimo.

## Guards

- `RequireAuth` muestra un estado de carga mientras se recupera la sesión y
  redirige usuarios anónimos a `/login` conservando la ubicación original.
- `RequireGuest` impide volver al login con una sesión activa y recupera la
  ubicación privada solicitada.
- Las rutas desconocidas, incluida `/register`, terminan en 404.

Los guards de permisos se incorporarán en la siguiente fase de autorización.

## Contratos validados

Las respuestas de login, identidad y permisos se validan con Zod antes de entrar
al estado global. Un payload fuera del contrato produce `INVALID_API_RESPONSE`.

El usuario autenticado esperado es:

```js
{
  id: number,
  email: string,
  displayName: string,
  status: 'ACTIVE'
}
```
