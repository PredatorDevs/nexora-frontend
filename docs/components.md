# Componentes comunes

## Principios

Los componentes comunes expresan convenciones del boilerplate y encapsulan
patrones repetidos. No intentan ocultar toda la API de Ant Design. Los módulos
pueden usar Ant Design directamente cuando no exista una convención compartida.

## UI y feedback

- `PageHeader`: título semántico, descripción, eyebrow y acciones.
- `StatusBadge`: estados administrativos conocidos con texto y color.
- `LoadingState`: spinner o skeleton con región viva.
- `EmptyState`: vacío con descripción y acción opcional.
- `ErrorState`: mensaje normalizado, `requestId` y reintento.
- `ConfirmDialog`: confirmación controlada, destructiva y compatible con estados
  asíncronos.

## Formularios

- `SearchInput`: búsqueda controlada, limpieza y submit explícito.
- `FilterBar`: distribución responsiva de filtros y acciones.
- `FormActions`: submit, cancelación y bloqueo durante envío.
- `applyApiValidationErrors`: traduce detalles `VALIDATION_ERROR` de `body` a
  `setError` de React Hook Form.

Los módulos son responsables de traducir mensajes de dominio y decidir qué hacer
con errores generales que no correspondan a campos.

## Tablas remotas

`DataTable` está orientada a listados controlados por el backend. Recibe datos,
columnas, carga, error y metadatos de paginación. Su callback emite:

```js
{
  page,
  pageSize,
  sortBy,
  sortOrder: 'asc' | 'desc' | undefined,
  filters
}
```

El módulo conserva esos valores en la URL y los entrega a su query. La tabla no
realiza paginación ni ordenamiento local oculto.

`PaginationControl` sirve para diseños donde la paginación esté separada de la
tabla. Sus tamaños predeterminados son 10, 20, 50 y 100; nunca sugiere superar el
máximo 100 del backend.

## Hooks

- `useDebounce`: retrasa valores de búsqueda sin esconder el estado inmediato.
- `useDisclosure`: estado y operaciones estables para modales, drawers y paneles.

## Accesibilidad

Los componentes mantienen headings, regiones nombradas, `aria-live`, estados de
carga y texto visible además del color. Las acciones conservan botones reales y
los diálogos aprovechan el manejo de foco de Ant Design.
