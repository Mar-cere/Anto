---
name: anto-ui-design
description: >-
  Aplica el sistema visual de Anto (glass/chrome, tokens de tema, espaciado,
  tipografía, cards agrupadas estilo iOS) al crear o modificar pantallas y
  componentes. Usar al diseñar UI, rediseñar pantallas, añadir cards, modales,
  formularios o estilos en frontend/src/.
---

# Anto — sistema visual y diseño UI

Anto tiene identidad **premium, calmada y glass/chrome**: fondos suaves con gradiente, superficies semitransparentes, bordes finos, sombras suaves y agrupación tipo iOS. No inventes Material Design plano ni cards blancas opacas fuera de patrón.

Complementa la skill **anto-i18n-theme-review** (i18n + temas claro/oscuro + tono).

## Skills relacionadas

| Si también… | Aplicar |
|-------------|---------|
| Añades textos o copy de producto | `anto-i18n-theme-review` + `anto-product-narrative` |
| Tocas chat en la pantalla | `anto-chat-clinical` |
| Consumes API nueva | `anto-backend-feature` |

Índice: `.cursor/skills/README.md`

---

## Principios

1. **Tokens, no valores sueltos** — `useTheme().colors`, `SPACING`, `TYPOGRAPHY`.
2. **Reutilizar antes de crear** — copiar estructura de componentes existentes.
3. **Jerarquía clara** — eyebrow → título → cuerpo → meta; acciones primarias en `primary`.

Tema claro/oscuro e i18n: skill **anto-i18n-theme-review** (fuente de verdad).

---

## Paleta y tokens (`themePalettes.js`)

| Token | Uso |
|-------|-----|
| `primary` / `primaryBright` | CTAs, links, acentos de marca |
| `accentWarm` / `accentSecondary` | Variación (insights, onboarding, chips) |
| `background`, `gradientTop`, `gradientBottom` | Fondo de pantalla con gradiente |
| `text`, `textSecondary`, `textMuted` | Jerarquía tipográfica |
| `surface` | Superficie sólida clara (cards en tema light) |
| `chromeCard` | Card principal semitransparente (preferido en dark) |
| `chromeCardBorder` | Borde sutil de cards |
| `glassFill` / `glassFillStrong` | Paneles glass, headers flotantes |
| `glassOutline` / `glassShadow` | Bordes y sombras glass |
| `chromeHeader` | Barra superior sticky |
| `chromeInput` | Campos de texto, fondos de lista agrupada (light) |
| `chromeListRow` | Fila de opciones en sheet/modal |
| `settingsSectionSurface` | Bloques agrupados en Configuración |
| `assistantBubble` | Burbujas de chat |
| `overlay` / `modalSurface` | Modales y overlays |
| `accentLine` / `accentLineSoft` | Bordes de foco, icon wraps |
| `error`, `dangerSoft`, `dangerBorder` | Destructivo / error |
| `success`, `successSoft` | Confirmación / bienestar |
| `warning`, `warningSoft` | Alertas (no amarillo limón en light) |

**Regla:** token nuevo → definir en `lightColors` y `darkColors` (ver skill **anto-i18n-theme-review**).

---

## Tipografía (`constants/ui.js` → `TYPOGRAPHY`)

| Token | Tamaño | Uso |
|-------|--------|-----|
| `TITLE` | 24 | Títulos de pantalla |
| `SUBTITLE` | 18 | Subtítulos |
| `BODY` | 16 | Texto principal, inputs |
| `CAPTION` | 14 | Meta, hints, links de sección |
| `SMALL` | 12 | Badges, labels auxiliares |

**Patrones del dashboard** (`dashboardTheme.js`):
- Eyebrow / section title: 11–13px, `uppercase`, `letterSpacing` 1.2–1.6, `textMuted`
- Row title: 16px, `fontWeight: '600'`
- Row meta: 13px, `textSecondary`
- Hero title: 22px bold; stat value: 34px bold

---

## Espaciado (`SPACING`)

| Token | Valor | Uso |
|-------|-------|-----|
| `SCREEN_EDGE_INSET` | 14 | Margen horizontal estándar de pantalla |
| `xs`–`xxl` | 4–48 | Padding interno general |
| `FLOATING_NAV_SCROLL_BOTTOM_EXTRA` | 132 | Padding inferior en scroll con barra flotante |
| `md` | 16 | Gap entre secciones (también `SECTION_GAP` en dashboard) |

**Radios habituales:**
- Cards: 20–22px (`CARD_RADIUS`, `GROUPED_RADIUS`)
- Hero: 24px
- Icon wraps: 12–14px
- Pills / chips / CTAs redondeados: `borderRadius: 999`
- Inputs: 12px

---

## Superficies — cuándo usar cada una

```
Fondo de pantalla     → gradientTop → gradientBottom (Svg o backdrop util)
Card estándar         → surfaceCard (dashboard) o chromeCard + chromeCardBorder
Lista agrupada iOS    → groupedList / GROUPED_SURFACE (chromeInput en light)
Hero destacado        → HERO_SURFACE (primary en light, navy en dark)
Header sticky         → chromeHeader + chromeHeaderBorder
Input / formulario    → chromeInput, borde border, foco accentLine
Modal                 → modalSurface sobre overlay
Sheet / opciones      → chromeListRow por fila
Glass flotante        → glassFill o glassFillStrong
Configuración         → settingsSectionSurface para agrupar filas
```

### Sombras

- `shadowColor: colors.glassShadow` (o `shadowAmbient` como fallback)
- Light: opacidad ~0.14, radius ~16
- Dark: opacidad ~0.35, radius ~12
- En dark preferir `StyleSheet.hairlineWidth` en bordes antes que sombras fuertes

---

## Patrones de componente

### Hook de tema (obligatorio en UI nueva)

```js
const { colors, resolvedScheme, statusBarStyle } = useTheme();
const styles = useMemo(
  () => createDashboardStyles(colors, resolvedScheme),
  [colors, resolvedScheme],
);
```

Para bloques foco/chat: `createDashboardFocusStyles` / `getFocusTheme`.

### Botones

| Tipo | Patrón |
|------|--------|
| Primario sólido | `backgroundColor: colors.primary`, texto `textOnPrimary`, `borderRadius: 999` |
| Secundario outline | borde `accentLine`, fondo `surface` (light) o glass sutil (dark) |
| Destructivo | `dangerSoft` + `dangerBorder` o `error` |
| Legacy global | `createGlobalStyles(colors).modernButton` |

### Filas agrupadas (settings, listas)

- Contenedor: `groupedList` con `overflow: 'hidden'`
- Fila: `groupedRow`, `minHeight: 68`, separador `hairlineWidth` + `colors.border`
- Icono: wrap 44×44, `borderRadius: 12`, fondo `accentLineSoft`
- Chevron a la derecha con `marginLeft: 6`

### Pills / chips seleccionables

- Default: `PILL_DEFAULT` (fondo sutil + `border`)
- Selected: `PILL_SELECTED` (tinte primary + borde `primary`)
- Texto selected: `color: colors.primary`, `fontWeight: '600'`

### Iconos de intervención

Usar `INTERVENTION_VISUALS` en `constants/interventionVisuals.js` (MaterialCommunityIcons + `accentKey`).

---

## Fondos con gradiente

Pantallas principales (Home, Welcome) usan gradiente SVG o `dashboardBrandBackdropUtils`. No pongas `backgroundColor` plano gris; usa `colors.background` o el util de backdrop de marca.

---

## Estructura de archivos para pantallas nuevas

```
screens/miPantalla/
├── MiPantallaScreen.js
├── miPantallaScreenConstants.js   # medidas; textos → i18n
└── __tests__/
```

- Estilos: factory `create*Styles(colors, resolvedScheme)` en `*Styles.js` o constantes de pantalla.
- No importar `globalStyles` / `lightColors` estáticos en pantallas nuevas.
- Textos visibles: `useTranslations()` → skill **anto-i18n-theme-review**.

## Navegación (pantalla nueva)

1. **Constante de ruta** — añadir en `frontend/src/constants/routes.js` (`ROUTES.MI_PANTALLA`).
2. **Stack** — registrar en `frontend/src/navigation/StackNavigator.js` (`Stack.Screen` con `name={ROUTES.MI_PANTALLA}`).
3. **Navegar** — `navigation.navigate(ROUTES.MI_PANTALLA)` desde el origen; reutilizar helpers en `navigation/navigationHelpers.js` si aplica.
4. **Safe Area** — si usas `useSafeAreaInsets()`, el componente debe estar bajo `SafeAreaProvider` (ya en `App.tsx`). Ver `frontend/docs/SAFE_AREA_REQUIREMENTS.md`.
5. **Scroll con barra flotante** — `paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA` en listas/scroll del tab principal.

---

## Componentes de referencia (copiar estructura)

| Necesidad | Referencia |
|-----------|------------|
| Card con interacción | `MoodCheckInCard.js` |
| Sección con título | `DashboardSection.js` |
| Fila agrupada | `DashboardGroupedRow.js` |
| Hero / racha | `DashboardStreakHero.js` |
| Lista de técnicas | `TechniquesCatalogPanel.js` |
| Modal con inputs | `CreateHabitModal.js` |
| Bloque foco | `DashboardFocusCard.js` |
| Chat bubbles | componentes en `components/chat/` |
| Settings agrupado | `SettingsCountryModal.js`, pantalla Settings |

---

## Anti-patrones (evitar)

- `#FFFFFF`, `#000000`, `'white'`, `'black'` sueltos en componentes
- Cards con `backgroundColor: '#fff'` opaco sin borde/sombra glass
- Márgenes arbitrarios (13, 17, 23…) en lugar de `SPACING`
- Tipografía fuera de escala (15px está bien para casos puntuales; no mezclar 19, 21, 23 sin motivo)
- Bordes gruesos (`borderWidth: 2`) salvo botones secundarios legacy
- Sombras negras duras sin `glassShadow`
- Diseño tipo Android Material (FAB, ripple, elevation 8)
- Crear sistema de colores paralelo al de `themePalettes`

---

## Checklist al terminar UI

```
Diseño Anto:
- [ ] useTheme() + tokens (no hex sueltos)
- [ ] SPACING.SCREEN_EDGE_INSET en bordes horizontales
- [ ] Scroll con padding inferior si hay FloatingNavBar
- [ ] Ruta en ROUTES + StackNavigator (si pantalla nueva)
- [ ] Reutiliza patrones dashboard/globalStyles existentes
- [ ] Cierre con skill anto-i18n-theme-review (temas + i18n + test:i18n)
```

---

## Árbol de decisión

```
¿Es UI nueva o rediseño?
├─ Buscar componente similar en frontend/src/components/ o screens/
├─ Usar createDashboardStyles o createGlobalStyles(colors)
└─ Solo crear estilos nuevos si no hay patrón reutilizable

¿Es card, lista o formulario?
├─ Card → surfaceCard / chromeCard
├─ Lista iOS → groupedList + groupedRow
├─ Form → chromeInput + globalStyles inputContainer
└─ Modal → modalSurface + overlay

¿Color nuevo?
└─ Añadir token en lightColors y darkColors, no inline
```

---

## Referencias del repo

| Qué | Dónde |
|-----|-------|
| Paletas | `frontend/src/styles/themePalettes.js` |
| Tema runtime | `frontend/src/context/ThemeContext.js` |
| Dashboard styles | `frontend/src/styles/dashboardTheme.js` |
| Focus card styles | `frontend/src/styles/focusCardTheme.js` |
| Estilos globales | `frontend/src/styles/globalStyles.js` |
| UI constants | `frontend/src/constants/ui.js` |
| Iconos intervención | `frontend/src/constants/interventionVisuals.js` |
| Backdrop marca | `frontend/src/utils/dashboardBrandBackdropUtils.js` |
| Tests tema | `frontend/src/styles/__tests__/themePalettes.test.js`, `dashboardTheme.test.js` |
| Rutas | `frontend/src/constants/routes.js`, `frontend/src/navigation/StackNavigator.js` |
| Safe Area | `frontend/docs/SAFE_AREA_REQUIREMENTS.md` |
