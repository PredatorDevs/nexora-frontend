# Build y optimización

La fase 13 divide la aplicación por ruta mediante `React.lazy` y `Suspense`.
El shell, autenticación y autorización permanecen en el núcleo; cada página se
descarga únicamente cuando el usuario autorizado la visita.

## Comandos

```bash
npm run build
npm run build:check
npm run preview
```

`build:check` genera el artefacto y verifica que:

- Existe `dist/index.html`.
- Los nombres de entrada contienen hash.
- Existen múltiples chunks JavaScript.
- Ningún chunk supera 500 KiB sin comprimir.
- No se publican source maps.

## Resultado de referencia

Antes de la división, todo el JavaScript se generaba en un archivo de
aproximadamente 1,425 KiB. Después, el mayor chunk es inferior a 500 KiB y las
páginas de usuarios, roles, permisos, sesiones y auditoría se emiten por
separado. Los tamaños exactos pueden cambiar al actualizar dependencias; el
chequeo automatizado conserva el límite acordado.

## Política de caché

El servidor o CDN debería responder:

```text
/index.html      Cache-Control: no-cache
/assets/*        Cache-Control: public, max-age=31536000, immutable
```

Los assets pueden almacenarse por largo tiempo porque incluyen un hash de
contenido. `index.html` debe revalidarse para descubrir los hashes de una nueva
versión. El servidor debe aplicar fallback SPA hacia `index.html` únicamente a
rutas del frontend; `/api/*` nunca debe caer en ese fallback.

## Carga diferida

Las rutas usan `src/app/lazy-route.jsx`, que exige un importador y el nombre del
export de página. Mientras llega el chunk muestra el estado de carga accesible
compartido. Para agregar una página:

```jsx
const examplePage = lazyRoute(
  () => import('@/modules/example/pages/ExamplePage.jsx'),
  'ExamplePage',
);
```

Los guards se mantienen fuera del import diferido. Así, una ruta denegada no
descarga el módulo administrativo que el usuario no puede utilizar.
