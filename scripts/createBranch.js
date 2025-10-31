#!/usr/bin/env node
import { execSync } from "child_process";

const type = process.argv[2]; // feature o fix
const name = process.argv[3]; // nombre de la rama

if (!name) {
  console.error("❌ Debes indicar un nombre para la rama. Ej: npm run branch:feature login-screen");
  process.exit(1);
}

const branchName = `${type}/${name}`;

try {
  console.log(`🚀 Creando rama: ${branchName}...`);
  execSync(`git checkout dev`, { stdio: "inherit" });
  execSync(`git pull`, { stdio: "inherit" });
  execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
  execSync(`git push -u origin ${branchName}`, { stdio: "inherit" });
  console.log(`✅ Rama '${branchName}' creada y subida correctamente.`);
} catch (err) {
  console.error("❌ Error al crear la rama:", err.message);
  process.exit(1);
}

