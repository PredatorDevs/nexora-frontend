# Despliegue

`npm run build:check` produce y valida `dist/`. El artefacto es estático: no
contiene Node.js ni secretos y debe desplegarse completo, con `index.html` y
`assets/` en el mismo directorio raíz.

## Opción recomendada: mismo origen con Express

Compila primero el frontend:

```powershell
npm ci
npm run build:check
```

En el `.env` de `nexora-backend` configura:

```env
SERVE_FRONTEND=true
FRONTEND_DIST_PATH=../nexora-frontend/dist
```

La ruta relativa se resuelve desde donde inicia el proceso backend. En un
servicio o contenedor usa una ruta absoluta estable, como `/app/public`. Mantén
en el build frontend `VITE_API_BASE_URL=/api/v1`.

Express atiende la API antes que la SPA, devuelve `index.html` para rutas
profundas y nunca convierte un `/api/*` desconocido en HTML. Aplica `no-cache`
al entry point y caché inmutable de un año a assets con hash.

## Artefacto copiado

El pipeline puede copiar el contenido de `dist/` a `/app/public` y configurar
`FRONTEND_DIST_PATH=/app/public`. `index.html` debe quedar directamente dentro
de ese path, no en `public/dist/index.html`. El backend falla al iniciar si no
encuentra el entry point.

## Frontend y API separados

Si un CDN o servicio estático sirve la SPA:

```env
# Frontend, durante el build
VITE_API_BASE_URL=https://api.example.com/api/v1
```

```env
# Backend
SERVE_FRONTEND=false
FRONTEND_DIST_PATH=
CORS_ALLOWED_ORIGINS=https://app.example.com
```

El host debe redirigir navegaciones desconocidas a `/index.html`. Verifica CORS
con credenciales y los atributos `Domain`, `SameSite` y `Secure` de la cookie de
refresh. El mismo origen evita la mayoría de esos problemas y es la opción
predeterminada del boilerplate.

## Pipeline sugerido

1. Usar Node.js 22 y `npm ci`.
2. Ejecutar `npm run quality`.
3. Publicar exactamente el `dist/` ya validado.
4. Configurar secretos solamente en el backend.
5. Iniciar Express o publicar el host estático.
6. Ejecutar smoke tests sobre el origen desplegado.

## Smoke test posterior

- `/login` carga y las llamadas `/api/v1` reciben JSON.
- Login y recuperación de sesión tras recarga funcionan.
- `/register` y rutas desconocidas muestran 404.
- Menú, rutas y acciones respetan permisos.
- Una mutación administrativa y sus errores `422` funcionan.
- Una URL profunda como `/users/1` abre directamente.
- Revocar la sesión actual vuelve al login.
- El entry point no se cachea y los assets con hash sí.

No publiques source maps sin una decisión explícita y un destino privado. Los
límites de chunks están en [build y optimización](build-and-optimization.md).
