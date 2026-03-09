# TypeScript en el frontend

Migración gradual a TypeScript para contratos con el API y refactors más seguros.

## Hecho

- **tsconfig.json**: `allowJs: true`, `paths` `@/*` → `./src/*`, `include` de `src/**/*.js` para coexistencia JS/TS.
- **Tipos compartidos** (`src/types/`):
  - `api.types.ts`: `User`, `UserPreferences`, `UserStats`, `UserSubscription`, `LoginCredentials`, `LoginResponse`, `LoginResult`, `CheckAuthResult`, `ApiError`, `ApiErrorResponse`, `ApiGetResponse`.
  - `auth.types.ts`: `AuthContextValue`.
  - `index.ts`: re-export de todos los tipos.
- **config/api.ts**: Cliente API migrado a TypeScript; métodos `api.get/post/put/patch/delete` genéricos (`api.get<MiTipo>()`), `login()` y `checkAuthStatus()` tipados. Mismo comportamiento que antes.

## Uso

```ts
import { api, ENDPOINTS } from '@/config/api';
import type { User, LoginResultType } from '@/types';

const data = await api.get<{ plans: Record<string, unknown> }>(ENDPOINTS.PAYMENT_PLANS);
const result = await login({ email: 'a@b.com', password: 'xxx' });
if (result.success) {
  const user: User = result.data.user;
}
```

## Próximos pasos (orden sugerido)

1. **Pantallas y hooks que consumen el API**  
   Añadir genéricos donde haga falta, p. ej. `api.get<SubscriptionStatusResponse>(ENDPOINTS.PAYMENT_SUBSCRIPTION_STATUS)`.

2. **AuthContext**  
   Convertir `AuthContext.js` → `AuthContext.tsx` y tipar con `AuthContextValue`; tipar `user` como `User | null`.

3. **Servicios**  
   Convertir `userService.js`, `paymentService.js`, etc. a `.ts` e importar tipos desde `@/types`.

4. **Constantes y navegación**  
   Tipar `constants/routes`, `constants/translations` y parámetros de navegación (React Navigation types).

5. **Componentes**  
   Ir pasando componentes a `.tsx` y tipar props con interfaces.

6. **Backend**  
   Valorar añadir TypeScript en backend (tsconfig, compilar a `dist/` o usar ts-node); tipar modelos y rutas para alinear contratos con el frontend.

## Notas

- Los archivos `.js` existentes siguen funcionando; no es obligatorio convertirlos de golpe.
- El alias `@/*` está en `tsconfig`; si Metro no resolviera `@/`, revisar `babel.config.js` o `metro.config.js` para `babel-plugin-module-resolver` con el mismo alias.
