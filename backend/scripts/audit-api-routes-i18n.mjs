/**
 * Falla si hay message/error en español hardcodeado en routes/*.js
 * (excluye logs y respuestas ya cableadas a req.apiCopy / copy).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.join(__dirname, '../routes');

const SPANISH_IN_STRING = /[áéíóúñÁÉÍÓÚÑ]/;
const API_FIELD = /^\s*(message|error):\s*(['"`]|`)/;

function isExcludedLine(line) {
  if (line.includes('req.apiCopy') || line.includes('copy.')) return true;
  if (line.includes('console.') || line.includes('logger.')) return true;
  if (line.includes('//') && line.trim().startsWith('//')) return true;
  if (line.includes('lang="es"') || line.includes("lang='es'")) return true;
  return false;
}

function auditFile(filePath) {
  const rel = path.relative(path.join(__dirname, '..'), filePath);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    if (!API_FIELD.test(line)) return;
    if (isExcludedLine(line)) return;
    const stringMatch = line.match(/(['"`])((?:\\.|(?!\1).)*)\1/);
    if (!stringMatch) return;
    const value = stringMatch[2];
    if (SPANISH_IN_STRING.test(value)) {
      violations.push({ line: index + 1, text: line.trim() });
    }
  });

  return violations.map((v) => ({ file: rel, ...v }));
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(full));
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

const allViolations = walk(routesDir).flatMap(auditFile);

if (allViolations.length > 0) {
  console.error('API routes i18n audit FAILED:\n');
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  process.exit(1);
}

console.log('API routes i18n audit OK (no hardcoded Spanish in message/error fields).');
