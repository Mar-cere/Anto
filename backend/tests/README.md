# 🧪 Testing - Notas Importantes

## ✅ Estado Actual

Todos los tests están pasando correctamente. El sistema de testing está configurado y funcionando.

## ⚠️ Warnings Esperados

### Worker Process Warning

El warning sobre "A worker process has failed to exit gracefully" es **esperado y normal**. Ocurre porque:

1. El servidor Express se inicia cuando se importa `server.js`
2. Hay servicios de background (recordatorios, seguimiento de crisis) que crean timers
3. Estos timers mantienen el proceso activo hasta que Jest los fuerza a cerrar

**Esto no afecta la funcionalidad de los tests** y es un comportamiento normal en tests de integración que importan el servidor completo.

### Experimental VM Modules Warning

El warning sobre "VM Modules is an experimental feature" es normal cuando se usa Jest con ES modules. Jest requiere el flag `--experimental-vm-modules` para soportar ES modules, y Node.js muestra este warning. No afecta la funcionalidad.

## 📊 Cobertura de Código

La cobertura actual es baja (12.7% statements) porque:
- Solo tenemos tests básicos implementados
- Muchos servicios y rutas aún no tienen tests
- Los umbrales están configurados en 10% para permitir el crecimiento gradual

### Objetivos de Cobertura

- **Corto plazo**: 20-30% (agregando tests para rutas principales)
- **Mediano plazo**: 50-60% (tests para servicios críticos)
- **Largo plazo**: 70%+ (cobertura completa)

## 🚀 Próximos Pasos

1. Agregar más tests unitarios para servicios críticos
2. Agregar más tests de integración para rutas principales
3. Aumentar gradualmente los umbrales de cobertura
4. Configurar CI/CD para ejecutar tests automáticamente

## 📝 Notas Técnicas

- Los tests usan una base de datos de test separada (`anto-test`)
- El servidor se inicia automáticamente al importar `server.js`
- Los timers de background pueden causar que el proceso no se cierre inmediatamente
- Esto es normal y no indica un problema

