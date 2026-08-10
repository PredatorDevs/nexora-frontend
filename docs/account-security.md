# Perfil y seguridad de cuenta (fase 15)

`/profile` permite editar el nombre visible y cambiar la contraseña propia.
El menú de usuario enlaza a esta pantalla. El cambio de contraseña reemplaza
el access token en memoria y el backend revoca las demás sesiones.

Si login o recuperación de sesión devuelve `mustChangePassword: true`,
`RequireAuth` redirige a `/change-password`. Esa ruta solo muestra el formulario
de contraseña y no permite volver al panel hasta completar el cambio.

En el detalle de usuario, `users.reset_password` habilita el reset
administrativo. El formulario permite definir una contraseña temporal y si se
exige el cambio al siguiente acceso; el backend revoca todas las sesiones del
usuario afectado.

Contrato nuevo:

- `PUT /auth/profile`: `{ displayName }`.
- `POST /auth/change-password`: `{ currentPassword, newPassword }` y devuelve
  `{ user, accessToken }`.
- `POST /users/:id/reset-password`: `{ password, mustChangePassword }`.
- Las representaciones autenticadas y administrativas incluyen
  `mustChangePassword`.
