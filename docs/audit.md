# Auditoría

La fase 11 incorpora un explorador de eventos administrativos y de seguridad.
El historial es de solo lectura: el frontend no ofrece operaciones para crearlo,
modificarlo o eliminarlo.

## Contrato consumido

`GET /audit` requiere `audit.read` y acepta `page`, `pageSize`, `action`,
`actorUserId`, `resourceType` y `result`. Los filtros son coincidencias exactas y
el backend siempre ordena los eventos del más reciente al más antiguo.

No existe un endpoint de detalle. El panel utiliza el registro completo recibido
en el listado y muestra:

- Actor, acción, recurso y resultado.
- Fecha, dirección IP y agente de usuario.
- `requestId` copiable para correlacionar registros y soporte.
- Metadatos sanitizados como JSON de solo texto.

Los IDs de auditoría se conservan como strings porque provienen de un `BIGINT` y
podrían superar la precisión segura de JavaScript.

## Feature flag

`VITE_ENABLE_AUDIT_MODULE=false` elimina tanto el elemento de navegación como la
ruta `/audit` durante la construcción de la aplicación. El permiso
`audit.read` continúa siendo obligatorio cuando el módulo está habilitado.

## Seguridad

El backend elimina recursivamente claves de metadatos relacionadas con
contraseñas, tokens, cookies, secretos y encabezados de autorización. El
frontend trata los metadatos como datos y los serializa como texto; nunca los
interpreta como HTML.
