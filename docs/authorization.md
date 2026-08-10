# Autorización y RBAC

## Principio

La interfaz decide visibilidad y navegación usando permisos efectivos con forma
`resource.action`. Nunca compara nombres de roles como `ADMIN` o `SUPER_ADMIN`.

El frontend mejora la experiencia; el backend sigue siendo la autoridad y valida
cada operación protegida.

## Catálogo

`src/config/permissions.js` refleja los 14 permisos implementados por el backend
y ofrece constantes agrupadas:

```js
permissions.users.read;
permissions.users.create;
permissions.roles.assignPermissions;
permissions.sessions.revoke;
```

Las pruebas contienen una copia explícita del catálogo del backend para detectar
adiciones, eliminaciones o cambios durante el desarrollo. Un código desconocido
o mal formado se considera denegado.

## Reglas de evaluación

Las utilidades aceptan arrays o sets de permisos efectivos:

```js
hasPermission(effective, 'users.read');
hasAnyPermission(effective, ['users.update', 'users.change_status']);
hasAllPermissions(effective, ['roles.read', 'roles.assign_permissions']);
```

Las listas vacías y la ausencia de requisitos se deniegan. Cuando se combinan
`permission`, `anyOf` y `allOf`, todas las condiciones declaradas deben resultar
verdaderas.

## Autorización visual

`Can` controla fragmentos de interfaz:

```jsx
<Can permission={permissions.users.create}>
  <CreateUserButton />
</Can>
```

```jsx
<Can
  anyOf={[permissions.users.update, permissions.users.changeStatus]}
  fallback={<span>Sin acceso</span>}
>
  <UserActions />
</Can>
```

El contenido oculto nunca debe ser la única protección de una operación.

## Protección de rutas

`RequirePermission` funciona como route layout o wrapper:

```jsx
{
  element: <RequirePermission permission={permissions.users.read} />,
  children: [{ path: '/users', element: <UserListPage /> }]
}
```

Resultados:

- Sin sesión: `/login`, conservando la ubicación solicitada.
- Con sesión pero sin permiso: `/unauthorized`.
- Con permiso: renderiza el contenido o `Outlet`.

La ruta `/unauthorized` también requiere autenticación, pero no un permiso
administrativo adicional.

## Navegación

`src/config/navigation.js` describe los módulos sin importar Ant Design. Cada
entrada puede declarar `permission` y `enabled`. El flag de auditoría se combina
con `audit.read`: ambos deben permitir el elemento.

`useAuthorizedNavigation()` filtra la configuración para el usuario actual. El
layout administrativo de la siguiente fase consumirá ese resultado; no volverá
a implementar lógica RBAC dentro del sidebar.

La configuración ya reserva rutas para usuarios, roles, permisos, sesiones y
auditoría. Esos módulos se conectarán al router a medida que se implementen y no
se muestran todavía en la interfaz actual.

## Cambios de permisos en sesión

El backend resuelve permisos en cada request. Cuando una operación futura cambie
roles o permisos del usuario actual, deberá actualizar `/auth/permissions`,
recalcular navegación y abandonar la ruta actual si dejó de estar autorizada.
