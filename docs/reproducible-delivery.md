# CI/CD y artefactos reproducibles (fase 17)

El workflow ejecuta en pull requests, `main` y etiquetas `v*`. Usa Node
`22.15.1`, npm `10.9.2` y `npm ci` con el lockfile versionado. La verificación
incluye formato, lint, cobertura, build validado y Playwright con Chromium.

Después de aprobar las verificaciones se genera
`predator-frontend-<commit>.tar.gz`. Los archivos se ordenan, propietario y
grupo se normalizan, el tiempo proviene del commit y gzip no guarda timestamp.
El pipeline construye dos copias y exige igualdad byte a byte.

`artifact-manifest.json` contiene tamaño y SHA-256 de cada archivo de `dist`.
El artefacto de GitHub incluye además el checksum del paquete y un SBOM
CycloneDX independiente. Para verificar una descarga:

```bash
sha256sum --check predator-frontend-<commit>.tar.gz.sha256
tar -xzf predator-frontend-<commit>.tar.gz
node scripts/verify-artifact-manifest.mjs dist
```

Los ambientes deben promover exactamente el mismo archivo identificado por
commit y checksum. No se debe reconstruir el frontend por ambiente; la
configuración pública `VITE_*` forma parte del artefacto y debe definirse en el
job de build aprobado.

Dependabot agrupa las actualizaciones npm y revisa mensualmente las acciones de
CI. Cualquier cambio de toolchain o lockfile debe pasar el pipeline completo.
