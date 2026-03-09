#!/usr/bin/env node
/**
 * Verifica que App.tsx tenga SafeAreaProvider como wrapper raíz.
 * Previene el error "No safe area value available".
 * Ejecutar: npm run check:safe-area
 */
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('ERROR: App.tsx no encontrado');
  process.exit(1);
}

const content = fs.readFileSync(appPath, 'utf8');

// SafeAreaProvider debe estar en el return del componente principal
const hasSafeAreaProvider = content.includes('SafeAreaProvider');
const hasInitialMetrics = content.includes('initialMetrics');
const normalized = content.replace(/\s+/g, ' ');
const providerIsRoot = normalized.includes('return ( <SafeAreaProvider') || normalized.includes('return (<SafeAreaProvider');

if (!hasSafeAreaProvider) {
  console.error('ERROR: App.tsx debe incluir SafeAreaProvider como wrapper raíz.');
  console.error('Ver docs/SAFE_AREA_REQUIREMENTS.md');
  process.exit(1);
}

if (!hasInitialMetrics) {
  console.warn('ADVERTENCIA: SafeAreaProvider sin initialMetrics puede causar errores en carga inicial.');
  console.warn('Añadir: initialMetrics={initialWindowMetrics ?? DEFAULT_SAFE_AREA_METRICS}');
}

if (!providerIsRoot) {
  console.warn('ADVERTENCIA: SafeAreaProvider debería ser el primer elemento en el return de App.');
}

console.log('✓ SafeAreaProvider configurado correctamente');
