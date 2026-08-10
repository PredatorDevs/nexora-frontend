# Roles y permisos

La fase 9 incorpora dos módulos administrativos. Los roles agrupan capacidades
y tienen ciclo de vida propio; los permisos forman un catálogo de solo lectura
porque cada permiso representa una capacidad realmente implementada en el
backend.

## Contrato consumido

| Operación           | Endpoint                     | Permiso requerido          |
| ------------------- | ---------------------------- | -------------------------- |
| Listar roles        | `GET /roles`                 | `roles.read`               |
| Consultar rol       | `GET /roles/:id`             | `roles.read`               |
| Crear rol           | `POST /roles`                | `roles.create`             |
| Editar rol          | `PUT /roles/:id`             | `roles.update`             |
| Eliminar rol        | `DELETE /roles/:id`          | `roles.delete`             |
| Reemplazar permisos | `PUT /roles/:id/permissions` | `roles.assign_permissions` |
| Listar permisos     | `GET /permissions`           | `permissions.read`         |

## Reglas del dominio

- El código se normaliza a mayúsculas y solo se define al crear el rol.
- Un rol de sistema se identifica con `isSystem` y no puede eliminarse.
- Editar un rol solo modifica su nombre y descripción.
- La asignación envía `permissionCodes` y reemplaza el conjunto completo de
  permisos de manera transaccional.
- La matriz de edición requiere simultáneamente `roles.assign_permissions` y
  `permissions.read`. Sin ambos permisos, el detalle muestra únicamente las
  asignaciones actuales.
- Los permisos no se crean, editan ni eliminan desde el frontend.

## Estructura

`src/modules/roles` contiene páginas, formulario, matriz, hooks, schemas y
acceso al API. `src/modules/permissions` contiene el catálogo y sus consultas.
Ambos reutilizan el cliente HTTP, los guards RBAC y los componentes compartidos
del boilerplate.
