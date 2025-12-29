# Guía de Configuración de StoreKit

## Pasos para Configurar In-App Purchase en App Store Connect

### 1. Crear Productos de Suscripción

**IMPORTANTE**: Las suscripciones NO son productos consumibles ni no consumibles. Son un tipo especial llamado **Auto-Renewable Subscription** (Suscripción de Renovación Automática).

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona tu app
3. Ve a **Features** → **In-App Purchases**
4. Haz clic en **+** para crear un nuevo producto
5. **Selecciona "Auto-Renewable Subscription"** (NO selecciones Consumable ni Non-Consumable)

#### Tipos de Productos en App Store:

- **Consumable** (Consumible): Se puede comprar múltiples veces (ej: monedas, vidas)
- **Non-Consumable** (No Consumible): Se compra una vez y es permanente (ej: desbloquear funcionalidad)
- **Auto-Renewable Subscription** (Suscripción de Renovación Automática): **← ESTE ES EL CORRECTO** para suscripciones que se renuevan automáticamente

#### Productos Requeridos

Crea los siguientes productos con estos **Product IDs exactos**:

| Product ID | Nombre | Duración | Descripción |
|------------|--------|----------|-------------|
| `com.anto.app.weekly` | Suscripción Semanal | 1 semana | Acceso completo por 7 días |
| `com.anto.app.monthly` | Suscripción Mensual | 1 mes | Acceso completo por 30 días |
| `com.anto.app.quarterly` | Suscripción Trimestral | 3 meses | Acceso completo por 90 días |
| `com.anto.app.semestral` | Suscripción Semestral | 6 meses | Acceso completo por 180 días |
| `com.anto.app.yearly` | Suscripción Anual | 1 año | Acceso completo por 365 días |

### 2. Configurar Precios

Para cada producto:
1. Selecciona el producto
2. Ve a **Pricing and Availability**
3. Configura el precio base (por ejemplo, $9.99 USD para mensual)
4. Apple ajustará automáticamente los precios para otros países

### 3. Configurar Shared Secret

1. Ve a **App Store Connect** → Tu App → **App Information**
2. En la sección **App Store Connect API**, genera una **Shared Secret** si no la tienes
3. Copia el **Shared Secret**
4. Agrega esta variable de entorno en tu backend:

```bash
APPLE_SHARED_SECRET=tu_shared_secret_aqui
```

### 4. Configurar Grupos de Suscripción (Opcional pero Recomendado)

1. Ve a **Features** → **Subscription Groups**
2. Crea un grupo llamado "Anto Premium" (o similar)
3. Agrega todos tus productos de suscripción a este grupo
4. Esto permite que los usuarios cambien entre planes fácilmente

### 5. Configurar Información de Localización

Para cada producto, agrega:
- **Display Name**: Nombre que verá el usuario (ej: "Suscripción Mensual")
- **Description**: Descripción del producto (ej: "Acceso completo a todas las funciones de Anto")

### 6. Configurar Screenshots (Recomendado)

Apple requiere screenshots que muestren cómo se ve cada producto en la app.

**Para cada producto de suscripción:**
1. Toma un screenshot de la pantalla de suscripción mostrando el plan específico
2. El screenshot debe mostrar:
   - El PlanCard del plan con precio visible
   - El intervalo (ej: "/semana", "/mes")
   - Las características incluidas
   - La UI real de la app (no mockups)

**Ejemplo para Suscripción Semanal:**
- Screenshot de `SubscriptionScreen` con el PlanCard del plan semanal visible
- Debe mostrar el precio (ej: "$2.99 /semana")
- Debe mostrar las características del plan

Ver `GUIA_SCREENSHOTS_SUSCRIPCIONES.md` para instrucciones detalladas.

## Configuración del Código

### Variables de Entorno Requeridas

En tu archivo `.env` del backend:

```bash
# Apple App Store
APPLE_SHARED_SECRET=tu_shared_secret_de_app_store_connect
```

### Product IDs en el Código

Los Product IDs están definidos en `frontend/src/services/storeKitService.js`:

```javascript
const PRODUCT_IDS = {
  weekly: 'com.anto.app.weekly',
  monthly: 'com.anto.app.monthly',
  quarterly: 'com.anto.app.quarterly',
  semestral: 'com.anto.app.semestral',
  yearly: 'com.anto.app.yearly',
};
```

**IMPORTANTE**: Estos IDs deben coincidir EXACTAMENTE con los configurados en App Store Connect.

## Testing

### Sandbox Testing

1. Crea una cuenta de prueba en App Store Connect:
   - Ve a **Users and Access** → **Sandbox Testers**
   - Crea un usuario de prueba con un email diferente

2. En tu dispositivo iOS:
   - Cierra sesión de tu cuenta de App Store real
   - Cuando compres, usa la cuenta de prueba
   - Los productos aparecerán como "Sandbox"

3. Verifica que:
   - Los productos se cargan correctamente
   - Las compras se procesan
   - Los recibos se validan en el backend
   - Las suscripciones se activan

### Testing en Producción

1. Sube un build a TestFlight
2. Usa una cuenta real de App Store (no sandbox)
3. Realiza una compra de prueba
4. Verifica el flujo completo

## Verificación de Recibos

El backend valida los recibos automáticamente:
- En desarrollo: usa sandbox de Apple
- En producción: usa producción de Apple
- Si un recibo de sandbox se envía a producción, se reenvía automáticamente a sandbox

## Troubleshooting

### Error: "No products found"
- Verifica que los Product IDs coincidan exactamente
- Asegúrate de que los productos estén en estado "Ready to Submit" o "Approved"
- Verifica que estés usando la cuenta correcta de App Store

### Error: "Invalid receipt"
- Verifica que `APPLE_SHARED_SECRET` esté configurado correctamente
- Asegúrate de que el recibo no haya expirado
- Verifica que estés usando el ambiente correcto (sandbox vs producción)

### Error: "Product ID not recognized"
- Verifica que el Product ID esté en `PRODUCT_IDS` en `storeKitService.js`
- Verifica que el Product ID exista en App Store Connect

## Notas Importantes

1. **Los productos deben estar aprobados** antes de poder usarlos en producción
2. **El Shared Secret es sensible** - no lo compartas públicamente
3. **Las suscripciones se renuevan automáticamente** - el usuario debe cancelar desde Configuración de Apple
4. **Los recibos deben validarse en el servidor** - nunca confíes solo en la validación del cliente

## Referencias

- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)

