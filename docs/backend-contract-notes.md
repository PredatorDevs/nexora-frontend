# Notas del contrato con el backend

## Propósito

Estas decisiones se verificaron directamente contra
`../nexora-backend`. No reemplazan una futura especificación
OpenAPI; son la fuente de trabajo hasta documentar cada endpoint.

## Convenciones confirmadas

- Base: `/api/v1`.
- Login por email; no existe username.
- Access token JSON, Bearer y solo en memoria.
- Refresh token en cookie HttpOnly administrada por el backend.
- Operaciones con cookies de autenticación requieren origen confiable.
- Listados: `page`, `pageSize`, `search`, `sortBy`, `sortOrder`, según endpoint.
- `page` inicia en 1; `pageSize` es 20 por defecto y máximo 100.
- `sortOrder`: `asc` o `desc`.
- Paginación: `{ page, pageSize, total, totalPages }` en `meta.pagination`.
- IDs administrativos: enteros positivos; sesiones: UUID.
- El frontend tratará las fechas JSON como strings hasta presentarlas.

## Autenticación confirmada

| Método | Ruta                | Entrada o resultado relevante                   |
| ------ | ------------------- | ----------------------------------------------- |
| POST   | `/auth/login`       | `{ email, password }` → `{ accessToken, user }` |
| POST   | `/auth/refresh`     | cookie → `{ accessToken }`                      |
| POST   | `/auth/logout`      | revoca sesión actual; `data: null`              |
| POST   | `/auth/logout-all`  | revoca todas; `data: null`                      |
| GET    | `/auth/me`          | usuario autenticado                             |
| GET    | `/auth/permissions` | `{ permissions: string[] }`                     |

Las rutas son relativas a `/api/v1`.

## Permisos confirmados

```text
users.read
users.create
users.update
users.change_status
users.assign_roles
roles.read
roles.create
roles.update
roles.delete
roles.assign_permissions
permissions.read
audit.read
sessions.read
sessions.revoke
```

## Diferencias con el plan conceptual

El frontend respetará el backend existente:

- El usuario usa `displayName`, no `name` más `username`.
- Crear usuario acepta `email`, `password` y `displayName`.
- El backend crea el usuario `ACTIVE`; el estado cambia en otra operación.
- Los roles se asignan después con `{ roleIds }`.
- No existen actualmente `mustChangePassword` ni un endpoint administrativo de
  reinicio de contraseña.
- No existe registro público.

No se inventarán esos campos en la SPA. Ampliarlos requiere modificar y probar
primero el contrato del backend.

## Fuente de verdad

Ante discrepancias se aplicará este orden:

1. Pruebas de integración y E2E del backend.
2. Schemas, rutas, controladores y repositorios del backend.
3. Documentación del backend.
4. Plan conceptual del frontend.

Los repositorios permanecerán desacoplados: el frontend no importará código del
backend. MSW copiará únicamente su comportamiento público.

## Pendiente para las siguientes fases

- Documentar recursos JSON exactos por endpoint.
- Catalogar status HTTP y errores por operación.
- Crear fixtures y handlers MSW desde las pruebas reales.
- Registrar campos y allowlists de ordenamiento por listado.

## Detalles de validación confirmados

Los errores `VALIDATION_ERROR` utilizan status `400` y cada elemento de
`error.details` tiene esta forma:

```js
{
  location: 'body' | 'params' | 'query',
  path: 'email',
  message: 'Invalid email address',
  code: 'invalid_format'
}
```
