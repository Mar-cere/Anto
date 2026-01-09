# Instrucciones para Subir la App a App Store Connect

## Problema: EAS Submit se queda colgado

Si `eas submit` se queda en "waiting for an available submitter", puedes usar Transporter directamente (más rápido y confiable).

## Opción 1: Usar Transporter (Recomendado)

### Paso 1: Descargar el IPA
```bash
# El IPA ya está disponible en:
https://expo.dev/artifacts/eas/oxYbHV2AnrbegJidnJcFK2.ipa
```

O descárgalo desde el dashboard de EAS:
```bash
# Ve a: https://expo.dev/accounts/marceloull/projects/anto/builds
# Descarga el IPA del build más reciente
```

### Paso 2: Instalar Transporter
1. Abre la App Store en tu Mac
2. Busca "Transporter" (es gratis, de Apple)
3. Instálalo

### Paso 3: Subir con Transporter
1. Abre Transporter
2. Arrastra el archivo `.ipa` a Transporter
3. Inicia sesión con tu Apple ID: `marcelo.ull@icloud.com`
4. Haz clic en "Deliver"
5. Espera a que termine (suele ser más rápido que EAS)

### Paso 4: Verificar en App Store Connect
1. Ve a: https://appstoreconnect.apple.com
2. Apps > Anto > TestFlight / App Store
3. Verifica que el build aparezca

---

## Opción 2: Cancelar y Reintentar EAS Submit

Si prefieres seguir usando EAS:

1. **Cancela el proceso actual** (Ctrl+C)

2. **Intenta con el flag `--non-interactive`**:
```bash
eas submit --platform ios --latest --non-interactive
```

3. **O espera más tiempo** (a veces la cola se mueve después de 10-15 minutos)

---

## Opción 3: Usar Xcode (Alternativa)

Si tienes Xcode instalado:

1. Descarga el IPA
2. Abre Xcode
3. Window > Organizer
4. Clic en "+" > "Add" y selecciona el IPA
5. Clic en "Distribute App"
6. Selecciona "App Store Connect"
7. Sigue el asistente

---

## Verificar el Submit

Después de subir, verifica en App Store Connect:
- URL: https://appstoreconnect.apple.com/apps/6756631911/appstore/ios/version
- El build debería aparecer en "TestFlight" o "App Store" en unos minutos

---

## Notas Importantes

- **Build Number**: Actualmente es `8` (en `app.json`)
- **Version**: `1.1.0`
- **Bundle ID**: `com.anto.app`
- **ASC App ID**: `6756631911`

Si necesitas incrementar el build number para la próxima versión:
```json
// En app.json
"ios": {
  "buildNumber": "9"  // Incrementar
}
```

