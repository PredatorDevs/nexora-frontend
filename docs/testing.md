# Estrategia de pruebas

El boilerplate utiliza una pirámide de pruebas con responsabilidades separadas.

## Pruebas unitarias

```bash
npm run test:unit
```

Validan schemas, utilidades, estado de autenticación, autorización y componentes
compartidos. Deben ser rápidas y no realizan solicitudes de red reales.

## Pruebas de integración

```bash
npm run test:integration
```

Ejercitan componentes y contratos HTTP mediante MSW. Las respuestas respetan el
envelope real del backend, incluyendo paginación, errores y `requestId`. Los
fixtures reutilizables viven en `tests/helpers`.

## Pruebas end-to-end

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright inicia Vite en `http://127.0.0.1:4173`. Los escenarios interceptan
`/api/v1` desde el navegador y simulan el backend, por lo que son deterministas,
no requieren una base de datos y no modifican datos reales. Cubren:

- Inicio de sesión y creación administrativa de usuarios.
- Protección de rutas mediante permisos efectivos.
- Mensajes seguros ante credenciales inválidas.

Estas pruebas no sustituyen la comprobación manual con ambos proyectos. Antes de
una entrega debe ejecutarse también un smoke test contra el backend real para
detectar diferencias de despliegue, cookies, proxy y CORS.

## Suite y cobertura

```bash
npm test
npm run test:coverage
```

`npm test` ejecuta todas las pruebas de Vitest. La cobertura genera salida de
texto y un reporte HTML en `coverage/`. No se persiguen porcentajes inflados:
deben priorizarse autenticación, contratos, permisos y mutaciones sensibles.
Como protección contra regresiones, la configuración exige como mínimo 50 % de
sentencias y líneas, y 40 % de ramas y funciones. Estos umbrales deben crecer
con la cobertura útil del proyecto, no disminuirse para aceptar una regresión.

## Convenciones

- Cada prueba debe poder ejecutarse de forma aislada y en cualquier orden.
- No se usan credenciales, secretos ni bases de datos reales en automatización.
- Los errores de API se representan mediante el envelope del backend.
- Los selectores E2E priorizan roles y nombres accesibles.
- Una corrección de regresión debe incorporar una prueba que reproduzca el
  comportamiento cuando resulte razonable.
