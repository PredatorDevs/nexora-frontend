# Arquitectura del frontend

## Estado

- Estado: aceptado
- Fase: 0 — decisiones de arquitectura
- Última revisión: 2026-07-20
- Proyecto: `nexora-frontend`

Este documento fija las decisiones iniciales del boilerplate. Una decisión solo
debe cambiar ante una necesidad comprobable y el cambio debe actualizar este
documento y las pruebas afectadas.

## Objetivo y límites

El proyecto será una SPA administrativa reutilizable que consume el API de
`nexora-backend`. Incluye autenticación, autorización visual por
permisos, navegación dinámica y módulos administrativos de referencia.

El backend es siempre la autoridad de autenticación, autorización y validación
de negocio. Los controles del navegador mejoran la experiencia, pero nunca
reemplazan los controles del servidor.

No habrá registro público ni ruta `/register`. La creación de usuarios será una
operación administrativa protegida por `users.create`.

## Stack acordado

| Área                          | Decisión                                |
| ----------------------------- | --------------------------------------- |
| Runtime                       | Node.js 22, alineado con el backend     |
| Gestor de paquetes            | npm y `package-lock.json` versionado    |
| Aplicación                    | React con Vite                          |
| Lenguaje                      | JavaScript ESM y JSX                    |
| Enrutamiento                  | React Router                            |
| Datos remotos                 | TanStack Query                          |
| Cliente HTTP                  | Axios encapsulado en un único adaptador |
| Formularios                   | React Hook Form                         |
| Validación                    | Zod y `@hookform/resolvers`             |
| Diseño                        | Ant Design y `@ant-design/icons`        |
| Pruebas unitarias/integración | Vitest, React Testing Library y MSW     |
| Pruebas E2E                   | Playwright                              |
| Calidad                       | ESLint y Prettier                       |

No se incorpora Redux ni Zustand inicialmente. TanStack Query administra estado
remoto; React Context administra sesión y preferencias transversales pequeñas;
el estado efímero permanece local. Zustand solo se evaluará si aparece estado
cliente complejo que no encaje en esas categorías.

## Sistema visual

Ant Design es la librería visual oficial. `ConfigProvider` concentrará tema,
tokens, idioma y configuración global. No se ocultará toda la API de Ant Design
detrás de wrappers genéricos: se crearán componentes comunes cuando expresen una
convención propia o eliminen repetición real, por ejemplo `PageHeader`,
`DataTable`, `StatusBadge`, `ConfirmAction` y estados de carga, vacío y error.

Reglas visuales:

- Personalizar mediante tokens; no sobrescribir selectores internos frágiles.
- Limitar CSS global a reset, variables propias y estilos del documento.
- Usar CSS Modules para estilos específicos que Ant Design no resuelva.
- Diseñar el layout administrativo de forma responsiva desde el inicio.
- Mantener navegación por teclado, foco visible, etiquetas accesibles y mensajes
  que no dependan únicamente del color.
- No añadir una segunda librería de iconos.

El idioma inicial de la interfaz será español. La internacionalización completa
se pospone hasta que exista un segundo idioma requerido.

## Organización del código

La raíz actual es el proyecto frontend; no se creará otra carpeta `frontend/`.

```text
src/
├── api/           cliente, errores, envelopes y query keys compartidas
├── app/           composición, router, providers y configuración de rutas
├── auth/          sesión, guards y primitivas de autorización
├── components/    componentes realmente compartidos
├── config/        acceso validado al ambiente y configuración declarativa
├── hooks/         hooks transversales
├── layouts/       layouts públicos, privados y de error
├── modules/       funcionalidades organizadas verticalmente
├── styles/        estilos globales y tokens propios
└── utils/         utilidades puras sin dependencia de dominio
```

Cada módulo será una unidad vertical y podrá contener páginas, componentes,
schemas, hooks, API y constantes. Un módulo no importará archivos internos de
otro módulo. Las capacidades compartidas se promoverán explícitamente.

Se usará el alias `@/` para `src/`. Convenciones:

- Componentes y páginas: `PascalCase.jsx`.
- Hooks: `useNombre.js`.
- Módulos, utilidades, schemas y clientes: `kebab-case.js`.
- Constantes: `camelCase` para objetos y `UPPER_SNAKE_CASE` para escalares.
- Permisos: códigos `resource.action` en un catálogo único.
- Imports explícitos; no se crearán archivos barril de forma generalizada.

## Configuración y ambientes

Solo `src/config/environment.js` leerá `import.meta.env`. Zod validará y
normalizará las variables al iniciar la aplicación.

```env
VITE_APP_NAME=Nexora ERP
VITE_API_BASE_URL=/api/v1
VITE_REQUEST_TIMEOUT=15000
VITE_ENABLE_AUDIT_MODULE=true
```

Todas las variables `VITE_*` son públicas y nunca contendrán secretos. La ruta
relativa `/api/v1` funcionará con el proxy de Vite y cuando Express sirva
`dist/` desde el mismo origen. Los flags controlan disponibilidad visual, no
conceden permisos ni reemplazan RBAC.

## Comunicación HTTP

Axios será una dependencia de infraestructura y no se usará directamente desde
páginas o componentes. `src/api/api-client.js` será responsable de:

- `baseURL`, timeout y `withCredentials: true`.
- Adjuntar `Authorization: Bearer <accessToken>` cuando exista.
- Desenvolver la respuesta uniforme del backend.
- Convertir errores a `ApiError` sin exponer objetos Axios a la interfaz.
- Coordinar un único refresh ante respuestas `401` concurrentes.
- Reintentar una sola vez la petición original tras un refresh exitoso.
- No refrescar ante `403`, validación o una petición ya reintentada.
- Aceptar cancelación mediante `AbortSignal`.

Contrato base confirmado:

```js
// Éxito
{ success: true, data, meta: { requestId, pagination? } }

// Error
{ success: false, error: { code, message, details? }, meta: { requestId } }
```

La capa API devolverá datos y metadatos de forma explícita. Los componentes no
dependerán del envelope ni de Axios.

## Sesión y autenticación

El access token vive únicamente en memoria. No se persiste en `localStorage`,
`sessionStorage`, IndexedDB, cookies accesibles por JavaScript ni en TanStack
Query. El refresh token pertenece al backend y viaja mediante cookie HttpOnly.

Arranque:

```text
POST /auth/refresh
  ├─ éxito → guardar access token → GET /auth/me + GET /auth/permissions
  └─ 401 esperado → estado unauthenticated
```

`AuthProvider` expondrá:

```js
{
  user,
  permissions,
  status: 'loading' | 'authenticated' | 'unauthenticated',
  login,
  logout,
  logoutAll,
  hasPermission
}
```

El token será privado a la infraestructura HTTP. Al cerrar o perder la sesión se
eliminarán el token y toda caché privada antes de redirigir a `/login`.

## Autorización

La interfaz consultará códigos efectivos mediante `/auth/permissions` y nunca
autorizará por nombres de roles. Se implementarán `RequireAuth`, `RequireGuest`,
`RequirePermission`, `Can` y navegación declarativa filtrada por permisos.

Los permisos conocidos provienen del catálogo del backend. El frontend puede
duplicarlos como constantes para ergonomía, pero las pruebas de contrato deberán
detectar divergencias. Un permiso desconocido se considera denegado.

## Formularios

Zod define validación cliente y React Hook Form administra interacción y envío.
Los schemas reflejarán los límites públicos del backend sin importar código entre
repositorios. El backend sigue siendo la fuente de verdad.

Los detalles del servidor se mapearán a campos cuando incluyan una ruta
reconocible. Los errores generales se mostrarán junto con el `requestId` cuando
ayude al soporte. Los controles complejos de Ant Design se conectarán mediante
`Controller`; no se duplicará el estado del formulario.

## Datos remotos y caché

TanStack Query será la única caché de datos del servidor. Las query keys serán
fábricas deterministas por dominio. Filtros, página y orden se reflejarán en la
URL cuando sean estado navegable.

Las mutaciones invalidarán únicamente los dominios afectados. Cambios que puedan
alterar permisos del usuario actual actualizarán identidad y permisos antes de
mantener una ruta posiblemente restringida.

No se reintentarán mutaciones automáticamente. Las consultas solo reintentarán
errores transitorios; `401`, `403`, `404` y validaciones no se tratarán como
fallos de red.

## Almacenamiento local

Solo se persistirán preferencias no sensibles. Las claves usarán el prefijo
`nexora.frontend.` y tolerarán datos inválidos. Nunca se almacenarán tokens,
permisos, identidad, respuestas privadas ni formularios administrativos.

## Errores y observabilidad

`ApiError` conservará `status`, `code`, `message`, `details` y `requestId`. La UI
distinguirá red, timeout, validación, sesión expirada, autorización y fallo
inesperado. `ErrorBoundary` cubrirá errores de renderizado.

No se mostrarán stack traces, tokens ni datos sensibles. Los mensajes técnicos
podrán traducirse por `code`; el `requestId` se conservará para correlación.

## Pruebas

- Utilidades, schemas y transformaciones: unitarias.
- Providers, guards, formularios y HTTP: React Testing Library con MSW.
- Caminos críticos: Playwright.
- Los mocks reproducirán envelopes, status y errores reales del backend.

Las pruebas no dependerán de un backend activo salvo una suite explícita y
separada. `/register` exigirá 404 y el login no mostrará enlaces de registro.

## Build, despliegue y navegadores

Vite generará `dist/`. Express ya implementa el fallback de SPA sin permitir que
rutas `/api` desconocidas caigan en `index.html`.

Se soportarán las dos últimas versiones estables de Chrome, Edge, Firefox y
Safari. Internet Explorer queda fuera. Los chunks pesados cargarán por ruta. Los
source maps de producción estarán deshabilitados por defecto.

## Decisiones aplazadas

- Zustand u otro gestor de estado.
- Internacionalización completa y tema oscuro.
- Generación de cliente desde OpenAPI, porque el backend aún no la publica.
- Publicar el sistema visual como paquete.
- Soporte offline o PWA.

## Criterios de salida de la Fase 0

- Stack, sistema visual y responsabilidades de estado definidos.
- Convenciones de estructura, nombres e imports definidas.
- Estrategia de sesión y almacenamiento definida.
- Contrato HTTP base contrastado con el backend.
- Estrategia RBAC, pruebas, despliegue y navegadores definida.
- Diferencias entre el plan conceptual y el backend real registradas.
