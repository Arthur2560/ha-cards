// Baut alle Karten aus src/cards/<karte>/ zu EINER Datei: dist/ha-cards.js
//
// - Jeder Ordner in src/cards/ ist eine Karte und muss eine index.js haben.
// - Ordner, die mit "_" beginnen (z. B. _vorlage), werden ignoriert.
// - Aufruf: npm run build   |   npm run watch
import { build, context } from "esbuild";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cardsDir = join(root, "src", "cards");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const cards = readdirSync(cardsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((name) => {
    const ok = existsSync(join(cardsDir, name, "index.js"));
    if (!ok) console.warn(`⚠  src/cards/${name}/index.js fehlt – Karte wird übersprungen.`);
    return ok;
  })
  .sort();

// Virtueller Einstiegspunkt: importiert jede Karte (jede registriert sich selbst).
const entry = [
  `import { logBanner } from "./src/shared/register.js";`,
  ...cards.map((name) => `import "./src/cards/${name}/index.js";`),
  `logBanner(${JSON.stringify(pkg.version)}, ${JSON.stringify(cards)});`,
].join("\n");

const options = {
  stdin: { contents: entry, resolveDir: root, sourcefile: "ha-cards-entry.js" },
  bundle: true,
  format: "esm",
  target: "es2021",
  minify: true,
  legalComments: "none",
  outfile: join(root, "dist", "ha-cards.js"),
  define: { __HA_CARDS_VERSION__: JSON.stringify(pkg.version) },
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
  console.log(`👀 Watch-Modus – Karten: ${cards.join(", ") || "(keine)"}`);
} else {
  await build(options);
  console.log(`✅ dist/ha-cards.js v${pkg.version} – Karten: ${cards.join(", ") || "(keine)"}`);
}
