# 🔐 Implementación del Sistema de Roles

## ✅ Cambios Implementados

### 1. Modelo User
- ✅ Agregado campo `role` con valores: `'user'`, `'admin'`, `'moderator'`
- ✅ Valor por defecto: `'user'`
- ✅ Índice agregado para búsquedas eficientes

### 2. Middleware de Autenticación
- ✅ `authenticateToken` actualizado para incluir rol en `req.user`
- ✅ Si el token no tiene rol, se obtiene de la base de datos
- ✅ Compatible con tokens antiguos (default a 'user')

### 3. Middleware de Autorización
- ✅ `isAdmin` implementado en:
  - `backend/routes/metricsRoutes.js`
  - `backend/routes/paymentMetricsRoutes.js`
  - `backend/routes/paymentRecoveryRoutes.js`
- ✅ Verifica que `req.user.role === 'admin'`
- ✅ Retorna 403 si el usuario no es admin

### 4. Generación de Tokens
- ✅ `generateTokens` actualizado para incluir rol en JWT
- ✅ Tokens de acceso y refresh incluyen el rol
- ✅ Actualizado en registro, login y refresh token

### 5. Rutas Protegidas

#### Rutas que requieren rol `admin`:
- ✅ `GET /api/metrics/system` - Métricas del sistema
- ✅ `GET /api/metrics/health` - Estadísticas de salud
- ✅ `GET /api/metrics/type/:type` - Métricas por tipo
- ✅ `GET /api/payments/metrics/overview` - Métricas de pagos
- ✅ `GET /api/payments/metrics/unactivated` - Pagos no activados
- ✅ `GET /api/payments/metrics/health` - Salud del sistema de pagos
- ✅ `GET /api/payments/recovery/unactivated` - Lista de pagos no activados
- ✅ `POST /api/payments/recovery/activate/:transactionId` - Activar suscripción
- ✅ `POST /api/payments/recovery/process-all` - Procesar todos los pagos no activados

### 6. Scripts de Gestión

#### `backend/scripts/manageUserRole.js`
Script para asignar roles a usuarios:
```bash
node scripts/manageUserRole.js <email|username> <role>
```

Ejemplos:
```bash
# Asignar rol admin
node scripts/manageUserRole.js admin@example.com admin

# Asignar rol user
node scripts/manageUserRole.js usuario123 user
```

#### `backend/scripts/listUsersByRole.js`
Script para listar usuarios por rol:
```bash
# Listar todos los usuarios agrupados por rol
node scripts/listUsersByRole.js

# Listar usuarios de un rol específico
node scripts/listUsersByRole.js admin
```

## 🔒 Seguridad

### Protecciones Implementadas:
1. ✅ Verificación de autenticación antes de verificar rol
2. ✅ Mensajes de error claros sin exponer información sensible
3. ✅ Código de estado HTTP 403 para acceso denegado
4. ✅ Rol incluido en JWT para evitar consultas a BD en cada request

### Compatibilidad:
- ✅ Compatible con usuarios existentes (rol default: 'user')
- ✅ Compatible con tokens antiguos (obtiene rol de BD si no está en token)
- ✅ Los nuevos tokens incluyen el rol automáticamente

## 📋 Próximos Pasos Recomendados

### 1. Asignar Rol Admin a Usuario Inicial
```bash
# Ejemplo: Asignar rol admin a tu usuario
node scripts/manageUserRole.js tu-email@example.com admin
```

### 2. Verificar Usuarios por Rol
```bash
# Ver todos los usuarios y sus roles
node scripts/listUsersByRole.js

# Ver solo administradores
node scripts/listUsersByRole.js admin
```

### 3. Consideraciones Adicionales
- ⚠️ **Importante**: Los usuarios existentes tienen rol `'user'` por defecto
- ⚠️ **Seguridad**: Solo asigna rol `admin` a usuarios de confianza
- ⚠️ **Tokens**: Los tokens antiguos seguirán funcionando, pero se recomienda hacer login nuevamente para obtener tokens con rol

## 🧪 Pruebas

### Probar Acceso Admin:
1. Asignar rol admin a un usuario
2. Hacer login para obtener nuevo token con rol
3. Intentar acceder a `/api/metrics/system`
4. Debe retornar 200 OK

### Probar Acceso Denegado:
1. Usar token de usuario normal (rol 'user')
2. Intentar acceder a `/api/metrics/system`
3. Debe retornar 403 Forbidden con mensaje:
```json
{
  "success": false,
  "message": "Acceso denegado. Se requiere rol de administrador.",
  "required": "admin",
  "current": "user"
}
```

## 📝 Notas Técnicas

- El middleware `authenticateToken` es async y obtiene el rol de la BD si no está en el token
- Express maneja automáticamente los middlewares async
- El rol se incluye en `req.user.role` después de la autenticación
- Los tokens JWT incluyen el rol para evitar consultas a BD en cada request

