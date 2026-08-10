# Módulo de usuarios

La fase 8 incorpora la administración de usuarios como un módulo vertical y
reutilizable en `src/modules/users`. Incluye listado paginado, búsqueda,
ordenamiento, detalle, alta, edición, cambio de estado y reemplazo de roles.

## Contrato consumido

| Operación              | Endpoint                  | Permiso               |
| ---------------------- | ------------------------- | --------------------- |
| Listar                 | `GET /users`              | `users.read`          |
| Consultar              | `GET /users/:id`          | `users.read`          |
| Crear                  | `POST /users`             | `users.create`        |
| Editar identidad       | `PUT /users/:id`          | `users.update`        |
| Cambiar estado         | `PATCH /users/:id/status` | `users.change_status` |
| Reemplazar roles       | `PUT /users/:id/roles`    | `users.assign_roles`  |
| Cargar opciones de rol | `GET /roles`              | `roles.read`          |

Las respuestas se validan con Zod antes de llegar a la interfaz. El listado
acepta `page`, `pageSize`, `search`, `sortBy` y `sortOrder`, y conserva esos
filtros en la URL para que la vista pueda compartirse o restaurarse.

## Reglas de interfaz

- La creación solicita nombre, correo y una contraseña de al menos 12
  caracteres. La confirmación se valida en el navegador y no se envía al API.
- La edición modifica únicamente `displayName` y `email`.
- Los roles se reemplazan como conjunto completo y la interfaz exige tanto
  `users.assign_roles` como `roles.read` para mostrar el control.
- El usuario autenticado no puede cambiar su propio estado ni sus propios
  roles. La interfaz lo evita y el backend conserva la validación definitiva.
- Desactivar un usuario requiere confirmación porque revoca sus sesiones
  activas.

## Extensión del boilerplate

Para adaptar el módulo a otro backend, los puntos principales son
`users.api.js`, `schemas/user.schemas.js` y `users.routes.jsx`. Las páginas no
dependen de Axios directamente: consumen hooks de TanStack Query que centralizan
la invalidación de listados y detalles después de cada mutación.
