# Crear un módulo

Un módulo debe incorporarse sin modificar el núcleo de autenticación ni el
cliente HTTP. Esta guía usa `products` como ejemplo; adapta nombres, rutas y
permisos al contrato real del backend.

## 1. Confirmar el contrato

Antes de crear UI, documenta endpoints, parámetros, envelope, paginación,
errores y permisos. Todas las llamadas usan `apiClient`: nunca importes Axios
directamente desde un módulo. Valida con Zod los datos enviados y recibidos.

```text
src/modules/products/
├── components/ProductForm.jsx
├── hooks/useProducts.js
├── pages/ProductListPage.jsx
├── pages/ProductCreatePage.jsx
├── pages/ProductEditPage.jsx
├── schemas/product.schemas.js
├── products.api.js
└── products.routes.jsx
```

No crees carpetas vacías ni separes archivos pequeños por obligación. Mantén
juntas las piezas que cambian por la misma razón.

## 2. Registrar rutas y permisos

Agrega el path raíz a `src/app/routes.js` y los códigos exactos del backend a
`src/config/permissions.js`. Comprueba permisos (`products.read`), nunca roles
(`ADMIN`). En `products.routes.jsx`, carga cada página de forma diferida y
protege el grupo:

```jsx
const productListPage = lazyRoute(
  () => import('@/modules/products/pages/ProductListPage.jsx'),
  'ProductListPage',
);

export const productRoutes = [
  {
    element: <RequirePermission permission={permissions.products.read} />,
    children: [{ path: '/products', element: productListPage }],
  },
];
```

Importa esas rutas dentro del layout privado en `src/app/router.jsx`. El guard
debe envolver el import diferido para no descargar un módulo denegado.

## 3. Modelar datos, API y queries

Crea schemas Zod para listas, detalles y formularios. En `products.api.js`:

- usa `apiClient` y paths relativos como `/products`;
- devuelve datos de dominio, no objetos Axios;
- conserva `meta.pagination` en listados;
- convierte respuestas inválidas en `ApiError` con código
  `INVALID_API_RESPONSE` y su `requestId`;
- deja `401`, refresh, timeout y envelope al cliente común.

Agrega claves jerárquicas en `src/api/query-keys.js`:

```js
products: Object.freeze({
  all: Object.freeze(['products']),
  list: (filters) => ['products', 'list', filters],
  detail: (id) => ['products', 'detail', Number(id)],
}),
```

Los hooks encapsulan `useQuery` y `useMutation`. Tras una mutación, actualiza el
detalle e invalida `queryKeys.products.all`; no limpies cachés ajenas sin una
dependencia contractual.

## 4. Construir páginas y formularios

Reutiliza `PageHeader`, `DataTable`, `FilterBar`, `SearchInput`, `StatusBadge`,
`ConfirmDialog`, `FormActions` y los estados compartidos. Los formularios usan
React Hook Form con `zodResolver`. Cada pantalla debe contemplar:

- carga, vacío, error y reintento;
- filtros, ordenamiento y paginación de servidor;
- submit bloqueado para evitar duplicados;
- errores `422` por campo y error general con `requestId`;
- confirmación para acciones destructivas;
- acciones envueltas en `Can` con su permiso.

`RequirePermission` protege la ruta y `Can` mejora la interfaz. El backend sigue
siendo la autoridad definitiva.

## 5. Agregar menú y feature flag

Registra el ítem en `src/config/navigation.js` con path, icono y permiso. Si es
opcional, valida la variable en `environment-schema.js`, expórtala desde
`environment.js` y usa `enabled` en menú y rutas. Actualiza `.env.example` y
`docs/configuration.md`.

## 6. Probar y documentar

Agrega pruebas unitarias para schemas y lógica, integración MSW para consultas,
mutaciones y errores, y E2E para recorridos sensibles. Comprueba explícitamente
que una ruta sin permiso termina en `/unauthorized`. Documenta el contrato y
las decisiones particulares del dominio.

Finaliza con `npm run quality` y un smoke test real: el chunk debe ser diferido,
el menú debe ocultarse sin permiso y una URL profunda debe sobrevivir un refresh
cuando Express sirve `dist/`.

## Lista de comprobación

- [ ] Contrato y permiso confirmados con el backend.
- [ ] Ruta, páginas y carga diferida registradas.
- [ ] Schemas de respuesta y formulario implementados.
- [ ] API encapsulada y query keys estables.
- [ ] Queries, mutations e invalidación implementadas.
- [ ] Componentes comunes reutilizados.
- [ ] Guard, `Can` y menú basados en permisos.
- [ ] Pruebas y documentación actualizadas.
- [ ] `npm run quality` y smoke test aprobados.
