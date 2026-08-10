# Cliente HTTP

## Propósito

Toda comunicación con el backend pasa por `src/api/api-client.js`. Páginas,
componentes y módulos no deben importar Axios directamente ni depender de su
estructura de errores.

El cliente implementa el contrato de `nexora-backend`: base
`/api/v1`, Bearer access token, refresh en cookie HttpOnly y envelopes uniformes.

## Respuesta pública

Cada método resuelve un objeto normalizado:

```js
{
  (data, meta, status, headers);
}
```

`meta` conserva `requestId` y, para listados, `pagination`:

```js
const response = await apiClient.get('/users', {
  params: { page: 1, pageSize: 20 },
});

response.data;
response.meta.pagination;
response.meta.requestId;
```

Un envelope de éxito mal formado produce `INVALID_API_RESPONSE`; no se entrega
silenciosamente a la interfaz.

## Errores

Todo rechazo público es `ApiError` y contiene:

```js
{
  (code, message, status, details, requestId);
}
```

Los errores uniformes del backend conservan su código, detalles y request ID.
Los fallos sin respuesta se normalizan como:

| Código                 | Significado                                        |
| ---------------------- | -------------------------------------------------- |
| `NETWORK_ERROR`        | No se recibió respuesta del servidor               |
| `REQUEST_TIMEOUT`      | Axios agotó el timeout configurado                 |
| `REQUEST_CANCELED`     | El consumidor canceló con `AbortSignal`            |
| `INVALID_API_RESPONSE` | El servidor respondió fuera del contrato           |
| `HTTP_ERROR`           | Hubo respuesta HTTP sin error uniforme reconocible |
| `UNKNOWN_ERROR`        | Fallo ajeno a Axios y `ApiError`                   |

Ejemplo de cancelación:

```js
const controller = new AbortController();
const request = apiClient.get('/users', { signal: controller.signal });
controller.abort();
await request;
```

## Access token

`access-token-store.js` mantiene el token en una variable de módulo. No usa APIs
de almacenamiento persistente. El interceptor lee el valor más reciente antes
de cada solicitud y añade `Authorization: Bearer <accessToken>`.

El futuro `AuthProvider` podrá establecer o limpiar este store mediante las
operaciones de autenticación sin exponer el token a componentes.

## Refresh coordinado

Ante un `401` elegible:

1. Se crea o reutiliza una única promesa de `POST /auth/refresh`.
2. Axios incluye la cookie HttpOnly mediante `withCredentials: true`.
3. El access token nuevo reemplaza al anterior en memoria.
4. La solicitud original se reintenta una sola vez.
5. Si el refresh falla, se limpia el token y se notifica una vez al manejador de
   sesión expirada.

Un `401` atrasado compara el token usado originalmente con el token actual. Si
otra solicitud ya renovó la sesión, se reintenta con el token nuevo sin ejecutar
otro refresh.

No se intenta refresh cuando:

- La respuesta es `403` u otro estado diferente de `401`.
- La solicitud es login o el propio refresh.
- La solicitud ya fue reintentada.
- El consumidor establece `skipAuthRefresh: true`.

## Integración con autenticación

El cliente no importa React ni el contexto de autenticación. El `AuthProvider`
registrará un callback:

```js
apiClient.setSessionExpiredHandler((error) => {
  // Limpiar usuario, permisos y caché privada; redirigir cuando corresponda.
});
```

El callback puede ser asíncrono. Si falla, el cliente conserva y propaga el
`ApiError` original. Para recuperar la sesión al arrancar:

```js
await apiClient.refreshSession();
```

## Creación de módulos

Los módulos encapsulan rutas concretas en archivos `*.api.js`:

```js
export function listUsers(filters) {
  return apiClient.get('/users', { params: filters });
}
```

Así Axios, refresh y envelopes permanecen fuera de páginas, hooks y formularios.
