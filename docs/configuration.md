# Configuración y ambientes

## Principios

La configuración del frontend forma parte del bundle y es pública. Ninguna
variable `VITE_*` puede contener contraseñas, tokens, claves privadas, secretos
de firma ni credenciales de infraestructura.

`src/config/environment.js` es el único archivo de aplicación autorizado para
leer `import.meta.env`. Utiliza el parser puro de `environment-schema.js` y
expone un objeto inmutable. El mismo parser se ejecuta desde Vite antes de iniciar
o compilar. El resto del código consume `environment` y nunca variables crudas.

## Preparación local

Crear el archivo local ignorado por Git:

```powershell
Copy-Item .env.example .env
```

En shells compatibles con POSIX:

```bash
cp .env.example .env
```

## Variables del navegador

| Variable                   | Obligatoria | Restricción                                           |
| -------------------------- | ----------- | ----------------------------------------------------- |
| `VITE_APP_NAME`            | Sí          | Texto entre 1 y 80 caracteres                         |
| `VITE_API_BASE_URL`        | Sí          | Ruta `/...` o URL absoluta HTTP(S), sin query ni hash |
| `VITE_REQUEST_TIMEOUT`     | Sí          | Entero entre 1000 y 120000 milisegundos               |
| `VITE_ENABLE_AUDIT_MODULE` | Sí          | Literal `true` o `false`                              |

La URL base pierde barras finales durante la normalización. Por ejemplo,
`/api/v1/` se expone como `/api/v1`.

El flag de auditoría solo controla si el frontend ofrece el módulo. El backend
sigue requiriendo `audit.read`; el flag nunca concede acceso.

## Configuración exclusiva de Vite

`DEV_API_PROXY_TARGET` define el destino del proxy `/api` durante desarrollo. No
usa el prefijo `VITE_`, por lo que Vite no lo expone al código del navegador.
Debe ser una URL HTTP(S). Su valor predeterminado es `http://localhost:3000`.

Ejemplo con otro puerto:

```env
DEV_API_PROXY_TARGET=http://localhost:4000
```

Esta variable no afecta el build de producción.

## Desarrollo en el mismo origen lógico

Configuración recomendada:

```env
VITE_API_BASE_URL=/api/v1
DEV_API_PROXY_TARGET=http://localhost:3000
```

El navegador solicita `/api/v1/...` al origen de Vite y el servidor de desarrollo
reenvía `/api` al backend. Esto reproduce el modelo de producción donde Express
sirve tanto la SPA compilada como el API.

## Frontend y backend en orígenes separados

El frontend también acepta una URL HTTP(S) absoluta:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

En ese modelo, el backend debe permitir el origen del frontend y configurar la
cookie de refresh de acuerdo con HTTPS, CORS, `SameSite` y `Secure`.

## Archivos por modo

Vite puede cargar `.env.development`, `.env.production` y sus variantes locales.
El repositorio solo versiona `.env.example`; los archivos reales se suministran
por entorno o por el sistema de despliegue.

Las variables existentes en el proceso tienen prioridad sobre los archivos de
Vite. Cualquier cambio requiere reiniciar el servidor de desarrollo.

## Fallos de configuración

La aplicación no continúa con valores ambiguos. Un error incluye los nombres de
las variables inválidas, sin imprimir sus valores. Ejemplo:

```text
Configuración de entorno inválida: VITE_REQUEST_TIMEOUT: Too small...
```

Este fallo temprano se aplica al desarrollo, al build de producción y al
arranque de la SPA. Las pruebas usan un ambiente explícito y aislado definido en
la configuración de Vitest.
