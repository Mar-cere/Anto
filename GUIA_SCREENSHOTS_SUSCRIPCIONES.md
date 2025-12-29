# Guía de Screenshots para Productos de Suscripción

## Requisitos de Apple

Apple requiere que subas **capturas de pantalla** que muestren cómo se ve cada producto de suscripción dentro de tu app. Esto ayuda a los revisores a entender qué está comprando el usuario.

## Screenshot para Suscripción Semanal

### Qué debe mostrar:

1. **La pantalla de suscripción** con el plan semanal visible
2. **El PlanCard del plan semanal** mostrando:
   - Nombre del plan (ej: "Suscripción Semanal" o "Plan Semanal")
   - Precio (ej: "$2.99" o el precio que hayas configurado)
   - Intervalo "/semana"
   - Características/beneficios del plan
   - Botón "Suscribirse" o similar

### Cómo crear el screenshot:

#### Opción 1: Screenshot de la pantalla completa (Recomendado)

1. Abre la app en un dispositivo iOS o simulador
2. Navega a la pantalla de suscripción (`SubscriptionScreen`)
3. Asegúrate de que el plan semanal esté visible en la pantalla
4. Toma un screenshot (Cmd + S en simulador, o botones físicos en dispositivo)
5. El screenshot debe mostrar:
   - El título "Suscripción Premium" o similar
   - El subtítulo "Todos los planes incluyen el servicio completo..."
   - El PlanCard del plan semanal claramente visible
   - Preferiblemente con el plan semanal en la parte superior o destacado

#### Opción 2: Screenshot enfocado en el PlanCard

1. Toma un screenshot de la pantalla de suscripción
2. Recorta o enfoca en el PlanCard del plan semanal
3. Asegúrate de que se vea:
   - El precio completo
   - El texto "/semana"
   - Las características incluidas

### Ejemplo de lo que debe mostrar:

```
┌─────────────────────────────┐
│  Suscripción Premium        │
│  Todos los planes incluyen   │
│  el servicio completo...     │
│                              │
│  ┌───────────────────────┐   │
│  │ Suscripción Semanal   │   │
│  │ $2.99 /semana         │   │
│  │                       │   │
│  │ ✓ Servicio completo   │   │
│  │   incluido            │   │
│  │                       │   │
│  │ [Suscribirse]         │   │
│  └───────────────────────┘   │
│                              │
│  [Otros planes...]           │
└─────────────────────────────┘
```

## Requisitos Técnicos

- **Formato**: PNG o JPEG
- **Tamaño**: Mínimo 320x568 píxeles (iPhone SE)
- **Recomendado**: 1242x2208 píxeles (iPhone 8 Plus) o mayor
- **Contenido**: Debe ser un screenshot REAL de la app, no un mockup

## Para cada producto de suscripción

Repite este proceso para cada producto:
- ✅ Suscripción Semanal (`com.anto.app.weekly`)
- ✅ Suscripción Mensual (`com.anto.app.monthly`)
- ✅ Suscripción Trimestral (`com.anto.app.quarterly`)
- ✅ Suscripción Semestral (`com.anto.app.semestral`)
- ✅ Suscripción Anual (`com.anto.app.yearly`)

**Nota**: Puedes usar el mismo screenshot si todos los planes se ven en la misma pantalla, pero es mejor tener uno específico para cada producto.

## Tips

1. **Usa el simulador de iOS** para tomar screenshots consistentes
2. **Asegúrate de que el precio sea visible** - Apple verifica que coincida con el precio configurado
3. **Muestra la UI real** - No uses mockups o diseños
4. **El plan debe estar destacado** - Si hay múltiples planes, asegúrate de que el plan semanal sea claramente visible
5. **Usa datos reales** - El precio debe coincidir con el configurado en App Store Connect

## Dónde subir el screenshot

1. Ve a **App Store Connect** → Tu App → **Features** → **In-App Purchases**
2. Selecciona el producto "Suscripción Semanal" (`com.anto.app.weekly`)
3. Ve a la sección **Screenshots** o **App Store Screenshot**
4. Haz clic en "Seleccionar archivo" o arrastra el screenshot
5. Sube el archivo

## Verificación

Antes de subir, verifica que el screenshot:
- [ ] Muestra la UI real de la app
- [ ] El plan semanal es claramente visible
- [ ] El precio es legible y coincide con App Store Connect
- [ ] El texto "/semana" es visible
- [ ] No es un mockup o diseño
- [ ] Está en el formato correcto (PNG/JPEG)

