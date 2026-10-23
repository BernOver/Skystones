import { build } from "vite";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const result = await build({
  root,
  base: "./",
  build: {
    write: false,
    cssCodeSplit: false,
    assetsInlineLimit: () => true,
    modulePreload: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});

const files = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
const entry = files.find((file) => file.type === "chunk" && file.isEntry);
const stylesheet = files.find((file) => file.fileName.endsWith(".css"));
const document = files.find((file) => file.fileName === "index.html");
if (!entry || !stylesheet || !document || entry.imports.length || entry.dynamicImports.length) {
  throw new Error("The standalone build must contain one self-contained script, stylesheet, and document.");
}

const favicon = await readFile(path.join(root, "public/favicon.svg"), "utf8");
let html = String(document.source);
html = html.replace(/<script\b[^>]*\bsrc="[^"]+"[^>]*><\/script>/g,
  () => `<script type="module">${entry.code.replace(/<\/script/gi, "<\\/script")}</script>`);
html = html.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g,
  () => `<style>${String(stylesheet.source).replace(/<\/style/gi, "<\\/style")}</style>`);
html = html.replace(/href="\.\/favicon\.svg"/g,
  () => `href="data:image/svg+xml;base64,${Buffer.from(favicon).toString("base64")}"`);

const outputDirectory = path.join(root, "standalone");
await mkdir(outputDirectory, { recursive: true });
const filename = path.join(outputDirectory, "Skystones.html");
await writeFile(filename, html);
console.log(`Standalone game: ${filename} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
