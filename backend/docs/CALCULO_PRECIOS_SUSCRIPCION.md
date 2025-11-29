# Cálculo de Precios de Suscripción

## 📊 Base de Cálculo

**Plan Semanal:** $950 CLP

---

## 💰 Precios Sugeridos

### Opción 1: Sin Descuentos (Precio Directo)

| Período | Cálculo | Precio | Notas |
|---------|---------|--------|-------|
| **Semanal** | Base | **$950 CLP** | Ya configurado |
| **Mensual** | $950 × 4 semanas | **$3,800 CLP** | Precio directo |
| **Trimestral (3 meses)** | $3,800 × 3 | **$11,400 CLP** | Precio directo |
| **Semestral (6 meses)** | $3,800 × 6 | **$22,800 CLP** | Precio directo |
| **Anual** | $3,800 × 12 | **$45,600 CLP** | Precio directo |

---

### Opción 2: Con Descuentos Progresivos (Recomendado)

| Período | Precio Base | Descuento | Precio Final | Ahorro |
|---------|-------------|-----------|--------------|--------|
| **Semanal** | $950 CLP | 0% | **$950 CLP** | - |
| **Mensual** | $3,800 CLP | 5% | **$3,610 CLP** | $190 CLP |
| **Trimestral (3 meses)** | $11,400 CLP | 10% | **$10,260 CLP** | $1,140 CLP |
| **Semestral (6 meses)** | $22,800 CLP | 15% | **$19,380 CLP** | $3,420 CLP |
| **Anual** | $45,600 CLP | 20% | **$36,480 CLP** | $9,120 CLP |

**Redondeos sugeridos:**
- Mensual: **$3,600 CLP** o **$3,700 CLP**
- Trimestral: **$10,200 CLP** o **$10,300 CLP**
- Semestral: **$19,400 CLP** o **$19,500 CLP**
- Anual: **$36,500 CLP** o **$36,900 CLP**

---

### Opción 3: Precios Redondeados (Más Limpios)

| Período | Precio Sugerido | Descuento Aplicado | Ahorro vs Mensual |
|---------|-----------------|-------------------|-------------------|
| **Semanal** | **$950 CLP** | - | - |
| **Mensual** | **$3,600 CLP** | 5% | - |
| **Trimestral (3 meses)** | **$10,200 CLP** | 10% | $600 CLP |
| **Semestral (6 meses)** | **$19,400 CLP** | 15% | $1,600 CLP |
| **Anual** | **$36,900 CLP** | 20% | $4,200 CLP |

---

## 🎯 Recomendación Final

### Precios Sugeridos para Implementar:

```env
# Precios en CLP
MERCADOPAGO_PRICE_WEEKLY=950
MERCADOPAGO_PRICE_MONTHLY=3600
MERCADOPAGO_PRICE_QUARTERLY=10200
MERCADOPAGO_PRICE_SEMESTRAL=19400
MERCADOPAGO_PRICE_YEARLY=36900
```

### Comparación de Ahorro:

- **Mensual**: $3,600/mes (equivalente a $900/semana)
- **Trimestral**: $3,400/mes (ahorro de $200/mes)
- **Semestral**: $3,233/mes (ahorro de $367/mes)
- **Anual**: $3,075/mes (ahorro de $525/mes)

---

## 📝 Notas

1. **Precios competitivos**: Los precios están alineados con el mercado chileno
2. **Descuentos atractivos**: Los descuentos progresivos incentivan compromisos más largos
3. **Redondeos**: Los precios están redondeados para facilitar el marketing
4. **Flexibilidad**: Puedes ajustar los descuentos según tu estrategia

---

## 🔄 Actualización del Código

Si decides usar estos precios, necesitarás:

1. Actualizar `backend/config/mercadopago.js` para incluir todos los períodos
2. Crear Preapproval Plans en Mercado Pago para cada período
3. Actualizar el frontend para mostrar todos los planes

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

