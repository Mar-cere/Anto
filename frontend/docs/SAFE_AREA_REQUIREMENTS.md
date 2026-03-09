# Requisitos de SafeAreaProvider

## Resumen

La app usa `react-native-safe-area-context` para respetar las áreas seguras (notch, barra de estado, etc.). **Todos los componentes que usan `useSafeAreaInsets()` o `SafeAreaView` de esta librería deben estar dentro de un `SafeAreaProvider`.**

## Configuración actual (App.tsx)

```
SafeAreaProvider (con initialMetrics para evitar errores en carga inicial)
  └─ ErrorBoundary
      └─ AuthProvider
          └─ ToastProvider
              └─ AppNavigator, Toast, etc.
```

## Componentes que usan useSafeAreaInsets

- **Toast** – padding inferior
- **FloatingNavBar** – padding inferior
- **SubscriptionScreen**, **SettingsScreen**, **PaymentMethodScreen**
- **TransactionHistoryScreen**
- **Técnicas**: ActivitySuggestionScreen, BoundarySettingScreen, BreathingExerciseScreen, etc.
- **PaymentWebView**
- **TechniqueDetailScreen**, **TherapeuticTechniquesScreen**, **TherapeuticTechniquesStatsScreen**

## Reglas para evitar errores

1. **Nunca** mover `SafeAreaProvider` por debajo de componentes que usen `useSafeAreaInsets`.
2. **Nunca** renderizar Toast, FloatingNavBar ni pantallas con `useSafeAreaInsets` fuera del árbol de `SafeAreaProvider`.
3. Si se añade un nuevo punto de entrada (ej. pantalla de splash), asegurarse de que esté dentro de `SafeAreaProvider` o que no use `useSafeAreaInsets`.
4. El fallback `DEFAULT_SAFE_AREA_METRICS` en App.tsx evita errores cuando `initialWindowMetrics` es null (web, SSR, o módulo nativo no listo).

## Error típico

```
Error: No safe area value available. Make sure you are rendering <SafeAreaProvider> at the top of your app.
```

**Causa:** Un componente que usa `useSafeAreaInsets()` se está renderizando sin un `SafeAreaProvider` como ancestro.

**Solución:** Verificar que `SafeAreaProvider` envuelva toda la app en `App.tsx` y que `initialMetrics` tenga un fallback cuando sea null.
