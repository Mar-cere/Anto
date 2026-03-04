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

## Guideline 3.1.2 - Enlaces EULA y Política de Privacidad

Apple exige enlaces **funcionales y visibles** a:
1. **Terms of Use (EULA)** – Términos de Uso
2. **Privacy Policy** – Política de Privacidad

### En la app (ya implementado)
- En la pantalla **Suscripción Premium**, los enlaces aparecen **al inicio** (sin hacer scroll) con el título "Términos y Política de Privacidad".
- También hay una línea antes de los planes: "Al suscribirte aceptas nuestros Términos de Uso (EULA) y Política de Privacidad" con enlaces táctiles.
- URLs usadas: `https://www.antoapps.com/terminos` y `https://www.antoapps.com/privacidad`.

### En App Store Connect (metadata) – obligatorio

1. Entra en [App Store Connect](https://appstoreconnect.apple.com) → tu app **Anto** → **App Information** (información general de la app, no de la versión).

2. **Campo "Privacy Policy URL" (obligatorio)**  
   En **App Information** hay un campo dedicado **Privacy Policy URL**. Es obligatorio para publicar.  
   - Rellénalo con: `https://www.antoapps.com/privacidad`

3. **Descripción de la app (App Description)**  
   En la versión que envías a revisión (p. ej. en la ficha de la versión iOS), en el texto de la descripción, incluye también los enlaces (Apple lo pide explícitamente para EULA). Por ejemplo al final:
   ```
   Términos de Uso (EULA): https://www.antoapps.com/terminos
   Política de Privacidad: https://www.antoapps.com/privacidad
   ```

4. **EULA (si usas EULA personalizado)**  
   - En la ficha de la app: **App Information** → **License Agreement (EULA)**.  
   - Si usas el EULA estándar de Apple, no hace falta cambiar esto; basta con el enlace en la descripción.

5. **Review Notes (opcional pero útil)**  
   En "App Review Information" puedes escribir por ejemplo:
   ```
   Enlaces requeridos (Guideline 3.1.2):
   - Terms of Use (EULA): En pantalla "Suscripción Premium", sección superior "Términos y Política de Privacidad", primer enlace. URL: https://www.antoapps.com/terminos
   - Privacy Policy: Misma sección, segundo enlace. URL: https://www.antoapps.com/privacidad
   ```

6. Comprueba que **https://www.antoapps.com/terminos** y **https://www.antoapps.com/privacidad** abran correctamente en el navegador antes de enviar a revisión.

---

## Notas Importantes

- **Build Number**: Actualmente es `14` (en `app.json`)
- **Version**: `1.1.0`
- **Bundle ID**: `com.anto.app`
- **ASC App ID**: `6756631911`

Si necesitas incrementar el build number para la próxima versión:
```json
// En app.json
"ios": {
  "buildNumber": "14"  // Incrementar para cada envío
}
```

