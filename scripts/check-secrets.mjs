import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", "dist", ".git", "coverage"]);
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".env", ".txt"]);
const patterns = [
  { name: "OpenAI API key", regex: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g },
  { name: "GitHub token", regex: /gh[pousr]_[A-Za-z0-9]{20,}/g },
];

const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!extensions.has(path.extname(entry.name)) && entry.name !== ".env.example") continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) findings.push(`${path.relative(root, fullPath)}: ${pattern.name}`);
      pattern.regex.lastIndex = 0;
    }
  }
}

walk(root);

if (findings.length) {
  console.error("Se detectaron posibles secretos:\n" + findings.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Secret scan: OK");
