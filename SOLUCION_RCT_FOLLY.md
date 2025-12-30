# Solución para Error RCT-Folly con react-native-iap

## Problema

El error `Unable to find a specification for RCT-Folly depended upon by RNIap` ocurre porque `react-native-iap` requiere `RCT-Folly`, una dependencia de React Native que no se encuentra durante el build de EAS.

## Soluciones

### Opción 1: Usar expo-in-app-purchases (Recomendado para Expo)

`expo-in-app-purchases` es el módulo oficial de Expo y es más compatible:

1. **Instalar expo-in-app-purchases**:
   ```bash
   cd frontend
   npx expo install expo-in-app-purchases
   ```

2. **Remover react-native-iap**:
   ```bash
   npm uninstall react-native-iap
   ```

3. **Actualizar el código** para usar `expo-in-app-purchases` en lugar de `react-native-iap`

### Opción 2: Hacer Prebuild y Configurar Podfile Manualmente

1. **Hacer prebuild**:
   ```bash
   cd frontend
   npx expo prebuild --clean
   ```

2. **Editar `ios/Podfile`** y agregar:
   ```ruby
   pod 'RCT-Folly', :path => '../node_modules/react-native/third-party-podspecs/RCT-Folly.podspec'
   ```

3. **Instalar pods localmente**:
   ```bash
   cd ios
   pod install
   ```

4. **Hacer build con EAS** (EAS usará el Podfile configurado)

### Opción 3: Usar Versión Compatible de react-native-iap

Probar con una versión anterior que sea compatible:

```bash
cd frontend
npm install react-native-iap@12.10.0
```

### Opción 4: Configurar Build Hook en EAS

Crear un hook que actualice los repos de CocoaPods antes de instalar pods.

## Recomendación

Para proyectos Expo, **usa `expo-in-app-purchases`** (Opción 1). Es más compatible y mantenido por el equipo de Expo.

