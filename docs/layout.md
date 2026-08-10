# Layout administrativo

## Estructura

Las rutas privadas se renderizan dentro de `DashboardLayout`:

```text
DashboardLayout
├── AppSidebar                 escritorio
├── MobileNavigation          móvil
└── área principal
    ├── AppHeader
    │   ├── control de navegación
    │   └── UserMenu
    ├── Breadcrumbs
    ├── Outlet
    └── footer
```

El layout ocupa como mínimo la altura de la ventana y mantiene header y sidebar
visibles durante el desplazamiento.

## Navegación responsiva

A partir del breakpoint `lg` de Ant Design se muestra un sidebar colapsable de
248 píxeles. Al colapsarlo conserva iconos y selección activa.

En pantallas menores se utiliza un drawer de 280 píxeles. El drawer se cierra al
seleccionar una ruta y utiliza exactamente la misma configuración autorizada que
el sidebar.

No hay dos fuentes de navegación ni comprobaciones RBAC dentro de componentes de
presentación.

## Disponibilidad de módulos

Una entrada de `navigation.js` puede declarar:

```js
{
  (key, label, path, icon, permission, enabled, available);
}
```

- `permission` exige un permiso efectivo.
- `enabled` representa un feature flag.
- `available: false` reserva metadata para un módulo aún no implementado y evita
  publicar enlaces rotos.

Al implementar un módulo se conecta primero su ruta protegida y luego se elimina
`available: false` en el mismo cambio.

## Menú de usuario

El header muestra avatar, nombre y un menú con:

- Identidad y correo actuales.
- Cerrar la sesión actual.
- Cerrar todas las sesiones, con confirmación destructiva.

Ambas operaciones limpian el estado local incluso si falla la comunicación con
el servidor. El layout comunica ese caso sin conservar datos privados.

## Breadcrumbs

Los breadcrumbs derivan sus etiquetas de la navegación autorizada y de rutas de
sistema conocidas. No duplican manualmente títulos de módulos implementados.

## Accesibilidad

- Sidebar, drawer y breadcrumbs tienen nombres de navegación distintos.
- Los controles de apertura y colapso tienen etiquetas según su estado.
- El menú móvil puede cerrarse con los controles nativos del drawer.
- El nombre no sustituye al avatar como único identificador.
- El layout conserva foco visible y comportamiento de teclado de Ant Design.
