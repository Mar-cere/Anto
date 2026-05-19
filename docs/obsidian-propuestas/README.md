# Export Obsidian (fuera del repo)

Las notas del grafo **no se generan aquí**. El script escribe en una carpeta local aparte para no mezclar producto/planificación con el código.

## Regenerar

Desde la raíz del repo:

```bash
npm run obsidian:propuestas
```

**Destino por defecto:** carpeta hermana del repo → `../Anto-propuestas-obsidian`  
(p. ej. `/Users/tu-usuario/Documents/Anto-propuestas-obsidian` si el repo es `.../Documents/Anto`).

## Otra ruta

```bash
node docs/scripts/generate-obsidian-propuestas-graph.js --out ~/Vaults/Anto-propuestas --clean
```

O copia `.anto-obsidian-export.json.example` → `.anto-obsidian-export.json` y edita `outDir`.

## Obsidian

Abre **como vault** la carpeta de exportación (no `docs/` del repo). Grafo: `Cmd/Ctrl+G`.

Si tenías vault en esta carpeta (`docs/obsidian-propuestas/`), la primera exportación externa migra `.obsidian` al vault nuevo.
