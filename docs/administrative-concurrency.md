# Protecciones administrativas y concurrencia (fase 16)

Las mutaciones de usuarios y roles envían el `updatedAt` visible como
`expectedUpdatedAt`. Si el recurso cambió, el API responde `409` con
`details.reason: "STALE_WRITE"`; la SPA muestra un mensaje para recargar y no
sobrescribe cambios de otro operador.

Las desactivaciones, resets, revocaciones y eliminaciones mantienen diálogos de
confirmación. Eliminar un rol personalizado exige además escribir su código.
Los roles del sistema y las acciones propias prohibidas permanecen desactivados
en la interfaz, aunque el backend siempre vuelve a validar la invariante.
