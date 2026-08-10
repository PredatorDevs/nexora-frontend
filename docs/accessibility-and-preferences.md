# Accesibilidad, temas y preferencias

La interfaz incluye preferencias locales de apariencia y accesibilidad. Se
accede desde el menú de usuario mediante **Apariencia y accesibilidad**.

## Preferencias disponibles

- Tema `Sistema`, `Claro` u `Oscuro`. En modo sistema, la aplicación escucha
  cambios de `prefers-color-scheme` y se actualiza sin recargar.
- Densidad `Cómoda` o `Compacta`, aplicada mediante los algoritmos de tema de
  Ant Design.
- Contraste reforzado para texto, bordes y foco.
- Reducción explícita de movimiento. Aunque no esté activada, la aplicación
  respeta `prefers-reduced-motion` del sistema operativo mediante el token
  `motion` de Ant Design, sin alterar el ciclo de vida de menús y diálogos.

Las preferencias se guardan en `localStorage` bajo la clave versionada
`predator.ui-preferences.v1`. Son deliberadamente locales al navegador y no
forman parte del perfil de seguridad ni requieren cambios en el backend. Si el
almacenamiento está bloqueado o contiene datos corruptos, se usan valores
seguros predeterminados.

## Selector rápido de tema

`ThemeSwitch` reutiliza `PreferencesProvider` y está disponible:

- en el login, antes de autenticar;
- en el encabezado administrativo, junto al menú del usuario.

El sol amarillo representa el tema claro y la luna blanca el oscuro. El control
expone un nombre accesible dinámico (`Cambiar a tema oscuro` o
`Cambiar a tema claro`) y un tooltip equivalente.

Cuando la preferencia es `Sistema`, el switch representa el tema efectivo
resuelto desde `prefers-color-scheme`. Al accionarlo, selecciona explícitamente
`light` o `dark`. La página completa de preferencias conserva la opción
`Sistema`.

## Base de accesibilidad

- El documento declara español mediante `lang="es"`.
- El layout autenticado expone landmarks de navegación y contenido principal.
- El primer enlace enfocable permite saltar directamente al contenido.
- Todos los elementos interactivos reciben un indicador de foco visible.
- Los controles de preferencias tienen nombres accesibles y estado expuesto.
- La navegación y los menús son utilizables con teclado a través de Ant Design.

## Extensión

Para agregar una preferencia, actualiza el valor predeterminado y su validación
en `src/preferences/preference-storage.js`, expón el control en
`PreferencesPage.jsx` y aplica el efecto desde `PreferencesProvider` o mediante
un atributo `data-*` en el elemento raíz. Cambiar la forma persistida requiere
una nueva versión de la clave o una migración explícita.

La accesibilidad debe validarse además con teclado, zoom al 200 %, modo de alto
contraste del sistema y un lector de pantalla. Las pruebas unitarias cubren el
contrato de persistencia y los landmarks, pero no sustituyen esa revisión.
