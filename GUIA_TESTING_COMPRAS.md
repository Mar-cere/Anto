# Guía para Probar Compras In-App sin TestFlight

## Opción 1: Development Build (Recomendado para desarrollo)

### Pasos:

1. **Crear un build de desarrollo:**
```bash
cd frontend
eas build --profile development --platform ios
```

2. **Instalar en tu dispositivo:**
   - EAS te dará un link para descargar el build
   - Instálalo en tu iPhone/iPad

3. **Configurar cuenta Sandbox en tu dispositivo:**
   - Ve a: Configuración > App Store > Sandbox Account
   - Inicia sesión con una cuenta de prueba de Apple (creada en App Store Connect)

4. **Probar compras:**
   - Las compras se procesarán en el entorno sandbox
   - No se cobrará dinero real
   - Puedes probar todos los flujos

### Ventajas:
- ✅ Rápido de generar
- ✅ Puedes hacer cambios y probar inmediatamente
- ✅ Acceso completo a logs y debugging
- ✅ Funciona con sandbox de Apple

### Desventajas:
- ⚠️ Requiere cuenta de prueba de Apple
- ⚠️ No es exactamente igual a producción

---

## Opción 2: Preview Build (Más cercano a producción)

### Pasos:

1. **Crear un build preview:**
```bash
cd frontend
eas build --profile preview --platform ios
```

2. **Instalar y probar igual que Development Build**

### Ventajas:
- ✅ Más cercano a producción que development
- ✅ Todavía permite debugging
- ✅ Funciona con sandbox

---

## Opción 3: TestFlight (Más cercano a producción real)

### Pasos:

1. **Crear build de producción:**
```bash
cd frontend
eas build --profile production --platform ios
```

2. **Subir a App Store Connect:**
```bash
eas submit --platform ios
```

3. **Configurar TestFlight:**
   - Ve a App Store Connect
   - Agrega testers internos/externos
   - Espera aprobación (puede tomar horas)

### Ventajas:
- ✅ Entorno más cercano a producción
- ✅ Puedes invitar testers externos
- ✅ Apple valida el build

### Desventajas:
- ⚠️ Tarda más (build + aprobación)
- ⚠️ No puedes hacer cambios rápidos

---

## Configuración Necesaria para Sandbox Testing

### 1. Crear cuenta Sandbox en App Store Connect:
   - Ve a: Users and Access > Sandbox Testers
   - Crea una cuenta de prueba (usa un email diferente al de tu Apple ID)

### 2. Configurar productos en App Store Connect:
   - Ve a: My Apps > [Tu App] > In-App Purchases
   - Asegúrate de que todos los productos estén:
     - ✅ Creados
     - ✅ Con estado "Ready to Submit" o "Approved"
     - ✅ Con precios configurados

### 3. En tu dispositivo iOS:
   - Cierra sesión de tu Apple ID real
   - Ve a: Configuración > App Store > Sandbox Account
   - Inicia sesión con la cuenta sandbox

### 4. Probar:
   - Abre la app
   - Intenta comprar una suscripción
   - Usa la contraseña de la cuenta sandbox (no tu contraseña real)

---

## Verificación del Backend

### Asegúrate de que el backend esté configurado para sandbox:

El código ya detecta automáticamente si está en sandbox:
```javascript
const isSandbox = process.env.NODE_ENV !== 'production';
```

### Verificar en backend:
- ✅ `APPLE_SHARED_SECRET` está configurado
- ✅ El backend puede conectarse a Apple Sandbox
- ✅ Los logs muestran `isSandbox: true` en desarrollo

---

## Comandos Útiles

### Ver logs en tiempo real:
```bash
# En desarrollo, los logs aparecen en la consola de Expo
# O usa:
eas build:run --platform ios
```

### Verificar que el módulo nativo esté disponible:
El código ya verifica esto automáticamente. Si ves el error:
"Módulo nativo no disponible. Necesitas hacer prebuild o usar un build nativo"

Significa que estás usando Expo Go, que NO soporta módulos nativos.
Necesitas un development build o build nativo.

---

## Recomendación

**Para desarrollo rápido:** Usa **Development Build**
- Rápido de generar
- Permite debugging
- Funciona con sandbox

**Para pruebas finales:** Usa **TestFlight**
- Más cercano a producción
- Puedes invitar testers
- Apple valida el build

---

## Notas Importantes

1. **Expo Go NO funciona** para compras in-app porque no incluye módulos nativos
2. **Necesitas un build nativo** (development, preview, o production)
3. **Las compras sandbox NO cobran dinero real**
4. **Puedes cancelar suscripciones sandbox** desde Configuración > App Store > Sandbox Account

