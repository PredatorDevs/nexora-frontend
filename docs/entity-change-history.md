# Historial de cambios

La ruta `/audit/entity-changes` permite a usuarios con `audit.read` consultar
cambios persistidos en entidades críticas. El módulo depende del feature flag
`VITE_ENABLE_AUDIT_MODULE`.

## Estrategia de carga

El listado consulta `GET /api/v1/entity-changes` y recibe únicamente:

- identidad y tipo de entidad;
- operación, actor y fecha;
- campos modificados;
- request ID y metadatos pequeños.

Los JSON `oldValues` y `newValues` no forman parte del listado. Al abrir una fila,
el drawer solicita `GET /api/v1/entity-changes/:id`. En actualizaciones contienen
únicamente las propiedades afectadas; creaciones y eliminaciones conservan el
snapshot permitido completo. TanStack Query conserva:

- listados durante 30 segundos;
- detalles durante 5 minutos.

La paginación permite hasta 50 filas por solicitud. La pantalla inicia con los
últimos siete días y conserva filtros y paginación en la URL.

## Filtros

- Rango de fecha y hora, limitado por el backend a 90 días.
- Tipo e ID exacto de entidad.
- Operación `CREATE`, `UPDATE` o `DELETE`.
- ID del actor.

El backend siempre valida los límites, incluso si el cliente es modificado.

## Extensión

Cuando el backend agregue otro tipo de entidad:

1. añadirlo a las opciones sugeridas de la pantalla;
2. mantener el campo como texto libre para conservar compatibilidad;
3. agregar pruebas de contrato si cambia la forma de los snapshots;
4. no convertir los snapshots en columnas del listado.
