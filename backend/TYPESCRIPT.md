# TypeScript en el backend

El backend introduce TypeScript de forma **gradual**: primero tipos y contratos, sin obligar a reescribir el código existente.

## Estado actual

- **`tsconfig.json`**: configurado con `strict: true`, `noEmit: true`. Solo se incluye la carpeta `types/` para comprobación de tipos.
- **`types/`**: definiciones de contratos API y auth, alineadas con el frontend (`frontend/src/types/api.types.ts`) cuando aplica:
  - **`api.types.ts`**: `User`, `UserPreferences`, `UserStats`, `UserSubscription`, `LoginResponse`, `ApiErrorResponse`, `ApiSuccessResponse`, `ApiFailResponse`, `ApiResponse<T>`, `Pagination`.
  - **`auth.types.ts`**: `JwtPayload`, `AuthUser`, `AuthenticatedRequest`.
  - **`express.d.ts`**: extensión de `Express.Request` con `req.user?: AuthUser`.
- **Script**: `npm run typecheck` ejecuta `tsc --noEmit` y valida solo los archivos en `types/`.

## Uso

- Ejecutar comprobación de tipos: `npm run typecheck`.
- El resto del backend sigue en JavaScript; no es necesario compilar para arrancar (`node server.js` o `npm run dev`).

## Próximos pasos (opcional)

1. **Usar tipos en JS**: en archivos `.js` se pueden referenciar tipos con JSDoc (`@typedef`, `@param`, etc.) apuntando a los tipos de `types/` (por ejemplo generando `.d.ts` con `declaration: true` y `emitDeclarationOnly`, y referenciando desde JSDoc).
2. **Convertir módulos a TS**: ir pasando archivos críticos (p. ej. `config/config.js`, servicios, rutas) a `.ts`. Para ejecutarlos sin build se puede usar `tsx` en dev; en producción, compilar con `tsc` y ejecutar `node dist/...`.
3. **Contratos compartidos**: si se crea un paquete o carpeta compartida entre frontend y backend, los tipos de `types/` pueden moverse allí para una única fuente de verdad.

## Dependencias añadidas

- `typescript` (~5.7)
- `@types/node`, `@types/express`
