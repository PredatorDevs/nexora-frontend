# Predator Frontend Boilerplate

SPA administrativa reutilizable construida con React, Vite y Ant Design para
consumir `predator-backend-boilerplate`.

Incluye autenticación con refresh token HttpOnly, RBAC basado en permisos,
layout responsivo y módulos de usuarios, roles, permisos, sesiones y auditoría.
No existe registro público: los usuarios se crean únicamente desde el área
administrativa con `users.create`.

## Requisitos

- Node.js 22 o posterior.
- npm 10 o posterior.
- Backend en `http://localhost:3000` para utilizar el proxy durante desarrollo.

## Inicio rápido

```bash
npm install
copy .env.example .env
npm run dev
```

Vite inicia el frontend y redirige `/api` al backend local. Las variables con
prefijo `VITE_` son públicas y nunca deben contener secretos.

En PowerShell, `copy` puede sustituirse por `Copy-Item`. Si el backend escucha
en otro puerto, cambia solo `DEV_API_PROXY_TARGET` en `.env`, por ejemplo:

```env
DEV_API_PROXY_TARGET=http://localhost:5001
```

La aplicación valida su configuración al iniciar y falla con un mensaje claro
si falta una variable requerida o su valor es inválido. Consulta
[`docs/configuration.md`](docs/configuration.md) para conocer el contrato y los
ambientes soportados.

## Variables de entorno

| Variable                   | Uso                                       |
| -------------------------- | ----------------------------------------- |
| `VITE_APP_NAME`            | Nombre visible de la aplicación.          |
| `VITE_API_BASE_URL`        | Base de la API; debe conservar `/api/v1`. |
| `VITE_REQUEST_TIMEOUT`     | Timeout HTTP en milisegundos.             |
| `VITE_ENABLE_AUDIT_MODULE` | Habilita rutas y navegación de auditoría. |
| `DEV_API_PROXY_TARGET`     | Origen backend usado solo por Vite.       |

## Desarrollo integrado

1. Configura y levanta `predator-backend-boilerplate`.
2. Ajusta `DEV_API_PROXY_TARGET` al origen del backend, sin agregar `/api/v1`.
3. Ejecuta `npm run dev` y abre `http://localhost:5173`.
4. Inicia sesión con un usuario administrativo existente.

Las cookies viajan con las solicitudes y el access token permanece solamente
en memoria. En producción se recomienda servir `dist/` desde Express en el
mismo origen; consulta [despliegue](docs/deployment.md).

## Comandos

```bash
npm run dev
npm run build
npm run build:check
npm run preview
npm run lint
npm run format:check
npm test
npm run test:coverage
npm run test:e2e
npm run quality
```

`quality` ejecuta formato, lint, cobertura, E2E y la validación del build. Antes
del primer E2E instala Chromium con `npx playwright install chromium`. Las
pruebas automatizadas usan MSW y no requieren un backend real.

## Estructura

```text
src/
├── api/          cliente HTTP, errores, envelopes y query keys
├── app/          providers, router, rutas y carga diferida
├── auth/         sesión, guards y autorización visual
├── components/   componentes reutilizables
├── config/       ambiente, navegación y permisos
├── layouts/      layouts público y administrativo
├── modules/      funcionalidades aisladas por dominio
└── utils/        utilidades sin dependencia de UI
tests/
├── unit/
├── integration/
├── e2e/
└── helpers/
```

TanStack Query administra datos remotos, `AuthProvider` la sesión, React Hook
Form los formularios y Zod la validación. El backend es siempre la autoridad
definitiva de autorización.

## Documentación

- [Arquitectura](docs/architecture.md)
- [Notas del contrato backend](docs/backend-contract-notes.md)
- [Configuración y ambientes](docs/configuration.md)
- [Cliente HTTP](docs/http-client.md)
- [Autenticación](docs/authentication.md)
- [Autorización y RBAC](docs/authorization.md)
- [Layout administrativo](docs/layout.md)
- [Componentes comunes](docs/components.md)
- [Módulo de usuarios](docs/users.md)
- [Roles y permisos](docs/roles-and-permissions.md)
- [Administración de sesiones](docs/sessions.md)
- [Auditoría](docs/audit.md)
- [Cómo crear un módulo](docs/creating-a-module.md)
- [Estrategia de pruebas](docs/testing.md)
- [Build y optimización](docs/build-and-optimization.md)
- [Despliegue](docs/deployment.md)
- [Plan de implementación](IMPLEMENTATION_PLAN.md)

## Antes de entregar

Ejecuta `npm run quality` y un smoke test contra el backend real: login,
recuperación tras recarga, navegación por permisos y una mutación
administrativa. Si cambia un contrato HTTP, actualiza también la documentación
del módulo y las notas del contrato backend.
