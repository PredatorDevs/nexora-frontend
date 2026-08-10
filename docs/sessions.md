# Administración de sesiones

La fase 10 incorpora un módulo administrativo para inspeccionar y revocar
sesiones emitidas por el backend. Nunca recibe ni muestra hashes de refresh
tokens.

## Contrato consumido

| Operación       | Endpoint               | Permiso requerido |
| --------------- | ---------------------- | ----------------- |
| Listar sesiones | `GET /sessions`        | `sessions.read`   |
| Revocar sesión  | `DELETE /sessions/:id` | `sessions.revoke` |

El listado acepta `page`, `pageSize`, `sortBy`, `sortOrder`, `userId` y
`activeOnly`. El backend no implementa búsqueda textual ni un endpoint de
detalle; el panel de detalle utiliza la representación completa recibida en el
listado.

## Estados

La interfaz deriva el estado sin modificar los datos:

- `REVOKED`: existe `revokedAt`.
- `EXPIRED`: no está revocada y `expiresAt` ya pasó.
- `ACTIVE`: no está revocada y todavía no expiró.

Solo una sesión activa presenta la acción de revocación habilitada. La operación
requiere confirmación, se audita en el backend y se refleja invalidando todos los
listados de sesiones almacenados en TanStack Query.

## Seguridad

El frontend oculta la acción sin `sessions.revoke` y protege la ruta con
`sessions.read`. El backend continúa siendo la autoridad definitiva. Revocar la
sesión que se está utilizando puede provocar el cierre al intentar renovar el
access token, que es el comportamiento de seguridad esperado.
