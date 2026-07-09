import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#f3efe7",
  panel: "#fffaf2",
  line: "rgba(31,37,48,0.10)",
  ink: "#1f2530",
  gold: "#d3a625",
  gold2: "#f2c94c",
  navy: "#354155",
  soft: "#f7f2e6",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 240H1284M0 480H1284M0 720H1284M0 960H1284M0 1200H1284M0 1440H1284M0 1680H1284M0 1920H1284M0 2160H1284M0 2400H1284M0 2640H1284" stroke="${c.line}" stroke-width="3"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="82" y="130" font-family="Courier New, monospace" font-size="30" font-weight="900" letter-spacing="7" fill="${c.gold}">METER NOTE</text>
    <text x="80" y="236" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="84" y="308" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="${c.navy}">${esc(subtitle)}</text>
  `;
}

function card(x, y, subject, score, note, wallet, date) {
  const bars = Array.from({ length: 10 }, (_, i) => i + 1);
  const noteLines = wrap(note, 34).slice(0, 3);
  return `
    <rect x="${x}" y="${y}" width="1080" height="1220" rx="34" fill="${c.panel}" stroke="${c.line}" stroke-width="6"/>
    <text x="${x + 62}" y="${y + 88}" font-family="Courier New, monospace" font-size="24" font-weight="900" letter-spacing="5" fill="${c.gold}">SUBJECT</text>
    <text x="${x + 62}" y="${y + 158}" font-family="Arial, sans-serif" font-size="58" font-weight="900" fill="${c.ink}">${esc(subject)}</text>
    <rect x="${x + 54}" y="${y + 228}" width="972" height="280" rx="28" fill="${c.soft}"/>
    ${bars.map((item) => `<rect x="${x + 96 + (item - 1) * 88}" y="${y + 286}" width="58" height="42" rx="21" fill="${item <= score ? c.gold : '#ddd4c2'}"/>`).join("")}
    <rect x="${x + 356}" y="${y + 356}" width="370" height="110" rx="55" fill="${c.navy}"/>
    <text x="${x + 416}" y="${y + 400}" font-family="Courier New, monospace" font-size="20" font-weight="900" letter-spacing="4" fill="white">SCORE</text>
    <text x="${x + 438}" y="${y + 446}" font-family="Arial, sans-serif" font-size="54" font-weight="900" fill="#f7e29a">${esc(`${score}/10`)}</text>
    <rect x="${x + 54}" y="${y + 556}" width="972" height="176" rx="24" fill="#fbf8f1" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 86}" y="${y + 618}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.gold}">REASON</text>
    ${noteLines.map((line, i) => `<text x="${x + 86}" y="${y + 676 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
    <rect x="${x + 54}" y="${y + 782}" width="304" height="220" rx="22" fill="#fbf8f1"/>
    <rect x="${x + 398}" y="${y + 782}" width="304" height="220" rx="22" fill="#fbf8f1"/>
    <rect x="${x + 742}" y="${y + 782}" width="284" height="220" rx="22" fill="#fbf8f1"/>
    <text x="${x + 86}" y="${y + 844}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.gold}">SCORE</text>
    <text x="${x + 86}" y="${y + 912}" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${c.ink}">${esc(String(score))}</text>
    <text x="${x + 430}" y="${y + 844}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.gold}">WALLET</text>
    <text x="${x + 430}" y="${y + 912}" font-family="Arial, sans-serif" font-size="32" font-weight="900" fill="${c.ink}">${esc(wallet)}</text>
    <text x="${x + 774}" y="${y + 844}" font-family="Courier New, monospace" font-size="20" font-weight="900" fill="${c.gold}">STAMPED</text>
    <text x="${x + 774}" y="${y + 912}" font-family="Arial, sans-serif" font-size="34" font-weight="900" fill="${c.ink}">${esc(date)}</text>
  `;
}

function panel(x, y, title, body, fill = "#fbf8f1") {
  return `
    <rect x="${x}" y="${y}" width="520" height="220" rx="24" fill="${fill}" stroke="${c.line}" stroke-width="5"/>
    <text x="${x + 34}" y="${y + 74}" font-family="Courier New, monospace" font-size="20" font-weight="900" letter-spacing="5" fill="${c.gold}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 128 + i * 34}" font-family="Arial, sans-serif" font-size="30" font-weight="850" fill="${c.ink}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Score it fast.", "Save a quick 1-10 review on Base.")}
    ${card(102, 420, "Demo flow", 8, "Clear enough to use on the first try, but the final state could feel sharper.", "0x65...020d", "May 18")}
    ${panel(102, 1740, "Use case", "Demo reviews, creator feedback, screenshot quality, and fast scoring.")}
    ${panel(662, 1740, "Public note", "A short reason lives beside the score on Base.", "#f7f2e6")}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Pick the score.", "Select a 1-10 meter before saving.")}
    ${panel(102, 420, "Preset", "App screenshot scored 7/10.", "#f7f2e6")}
    ${panel(662, 420, "Action", "Save on Base")}
    ${card(102, 760, "App screenshot", 7, "Good structure, though the primary visual could be stronger on mobile.", "0x42...af62", "May 18")}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Reload any note.", "Look up a saved score by entry ID.")}
    ${card(102, 420, "Creator profile", 9, "Fast to scan and feels trustworthy. Nice wallet context and feedback density.", "0x99...9652", "May 18")}
    ${panel(102, 1740, "Lookup", "Reload a public score note by entry ID.")}
    ${panel(662, 1740, "Receipt", "Open the Base transaction after confirmation.", "#f7f2e6")}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="140" y="160" width="744" height="704" rx="82" fill="${c.panel}" stroke="${c.line}" stroke-width="24"/>
    <rect x="200" y="250" width="624" height="240" rx="32" fill="${c.soft}"/>
    ${Array.from({ length: 10 }, (_, i) => `<rect x="${220 + i * 56}" y="300" width="34" height="36" rx="18" fill="${i < 8 ? c.gold : '#ddd4c2'}"/>`).join("")}
    <rect x="336" y="376" width="352" height="92" rx="46" fill="${c.navy}"/>
    <text x="410" y="438" font-family="Arial, sans-serif" font-size="60" font-weight="900" fill="#f7e29a">8/10</text>
    <rect x="200" y="548" width="624" height="170" rx="28" fill="#fbf8f1"/>
    <rect x="200" y="748" width="286" height="88" rx="22" fill="#fbf8f1"/>
    <rect x="538" y="748" width="286" height="88" rx="22" fill="#fbf8f1"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="94" y="154" font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="${c.ink}">Meter Note</text>
    <text x="102" y="246" font-family="Arial, sans-serif" font-size="42" font-weight="800" fill="${c.navy}">Save a quick score and reason on Base.</text>
    ${panel(96, 390, "Use case", "Demo reviews, feedback notes, screenshot scoring, creator comments.")}
    ${panel(96, 662, "Result", "Public score, note, wallet, and receipt on Base.", "#f7f2e6")}
    ${card(770, 86, "Demo flow", 8, "Clear enough to use on the first try, but the final state could feel sharper.", "0x65...020d", "May 18")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Meter Note",
    "",
    "App Name: Meter Note",
    "Tagline: Score it fast",
    "Description: Save a 1-10 score with a short note, wallet, and timestamp on Base for demos, reviews, and quick feedback.",
    "",
    "Domain: https://meter-note.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
    "",
  ].join("\n"),
  "utf8",
);

console.log(`Generated ${files.length} Base submission assets in ${outDir}`);
