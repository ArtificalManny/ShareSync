// tools/replaceCopy.mjs
// Usage: node tools/replaceCopy.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..", "src");
const exts = new Set([".js", ".jsx", ".ts", ".tsx", ".mdx", ".html"]);

const patterns = [
  // Headlines / specific phrases
  { from: /Public Streak Feed/g, to: "Public Cadence Feed" },

  // Singular word (Title, Sentence, lower)
  { from: /\bStreak\b/g, to: "Cadence" },
  { from: /\bstreak\b/g, to: "cadence" },

  // Plural
  { from: /\bStreaks\b/g, to: "Cadences" },
  { from: /\bstreaks\b/g, to: "cadences" },
];

const filesTouched = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (exts.has(path.extname(entry.name))) {
      let src = fs.readFileSync(p, "utf8");
      let out = src;
      for (const { from, to } of patterns) out = out.replace(from, to);
      if (out !== src) {
        fs.writeFileSync(p, out, "utf8");
        filesTouched.push(path.relative(ROOT, p));
      }
    }
  }
}

walk(ROOT);

console.log(
  filesTouched.length
    ? `Rewrote ${filesTouched.length} files:\n` + filesTouched.map(f => " - " + f).join("\n")
    : "No changes needed. All good!"
);