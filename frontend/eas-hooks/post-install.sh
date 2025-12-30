#!/bin/bash

# EAS Build Hook: Post Install
# Este script se ejecuta después de instalar las dependencias de npm
# Actualiza los repositorios de CocoaPods para resolver dependencias faltantes

set -e

echo "🔧 Actualizando repositorios de CocoaPods..."

# Actualizar repositorios de CocoaPods
pod repo update trunk || true

echo "✅ Repositorios de CocoaPods actualizados"

