#!/usr/bin/env node
/**
 * Exporta notas Obsidian (wikilinks) desde PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md.
 * Por defecto escribe FUERA del repo (carpeta hermana) para no mezclar con la app.
 *
 * Uso:
 *   node docs/scripts/generate-obsidian-propuestas-graph.js --clean
 *   node docs/scripts/generate-obsidian-propuestas-graph.js --out ~/Vaults/Anto-propuestas --clean
 *
 * Config opcional (gitignored): .anto-obsidian-export.json → { "outDir": "/ruta/absoluta" }
 * Variable de entorno: ANTO_OBSIDIAN_EXPORT_DIR
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REPO_ROOT = path.resolve(__dirname, '../..');
const MATRIX_PATH = path.join(REPO_ROOT, 'docs/PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md');
const MATRIX_BASENAME = 'PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md';
const LEGACY_OUT_DIR = path.join(REPO_ROOT, 'docs/obsidian-propuestas');
const CONFIG_PATH = path.join(REPO_ROOT, '.anto-obsidian-export.json');
const DEFAULT_OUT_DIR = path.join(REPO_ROOT, '..', 'Anto-propuestas-obsidian');

const REF_PATTERN = /#(\d{1,3})(?:\s*[–—\-]\s*#?(\d{1,3}))?/g;

function expandHome(p) {
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function readConfigOutDir() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (raw?.outDir && typeof raw.outDir === 'string') {
      return path.resolve(expandHome(raw.outDir.trim()));
    }
  } catch {
    console.warn('Aviso: no se pudo leer', CONFIG_PATH);
  }
  return null;
}

function resolveOutDir(argv) {
  const outIdx = argv.indexOf('--out');
  if (outIdx !== -1 && argv[outIdx + 1]) {
    return path.resolve(expandHome(argv[outIdx + 1]));
  }
  if (process.env.ANTO_OBSIDIAN_EXPORT_DIR) {
    return path.resolve(expandHome(process.env.ANTO_OBSIDIAN_EXPORT_DIR.trim()));
  }
  return readConfigOutDir() || DEFAULT_OUT_DIR;
}

function padId(n) {
  return String(n).padStart(3, '0');
}

function slugifyTitle(title) {
  return title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 55);
}

function noteBasename(id, title) {
  return `P${padId(id)} ${slugifyTitle(title)}`;
}

function extractRefIds(text) {
  const ids = new Set();
  if (!text) return ids;
  let m;
  const re = new RegExp(REF_PATTERN.source, 'g');
  while ((m = re.exec(text)) !== null) {
    const a = Number(m[1], 10);
    const b = m[2] ? Number(m[2], 10) : a;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (hi - lo > 50) {
      ids.add(a);
      continue;
    }
    for (let i = lo; i <= hi; i += 1) ids.add(i);
  }
  return ids;
}

function parseMatrixRows(content) {
  const proposals = new Map();
  const lines = content.split('\n');

  for (const line of lines) {
    if (!line.startsWith('|')) continue;
    if (line.includes('|---')) continue;
    if (/^\|\s*#\s*\|/.test(line)) continue;
    if (/^\|\s*Decisión\s*\|/.test(line)) continue;
    if (/^\|\s*Tema\s*\(/.test(line)) continue;
    if (/^\|\s*Área\s*\|/.test(line)) continue;
    if (/^\|\s*#\s*\|\s*Propuesta/.test(line)) continue;
    if (/^\|\s*#\s*\|\s*Nombre/.test(line)) continue;

    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 12) continue;

    const id = Number(parts[1], 10);
    if (!Number.isFinite(id) || id < 1) continue;

    const title = parts[2];
    const description = parts[3];
    const hecha = parts[4];
    const urg = parts[5];
    const imp = parts[6];
    const ret = parts[7];
    const impStar = parts[8];
    const costo = parts[9];
    const t = parts[10];
    const q = parts[11];

    if (!title || title === 'Propuesta') continue;

    proposals.set(id, {
      id,
      title,
      description,
      hecha,
      urg,
      imp,
      ret,
      impStar,
      costo,
      t,
      q,
    });
  }

  return proposals;
}

function buildLinkGraph(proposals, fullText) {
  const outgoing = new Map();

  for (const [id, p] of proposals) {
    const refs = extractRefIds(p.description);
    refs.delete(id);
    outgoing.set(id, refs);
  }

  for (const m of fullText.matchAll(/\*\*#(\d{1,3})\*\*\s*←\s*([^|\n]+)/g)) {
    const targetId = Number(m[1], 10);
    const sources = extractRefIds(m[2]);
    for (const src of sources) {
      if (!proposals.has(src) || !proposals.has(targetId)) continue;
      if (!outgoing.has(src)) outgoing.set(src, new Set());
      outgoing.get(src).add(targetId);
    }
  }

  const incoming = new Map();
  for (const [from, toSet] of outgoing) {
    for (const to of toSet) {
      if (!incoming.has(to)) incoming.set(to, new Set());
      incoming.get(to).add(from);
    }
  }

  return { outgoing, incoming };
}

function renderNote(p, outgoing, incoming, proposals) {
  const basename = noteBasename(p.id, p.title);
  const matrixRel = `_fuente/${MATRIX_BASENAME}`;

  const outLinks = [...(outgoing.get(p.id) || [])]
    .filter((id) => proposals.has(id))
    .sort((a, b) => a - b);
  const inLinks = [...(incoming.get(p.id) || [])]
    .filter((id) => proposals.has(id))
    .sort((a, b) => a - b);

  const linkLine = (id) => {
    const other = proposals.get(id);
    const label = noteBasename(id, other.title);
    return `- [[${label}]] — ${other.title}`;
  };

  return `---
id: ${p.id}
hecha: ${p.hecha}
urgencia: ${p.urg}
imp: ${p.imp}
ret: ${p.ret}
imp_star: ${p.impStar}
costo: ${p.costo}
tiempo: ${p.t}
quadrante: ${p.q}
tags:
  - propuesta
  - anto/propuestas
---

# ${basename}

> Fuente canónica (copia al exportar): [Matriz #${p.id}](${matrixRel})

**Estado:** ${p.hecha} · **Q:** ${p.q} · **Imp\\***: ${p.impStar}

## Descripción (resumen)

${p.description.replace(/\s+/g, ' ').trim()}

## Enlaza a (${outLinks.length})

${outLinks.length ? outLinks.map(linkLine).join('\n') : '_Sin referencias explícitas en la matriz._'}

## Referenciada por (${inLinks.length})

${inLinks.length ? inLinks.map(linkLine).join('\n') : '_Ninguna otra fila la cita por número._'}
`;
}

function renderIndex(proposals, outgoing, outDir) {
  const byQ = { Q1: [], Q2: [], Q3: [], Q4: [] };
  const sorted = [...proposals.values()].sort((a, b) => a.id - b.id);

  for (const p of sorted) {
    const key = (p.q || 'Q2').trim();
    if (byQ[key]) byQ[key].push(p);
    else byQ.Q2.push(p);
  }

  const section = (label, list) => {
    if (!list.length) return `## ${label}\n\n_(vacío)_\n`;
    return `## ${label}\n\n${list.map((p) => `- [[${noteBasename(p.id, p.title)}]] (${p.hecha})`).join('\n')}\n`;
  };

  const hubLinks = sorted
    .filter((p) => (outgoing.get(p.id)?.size || 0) >= 3)
    .map((p) => `- [[${noteBasename(p.id, p.title)}]] — ${outgoing.get(p.id).size} enlaces salientes`)
    .join('\n');

  return `---
tags:
  - propuesta
  - anto/propuestas
  - indice
---

# Índice — grafo de propuestas Anto

Vault local (fuera del repo de la app): \`${outDir}\`

Abre **Vista de grafo** (icono en la barra lateral o \`Cmd/Ctrl+G\`).

1. En Obsidian: **Abrir carpeta como vault** → esta carpeta.
2. Tras editar la matriz en el repo Anto, regenera:
   \`npm run obsidian:propuestas\`
3. Filtra por tag \`#anto/propuestas\` si el grafo incluye \`_fuente\`.

## Hubs (más enlaces salientes)

${hubLinks || '_Ejecuta el script tras ampliar referencias en la matriz._'}

${section('Q1 — urgente e importante', byQ.Q1)}
${section('Q2 — planificar', byQ.Q2)}
${section('Q3 — urgente, menor impacto', byQ.Q3)}
${section('Q4 — posponer', byQ.Q4)}

## Todas (${sorted.length})

${sorted.map((p) => `- [[${noteBasename(p.id, p.title)}]]`).join('\n')}
`;
}

function renderVaultReadme(outDir, repoRoot) {
  return `# Anto — propuestas (Obsidian)

Vault generado automáticamente. **No forma parte del código de la app.**

- **Origen de datos:** \`${path.join(repoRoot, 'docs', MATRIX_BASENAME)}\`
- **Regenerar:** desde el repo Anto → \`npm run obsidian:propuestas\`
- **Ruta de este vault:** \`${outDir}\`

## Obsidian

1. Abrir carpeta como vault (esta carpeta).
2. Abrir \`00 Indice grafo propuestas.md\`.
3. Vista de grafo: \`Cmd+G\` / \`Ctrl+G\`.

## Personalizar ruta de exportación

En el repo Anto, copia \`.anto-obsidian-export.json.example\` → \`.anto-obsidian-export.json\` y define \`outDir\`, o usa:

\`node docs/scripts/generate-obsidian-propuestas-graph.js --out /tu/ruta --clean\`
`;
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyDirRecursive(from, to);
    else fs.copyFileSync(from, to);
  }
}

function syncMatrixCopy(outDir) {
  const fuenteDir = path.join(outDir, '_fuente');
  fs.mkdirSync(fuenteDir, { recursive: true });
  fs.copyFileSync(MATRIX_PATH, path.join(fuenteDir, MATRIX_BASENAME));
}

function migrateLegacyObsidianConfig(outDir) {
  const legacyObsidian = path.join(LEGACY_OUT_DIR, '.obsidian');
  const targetObsidian = path.join(outDir, '.obsidian');
  if (!fs.existsSync(legacyObsidian)) return;
  if (fs.existsSync(targetObsidian)) return;
  copyDirRecursive(legacyObsidian, targetObsidian);
  console.log('Migrado .obsidian desde docs/obsidian-propuestas/ → vault externo.');
}

function cleanOutputDir(outDir) {
  if (!fs.existsSync(outDir)) return;
  for (const name of fs.readdirSync(outDir)) {
    if (name === '_fuente' || name === '.obsidian' || name === 'README.md') continue;
    const full = path.join(outDir, name);
    if (fs.statSync(full).isFile() && name.endsWith('.md')) fs.unlinkSync(full);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const clean = argv.includes('--clean');
  const outDir = resolveOutDir(argv);

  if (!fs.existsSync(MATRIX_PATH)) {
    console.error('No se encontró:', MATRIX_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(MATRIX_PATH, 'utf8');
  const proposals = parseMatrixRows(content);

  if (proposals.size === 0) {
    console.error('No se parsearon filas de la matriz. Revisa el formato de la tabla.');
    process.exit(1);
  }

  const { outgoing, incoming } = buildLinkGraph(proposals, content);

  fs.mkdirSync(outDir, { recursive: true });
  migrateLegacyObsidianConfig(outDir);
  syncMatrixCopy(outDir);
  if (clean) cleanOutputDir(outDir);

  let written = 0;
  for (const p of proposals.values()) {
    const basename = noteBasename(p.id, p.title);
    const filePath = path.join(outDir, `${basename}.md`);
    fs.writeFileSync(filePath, renderNote(p, outgoing, incoming, proposals), 'utf8');
    written += 1;
  }

  fs.writeFileSync(
    path.join(outDir, '00 Indice grafo propuestas.md'),
    renderIndex(proposals, outgoing, outDir),
    'utf8',
  );
  fs.writeFileSync(path.join(outDir, 'README.md'), renderVaultReadme(outDir, REPO_ROOT), 'utf8');

  const edgeCount = [...outgoing.values()].reduce((n, s) => n + s.size, 0);

  console.log(`Propuestas: ${written}`);
  console.log(`Enlaces salientes (aristas dirigidas): ${edgeCount}`);
  console.log(`Vault (fuera del repo): ${outDir}`);
  console.log(`Matriz copiada: ${path.join(outDir, '_fuente', MATRIX_BASENAME)}`);
  console.log('');
  console.log('Obsidian: Abrir carpeta como vault →', outDir);
  console.log('          Luego "00 Indice grafo propuestas" → Grafo (Cmd/Ctrl+G)');
}

main();
