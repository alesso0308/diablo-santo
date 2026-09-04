import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const htmlFiles = ["index.html", "shop.html", "purpose.html", "politicas.html", "contacto.html"];
const failures = [];

const normalizeReference = (htmlFile, reference) => {
  const clean = reference.split("#")[0].split("?")[0];
  if (!clean || /^(?:https?:|mailto:|tel:|data:|#)/i.test(reference)) return null;
  if (clean.startsWith("/")) {
    const sourceCandidate = join(root, clean.slice(1));
    return existsSync(sourceCandidate) ? sourceCandidate : join(root, "public", clean.slice(1));
  }
  return resolve(root, dirname(htmlFile), clean);
};

for (const htmlFile of htmlFiles) {
  const source = readFileSync(join(root, htmlFile), "utf8");
  const ids = [...source.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) failures.push(`${htmlFile}: IDs duplicados: ${[...new Set(duplicates)].join(", ")}`);

  const references = [
    ...source.matchAll(/\s(?:src|href)=["']([^"']+)["']/g),
  ].map((match) => match[1]);
  const srcsetReferences = [...source.matchAll(/\ssrcset=["']([^"']+)["']/g)].flatMap((match) =>
    match[1].split(",").map((entry) => entry.trim().split(/\s+/)[0])
  );

  for (const reference of [...references, ...srcsetReferences]) {
    const target = normalizeReference(htmlFile, reference);
    if (target && !existsSync(target)) failures.push(`${htmlFile}: falta ${reference}`);
  }
}

const imagesDir = join(root, "public", "images");
for (const image of [
  "frente-800.webp", "frente-1400.webp", "frente-humano-800.webp", "frente-humano-1400.webp",
  "espalda-800.webp", "espalda-1400.webp", "espalda-humano-800.webp", "espalda-humano-1400.webp",
  "1-800.webp", "1-1400.webp", "2-800.webp", "2-1400.webp",
  "3-800.webp", "3-1400.webp", "4-800.webp", "4-1400.webp",
]) {
  const path = join(imagesDir, image);
  if (!existsSync(path) || statSync(path).size === 0) failures.push(`Imagen inválida: ${image}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validación correcta: ${htmlFiles.length} páginas, enlaces locales, IDs e imágenes.`);
