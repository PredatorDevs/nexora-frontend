# Objetivo del frontend boilerplate

El frontend debe quedar preparado para consumir el boilerplate del backend mediante una SPA administrativa con:

* Inicio y cierre de sesión.
* Recuperación automática de sesión.
* Rutas privadas.
* Control visual basado en permisos.
* Menú dinámico.
* CRUD administrativo de usuarios.
* Administración de roles y permisos.
* Gestión de sesiones activas.
* Manejo uniforme de errores.
* Formularios reutilizables.
* Tablas con paginación, filtros y ordenamiento.
* Pruebas automatizadas.
* Build listo para ser servido por Express.

El boilerplate **no tendrá registro público**. No existirán:

```text
/register
/signup
/api pública de creación de cuenta
botón "Crear cuenta"
formulario público de registro
```

Los usuarios serán creados únicamente desde el módulo administrativo, protegido por un permiso como:

```text
users.create
```

---

# 1. Base tecnológica propuesta

```text
React
Vite
JavaScript con módulos ESM
React Router
TanStack Query
React Hook Form
Zod
Axios o Fetch encapsulado
Vitest
React Testing Library
MSW
Playwright
```

## Manejo de estado

Se separará el estado según su naturaleza:

| Tipo de estado                | Herramienta                           |
| ----------------------------- | ------------------------------------- |
| Datos del backend             | TanStack Query                        |
| Sesión autenticada            | Auth Context                          |
| Formularios                   | React Hook Form                       |
| Validaciones                  | Zod                                   |
| Navegación                    | React Router                          |
| Preferencias simples          | Context o estado local                |
| Estado global complejo futuro | Zustand, solo si aparece la necesidad |

No recomiendo incorporar Redux inicialmente. La mayor parte del estado será remoto y TanStack Query ya cubre ese escenario.

---

# 2. Estructura objetivo

```text
frontend/
├── public/
│   ├── favicon.svg
│   └── manifest.webmanifest
│
├── src/
│   ├── main.jsx
│   │
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   ├── providers.jsx
│   │   ├── query-client.js
│   │   ├── routes.js
│   │   └── constants.js
│   │
│   ├── config/
│   │   ├── environment.js
│   │   ├── navigation.js
│   │   └── permissions.js
│   │
│   ├── api/
│   │   ├── api-client.js
│   │   ├── api-error.js
│   │   ├── api-response.js
│   │   └── query-keys.js
│   │
│   ├── auth/
│   │   ├── AuthProvider.jsx
│   │   ├── auth-context.js
│   │   ├── useAuth.js
│   │   ├── RequireAuth.jsx
│   │   ├── RequireGuest.jsx
│   │   ├── RequirePermission.jsx
│   │   ├── Can.jsx
│   │   └── permission-utils.js
│   │
│   ├── layouts/
│   │   ├── AuthLayout.jsx
│   │   ├── DashboardLayout.jsx
│   │   ├── ErrorLayout.jsx
│   │   └── components/
│   │       ├── AppHeader.jsx
│   │       ├── AppSidebar.jsx
│   │       ├── UserMenu.jsx
│   │       ├── Breadcrumbs.jsx
│   │       └── MobileNavigation.jsx
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── sessions/
│   │   ├── audit/
│   │   └── profile/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   ├── feedback/
│   │   ├── navigation/
│   │   └── authorization/
│   │
│   ├── hooks/
│   │   ├── useDebounce.js
│   │   ├── useDisclosure.js
│   │   ├── useDocumentTitle.js
│   │   └── usePagination.js
│   │
│   ├── utils/
│   │   ├── dates.js
│   │   ├── formatters.js
│   │   ├── strings.js
│   │   └── storage.js
│   │
│   ├── assets/
│   └── styles/
│       ├── global.css
│       ├── variables.css
│       └── utilities.css
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── mocks/
│
├── docs/
│   ├── architecture.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── creating-a-module.md
│   └── deployment.md
│
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

# 3. Organización por módulo

Cada módulo funcional debe contener sus páginas, componentes, consultas y validaciones.

Ejemplo:

```text
src/modules/users/
├── pages/
│   ├── UserListPage.jsx
│   ├── UserCreatePage.jsx
│   ├── UserEditPage.jsx
│   └── UserDetailsPage.jsx
│
├── components/
│   ├── UserForm.jsx
│   ├── UserTable.jsx
│   ├── UserStatusBadge.jsx
│   ├── UserRolesField.jsx
│   └── UserFilters.jsx
│
├── hooks/
│   ├── useUsers.js
│   ├── useUser.js
│   └── useUserMutations.js
│
├── schemas/
│   └── user.schemas.js
│
├── users.api.js
├── users.routes.jsx
└── users.constants.js
```

Esto mantiene cohesionada cada funcionalidad y evita carpetas globales demasiado grandes.

---

# 4. Dependencias previstas

## Producción

```bash
npm install \
  react \
  react-dom \
  react-router \
  @tanstack/react-query \
  react-hook-form \
  @hookform/resolvers \
  zod \
  axios
```

La librería visual puede incorporarse posteriormente. Dos opciones razonables:

```text
Ant Design
Material UI
```

Dado que ya has trabajado con Ant Design, puede ser una elección práctica para:

* Formularios.
* Tablas.
* Modales.
* Menús.
* Layout.
* Notificaciones.
* Selectores.
* Componentes administrativos.

No obstante, la arquitectura no debe depender directamente de la librería. Los componentes comunes deben encapsularla cuando sea conveniente.

## Desarrollo

```bash
npm install -D \
  vite \
  @vitejs/plugin-react \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  msw \
  playwright \
  eslint \
  prettier \
  jsdom
```

---

# 5. Rutas iniciales

## Rutas públicas

```text
/login
/forgot-password        Opcional en una etapa posterior
/reset-password/:token  Opcional en una etapa posterior
```

## Rutas privadas

```text
/
/dashboard

/users
/users/create
/users/:id
/users/:id/edit

/roles
/roles/create
/roles/:id
/roles/:id/edit

/permissions
/sessions
/audit
/profile

/unauthorized
/not-found
```

## Ruta deliberadamente inexistente

```text
/register
```

Cualquier intento de navegar hacia `/register` deberá terminar en `404`, no en una pantalla de registro.

---

# 6. Flujo de creación de usuarios

La creación de usuarios será administrativa:

```text
Administrador
   ↓
Módulo Usuarios
   ↓
Nuevo usuario
   ↓
Datos personales
   ↓
Credenciales iniciales
   ↓
Asignación de roles
   ↓
POST /api/v1/users
```

## Formulario administrativo inicial

```text
Name
Username
Email
Initial password
Confirm password
Status
Roles
Force password change
```

Es recomendable que el backend admita una bandera como:

```text
mustChangePassword
```

El administrador puede:

* Definir una contraseña temporal.
* Activar el usuario.
* Asignar uno o varios roles.
* Obligar al cambio de contraseña en el primer acceso.

La contraseña temporal nunca debe mostrarse nuevamente después de guardar.

---

# 7. Plan de acción por fases

## Fase 0: decisiones de arquitectura

Definir antes de programar:

* Librería visual.
* Convenciones de nombres.
* Estructura de módulos.
* Manejo de sesión.
* Formato de errores.
* Estrategia de permisos.
* Diseño responsivo.
* Compatibilidad mínima de navegadores.
* Uso de JavaScript ESM.
* Política de almacenamiento local.

### Decisiones recomendadas

```text
API base: /api/v1
Access token: memoria
Refresh token: cookie HttpOnly
Datos remotos: TanStack Query
Formularios: React Hook Form
Validación: Zod
Rutas: React Router
Permisos: resource.action
Registro público: deshabilitado
```

### Entregable

```text
docs/architecture.md
```

---

## Fase 1: inicialización del proyecto

Se construirá:

* Proyecto Vite.
* React.
* ESM.
* ESLint.
* Prettier.
* Alias de imports.
* Variables de entorno.
* Estilos globales.
* Router inicial.
* Página temporal de inicio.
* Página 404.

## Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```

### Criterios de aceptación

```text
npm run dev inicia correctamente.
npm run build genera dist/.
npm run lint termina sin errores.
/not-found muestra la página correspondiente.
```

---

## Fase 2: configuración y variables de entorno

## Variables previstas

```env
VITE_APP_NAME=Application
VITE_API_BASE_URL=/api/v1
VITE_REQUEST_TIMEOUT=15000
VITE_ENABLE_AUDIT_MODULE=true
```

## Reglas

* No acceder directamente a `import.meta.env` fuera de `config/environment.js`.
* No almacenar secretos en variables de Vite.
* Toda variable del frontend debe considerarse pública.
* La URL de API debe funcionar por defecto con rutas relativas.

Ejemplo:

```js
export const environment = {
  appName: import.meta.env.VITE_APP_NAME,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  requestTimeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT)
};
```

### Criterios de aceptación

* La aplicación falla claramente si falta una variable requerida.
* Desarrollo puede usar proxy de Vite.
* Producción consume `/api/v1` desde el mismo origen.

---

## Fase 3: infraestructura del cliente HTTP

Se implementará un cliente HTTP único.

```text
src/api/api-client.js
```

## Responsabilidades

* URL base.
* Timeout.
* `credentials: include`.
* Encabezado `Authorization`.
* Conversión de errores.
* Identificación de respuestas `401`, `403` y `422`.
* Renovación controlada de sesión.
* Prevención de múltiples refresh simultáneos.
* Reintento de una solicitud después de renovar.
* Cancelación de solicitudes cuando corresponda.

## Error normalizado

```js
{
  code: 'VALIDATION_ERROR',
  message: 'The request contains invalid data.',
  details: [],
  requestId: '...'
}
```

Los componentes no deberían depender directamente de la estructura cruda de Axios o `fetch`.

### Criterios de aceptación

* Todos los módulos utilizan el cliente común.
* Un error de backend se transforma en `ApiError`.
* Un `403` no intenta renovar sesión.
* Un `401` puede ejecutar un único refresh.
* Un refresh fallido termina la sesión.

---

# 8. Autenticación

## Estado de autenticación

El `AuthProvider` deberá manejar:

```js
{
  user: null,
  permissions: [],
  accessToken: null,
  status: 'loading' | 'authenticated' | 'unauthenticated'
}
```

## Flujo inicial

```text
Aplicación inicia
   ↓
POST /auth/refresh
   ↓
Access token nuevo
   ↓
GET /auth/me
   ↓
Usuario y permisos
   ↓
Renderizar aplicación
```

También puede utilizarse un endpoint combinado si el backend lo proporciona.

## Inicio de sesión

```text
POST /auth/login
   ↓
Access token en respuesta
   ↓
Refresh token en cookie HttpOnly
   ↓
Guardar access token en memoria
   ↓
Consultar usuario y permisos
   ↓
Redirigir al dashboard
```

## Cierre de sesión

```text
POST /auth/logout
   ↓
Limpiar access token
   ↓
Limpiar caché de TanStack Query
   ↓
Redirigir a /login
```

## Almacenamiento

No se almacenará el access token en:

```text
localStorage
sessionStorage
IndexedDB
```

Permanecerá en memoria. La sesión se recuperará usando el refresh token seguro.

### Criterios de aceptación

* Recargar el navegador recupera la sesión.
* El usuario no autenticado es enviado a `/login`.
* El usuario autenticado no puede volver a `/login`.
* Cerrar sesión limpia toda la caché privada.
* Una sesión revocada termina correctamente.

---

# 9. Guards de navegación

## `RequireAuth`

Protege rutas privadas:

```jsx
<RequireAuth>
  <DashboardLayout />
</RequireAuth>
```

## `RequireGuest`

Evita que un usuario autenticado vea el login:

```jsx
<RequireGuest>
  <LoginPage />
</RequireGuest>
```

## `RequirePermission`

Protege una ruta por permiso:

```jsx
<RequirePermission permission="users.read">
  <UserListPage />
</RequirePermission>
```

## Resultado de acceso denegado

```text
Sin autenticación → /login
Sin permiso → /unauthorized
Ruta inexistente → /not-found
```

La protección frontend mejora la experiencia, pero el backend continúa siendo la autoridad definitiva.

---

# 10. RBAC en la interfaz

## Componente `Can`

```jsx
<Can permission="users.create">
  <CreateUserButton />
</Can>
```

## Condiciones múltiples

```jsx
<Can anyOf={['users.update', 'users.change_status']}>
  <UserActions />
</Can>
```

```jsx
<Can allOf={['roles.read', 'roles.assign_permissions']}>
  <PermissionMatrix />
</Can>
```

## Menú dinámico

Cada elemento de navegación tendrá permisos requeridos:

```js
{
  key: 'users',
  label: 'Users',
  path: '/users',
  permission: 'users.read'
}
```

El menú debe ocultar los módulos sin permiso.

## Regla importante

No se debe verificar el rol directamente:

```js
user.role === 'ADMIN'
```

Debe verificarse el permiso:

```js
hasPermission('users.create')
```

---

# 11. Layout y sistema visual

## Layout de autenticación

Usado exclusivamente para:

```text
/login
forgot password
reset password
```

No contendrá acceso a registro público.

## Layout administrativo

```text
Header
Sidebar
Breadcrumbs
Content
User menu
Responsive mobile navigation
```

## Componentes comunes

```text
PageHeader
DataTable
Pagination
SearchInput
FilterBar
StatusBadge
ConfirmDialog
FormActions
EmptyState
LoadingState
ErrorState
AccessDenied
```

## Criterios de UX

* Estados de carga visibles.
* Formularios bloqueados durante el envío.
* Confirmación para operaciones destructivas.
* Mensajes de error próximos al campo.
* Notificaciones para acciones completadas.
* Navegación por teclado.
* Contraste adecuado.
* Diseño responsivo.
* No depender exclusivamente del color.

---

# 12. Formularios reutilizables

La combinación será:

```text
React Hook Form
Zod
Componentes UI
```

Ejemplo conceptual:

```js
const userSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  username: z.string().min(4).max(50),
  password: z.string().min(12),
  roleIds: z.array(z.number()).min(1)
});
```

## Errores del backend

Los errores de validación del backend deben mapearse a los campos:

```json
{
  "details": [
    {
      "field": "email",
      "message": "Email already exists."
    }
  ]
}
```

El frontend deberá convertirlos mediante:

```js
form.setError('email', {
  type: 'server',
  message: 'Email already exists.'
});
```

---

# 13. Módulos administrativos

## Usuarios

```text
Listado
Búsqueda
Filtros
Paginación
Creación administrativa
Edición
Activación/inactivación
Asignación de roles
Revocación de sesiones
Cambio o reinicio de contraseña
```

Permisos sugeridos:

```text
users.read
users.create
users.update
users.change_status
users.assign_roles
users.reset_password
sessions.revoke
```

## Roles

```text
Listado
Creación
Edición
Eliminación controlada
Asignación de permisos
```

## Permisos

Generalmente será un módulo de consulta:

```text
Listado agrupado por recurso
Búsqueda
Visualización de descripción
```

Los permisos no deberían crearse libremente desde la interfaz porque deben corresponder a capacidades reales del sistema.

## Sesiones

```text
Ver sesiones propias
Ver sesiones de un usuario
Revocar una sesión
Revocar todas las sesiones
```

## Auditoría

```text
Filtros por fecha
Usuario
Acción
Recurso
Resultado
Request ID
Detalle de metadatos
```

---

# 14. TanStack Query

## Convenciones de claves

```js
export const queryKeys = {
  auth: {
    me: ['auth', 'me']
  },
  users: {
    all: ['users'],
    list: filters => ['users', 'list', filters],
    detail: id => ['users', 'detail', id]
  }
};
```

## Mutaciones

Después de crear un usuario:

```text
Invalidar users.list
Mostrar notificación
Navegar al detalle o listado
```

Después de cambiar roles:

```text
Invalidar user.detail
Invalidar users.list
```

Si se modifican los roles del usuario actual:

```text
Actualizar /auth/me
Actualizar permisos
Recalcular menú
Redirigir si perdió acceso a la ruta actual
```

---

# 15. Manejo global de errores

Se implementarán:

* `ErrorBoundary`.
* Página de error inesperado.
* Manejo de errores de red.
* Manejo de timeout.
* Manejo de sesión expirada.
* Manejo de acceso denegado.
* Mensajes de validación.
* Visualización opcional del `requestId`.

Ejemplo:

```text
No fue posible completar la operación.
Código de seguimiento: 019abc...
```

Esto permitirá relacionar el error mostrado con los logs del backend.

---

# 16. Pruebas automatizadas

## Unitarias

* Utilidades de permisos.
* Validaciones Zod.
* Transformación de errores.
* Formateadores.
* Hooks simples.

## Integración

* Login.
* Recuperación de sesión.
* Guards.
* Menú basado en permisos.
* Formularios.
* Listados.
* Mutaciones.
* Manejo de errores.

MSW simulará las respuestas HTTP sin depender del backend real.

## End-to-end

Playwright deberá probar como mínimo:

```text
Iniciar sesión
Acceder al dashboard
Listar usuarios
Crear usuario desde administración
Asignar roles
Editar usuario
Ocultar acciones sin permiso
Bloquear acceso manual a una ruta
Cerrar sesión
Recuperar sesión después de recargar
```

## Prueba explícita de ausencia de registro

```text
Navegar a /register
Resultado esperado: 404
```

También deberá comprobarse que la página de login no contenga enlaces como:

```text
Crear cuenta
Registrarse
Sign up
```

---

# 17. Integración con el backend

## Desarrollo

Vite utilizará proxy:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

El frontend consumirá siempre rutas relativas:

```js
/api/v1/auth/login
/api/v1/users
```

## Producción

```text
dist/
├── index.html
└── assets/
```

El contenido de `dist` será entregado al proceso de despliegue para que Express lo sirva como archivos estáticos.

El frontend no debe conocer la estructura interna del backend ni rutas del sistema de archivos.

---

# 18. Build y optimización

Se configurará:

* División de código por ruta.
* Lazy loading.
* Suspense.
* Assets con hash.
* Source maps según ambiente.
* Eliminación de logs de depuración.
* Análisis opcional del bundle.
* Carga diferida de módulos administrativos pesados.

Ejemplo:

```jsx
const UsersPage = lazy(() =>
  import('@/modules/users/pages/UserListPage')
);
```

## Caché esperada

```text
index.html        sin caché prolongada
assets/*          immutable
```

---

# 19. Documentación

## `README.md`

Debe incluir:

* Requisitos.
* Instalación.
* Variables de entorno.
* Comandos.
* Desarrollo con proxy.
* Pruebas.
* Build.
* Integración con backend.
* Estructura del proyecto.

## Documentos técnicos

```text
docs/architecture.md
docs/authentication.md
docs/authorization.md
docs/creating-a-module.md
docs/testing.md
docs/deployment.md
```

## Guía para crear un módulo

Debe explicar cómo agregar:

```text
Ruta
Página
API
Query
Mutation
Formulario
Schema
Permiso
Elemento de menú
Pruebas
```

---

# 20. Orden concreto de implementación

```text
1. Definir convenciones y librería visual
2. Inicializar Vite y React
3. Configurar router y providers
4. Configurar variables de entorno
5. Construir cliente HTTP
6. Implementar AuthProvider
7. Implementar login y recuperación de sesión
8. Implementar guards
9. Implementar utilidades RBAC
10. Construir layout administrativo
11. Construir componentes comunes
12. Implementar módulo usuarios
13. Implementar roles y permisos
14. Implementar sesiones
15. Implementar auditoría
16. Agregar pruebas unitarias
17. Agregar pruebas de integración
18. Agregar pruebas end-to-end
19. Configurar build de producción
20. Completar documentación
```

---

# 21. Hitos

## Hito 1: núcleo ejecutable

Incluye:

* React.
* Vite.
* Router.
* Providers.
* Configuración.
* Layout básico.
* Página 404.

Resultado: SPA base operativa.

## Hito 2: autenticación completa

Incluye:

* Login.
* AuthProvider.
* Cliente HTTP.
* Refresh automático.
* Logout.
* Rutas públicas y privadas.

Resultado: sesión integrada con el backend.

## Hito 3: autorización visual

Incluye:

* `RequirePermission`.
* `Can`.
* Menú dinámico.
* Página 403.
* Pruebas RBAC.

Resultado: interfaz adaptada a los permisos efectivos.

## Hito 4: administración funcional

Incluye:

* Usuarios.
* Creación administrativa.
* Roles.
* Permisos.
* Sesiones.
* Auditoría.

Resultado: frontend base administrable sin registro público.

## Hito 5: boilerplate desplegable

Incluye:

* Pruebas.
* Build optimizado.
* Integración con Express.
* Documentación.
* Reglas de calidad.

Resultado: plantilla reutilizable y lista para producción.

---

# 22. Definición de terminado

El frontend podrá considerarse un boilerplate sólido cuando:

* Pueda instalarse y ejecutarse siguiendo únicamente el README.
* Se conecte al backend utilizando `/api/v1`.
* Recupere la sesión al recargar.
* No almacene el access token persistentemente.
* Proteja rutas privadas.
* Controle componentes por permisos.
* El menú se genere según permisos.
* Permita crear usuarios únicamente desde administración.
* No exista ninguna ruta o enlace público de registro.
* Permita administrar roles y permisos.
* Maneje errores y validaciones de manera uniforme.
* Muestre el `requestId` cuando sea útil.
* Tenga pruebas de autenticación y RBAC.
* Genere un directorio `dist` listo para Express.
* Crear un nuevo módulo no requiera modificar el núcleo de autenticación o autorización.

El primer bloque de ejecución debería cubrir **Fases 0 a 4**: decisiones técnicas, bootstrap, configuración, cliente HTTP y autenticación. Después se construyen RBAC, layout y módulos administrativos.
