# Sistema de Facturación

Aplicación web de facturación para Honduras. El frontend es React/TypeScript con Vite; el backend es Fastify expuesto en Vercel Functions y persiste datos en PostgreSQL (Neon).

## Estado y enlaces

- Producción: https://sistema-facturacion-zeta.vercel.app/
- Proyecto Vercel: https://vercel.com/marlzzetas-projects/sistema-facturacion
- Rama de producción: `master`. Un merge a esa rama inicia el despliegue automático.
- El PR #7 (persistencia administrativa y corrección de login en Preview) fue fusionado a `master` el 16-09-2026. No hay que volver a aplicar sus commits.
- Este README describe el código; las credenciales, los valores de entorno y el estado de la base de datos viven fuera de Git.

## Mapa del código

- `src/`: interfaz React. `src/auth/AuthContext.tsx` gestiona la sesión, carga datos al iniciar y sincroniza el workspace. `src/store/index.ts` mantiene el estado de la interfaz.
- `src/modules/`: pantallas de administración, catálogos y facturas.
- `api/index.ts`: entrada de la Function de Vercel. `vercel.json` reescribe `/api/*` hacia ella.
- `server/app.ts`: rutas Fastify, cookies, validación de origen, CSRF y permisos.
- `server/auth/`, `server/company/`, `server/clients/`, `server/invoices/`, `server/workspace/`: lógica del servidor.
- `shared/contracts.ts`: validación y tipos compartidos de la API.
- `database/migrations/`: esquema PostgreSQL versionado. No edites una migración ya aplicada; agrega otra con el siguiente número.
- `server/*.test.ts`: pruebas de backend con una base PostgreSQL embebida.

Datos persistidos: usuarios y membresías, empresa y logo, clientes, facturas y su anulación, y configuración administrativa (`company_workspace`). El estado React es de interfaz; no se usa localStorage como base de datos. Hay que comprobar cada flujo nuevo de punta a punta contra la API antes de declararlo persistente.

## Desarrollo y verificación

Requiere Node.js 22 y PostgreSQL. Copia `.env.example` a un archivo `.env` privado y usa credenciales de desarrollo; nunca subas ese archivo a Git. El proyecto no carga `.env` automáticamente en todos los comandos: exporta sus variables al entorno de los procesos cuando corresponda.

```sh
npm ci
npm run db:migrate
npm run server:dev
npm run dev
```

Los dos últimos comandos corren en terminales separadas. El frontend hace llamadas relativas a `/api/v1`; para desarrollo local hay que servir frontend y API bajo el mismo origen o configurar un proxy de desarrollo. `vite.config.ts` no define actualmente ese proxy. No uses el seed de desarrollo en producción.

Antes de publicar:

```sh
npm test
npm run lint
npm run server:typecheck
npm run build
```

## Vercel, base de datos y secretos

`npm run vercel-build` aplica migraciones y compila el frontend. La función usa `DATABASE_URL` y `APP_ORIGIN` del entorno de Vercel; si `APP_ORIGIN` no está definido, toma el URL de despliegue de Vercel. En producción se exige HTTPS y SSL para PostgreSQL. `APP_ORIGIN` admite una lista de orígenes exactos separada por comas; solicitudes HTTPS del mismo host de un Preview también son válidas. No publiques valores de `DATABASE_URL`, hashes ni contraseñas en issues, PR o documentación.

El backend no crea automáticamente cuentas de producción. La cuenta inicial debe provisionarse y custodiarse por un administrador. `server/seed.ts` es únicamente de desarrollo y no se invoca durante `vercel-build`. Si se pierde la contraseña administrativa, hay que ejecutar un procedimiento de recuperación autorizado, no volver a sembrar producción ni exponer una contraseña en el código.

## Seguridad

- Contraseñas con Argon2; sesión mediante cookie HttpOnly, Secure y SameSite=Lax.
- Mutaciones autenticadas con token CSRF; permisos por rol y comprobación de origen.
- Límite de intentos fallidos: tras 5 errores, bloqueo de 15 minutos.
- Auditoría de cambios en `audit_events`.

Estas protecciones no sustituyen una revisión de seguridad, respaldo y restauración de Neon, monitoreo y pruebas funcionales con usuarios reales antes de operar datos fiscales reales. Confirma los requisitos vigentes del SAR con asesoría competente.

## Diagnóstico y continuidad

- Si el sitio no refleja un merge, revisa que el último despliegue de `master` esté **Ready** en Vercel y que el dominio público apunte a ese despliegue.
- Si login falla: 403 indica rechazo de origen; 401 indica sesión ausente o credenciales incorrectas. `GET /api/v1/auth/session` devuelve 401 antes de iniciar sesión y eso es normal.
- Consulta Runtime Logs del despliegue exacto; no confundas un Preview viejo con producción.
- Si un dato aparece solo en la pantalla, revisa la ruta de escritura, la respuesta de API y la recarga desde PostgreSQL.
- Para otra IA: lee primero este README, luego `shared/contracts.ts`, `server/app.ts`, `src/auth/AuthContext.tsx` y las migraciones. Inspecciona el estado actual de Git y Vercel; no asumas que el Preview visible es producción. No alteres datos reales ni secretos durante QA.

El código documenta la implementación actual, no garantiza que todos los flujos de negocio y requisitos fiscales estén completos.
