// Regenerate src/refdata/items.data.ts from the OSRS cache `objtypes.txt`
// (id <tab> internal_codename), shipped by the JayArrowz mcp-osrs server.
//
// Usage: OSRS_DATA_DIR=/path/to/mcp-osrs/dist/data npm run gen:items
// If OSRS_DATA_DIR is unset, the script auto-discovers the npx-installed
// mcp-osrs data dir under ~/.npm/_npx/*/node_modules/@jayarrowz/mcp-osrs/dist/data.
//
// Variant filtering: bank placeholders (`placeholder_*`) and noted certificates
// (`cert_*`) are dropped — the plugin's ItemTracker counts an EXACT itemId, and
// those carry separate ids that players don't bank as the base item. Unused slots
// (name "null"/empty) are dropped. Everything else (incl. _lava/_ice/_t variants)
// is kept; the base codename wins an exact-name match, variants only match when the
// user spells the suffix out.
//
// New-content supplement: the mcp-osrs objtypes snapshot lags game updates by
// months, so ids ABOVE its highest id are taken from the RuneLite API's
// `gameval.ItemID` constants (the plugin's own authoritative id source). Those
// constant names are the cache codenames uppercased, with Java-identifier
// mangling (`+` → `_`, a leading `_` before a digit) — only new ids are
// added, so existing codenames never change.
//   RUNELITE_API_JAR=/path/to/runelite-api-X.Y.Z.jar  (else the newest jar in
//     ~/.gradle/caches); JAVA_HOME=/path/to/jdk (else zulu-21, else `java`)
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));

function findDataDir() {
  if (process.env.OSRS_DATA_DIR) return process.env.OSRS_DATA_DIR;
  const npx = join(homedir(), ".npm", "_npx");
  if (existsSync(npx)) {
    for (const hash of readdirSync(npx)) {
      const dir = join(npx, hash, "node_modules", "@jayarrowz", "mcp-osrs", "dist", "data");
      if (existsSync(join(dir, "objtypes.txt"))) return dir;
    }
  }
  throw new Error(
    "could not locate the OSRS data dir. Install the mcp-osrs server (it caches under " +
      "~/.npm/_npx/...) or set OSRS_DATA_DIR to its dist/data folder.",
  );
}

const dataDir = findDataDir();
const src = join(dataDir, "objtypes.txt");
const raw = readFileSync(src, "utf8");

/** @type {Map<string, number>} codename → first (lowest) itemId */
const byCodename = new Map();
let dropped = 0;
let dupes = 0;

for (const line of raw.split("\n")) {
  if (!line.trim()) continue;
  const tab = line.indexOf("\t");
  if (tab < 0) continue;
  const id = Number.parseInt(line.slice(0, tab), 10);
  const codename = line.slice(tab + 1).trim();
  if (!Number.isInteger(id)) continue;
  if (!codename || codename === "null") {
    dropped++;
    continue;
  }
  if (codename.startsWith("placeholder_") || codename.startsWith("cert_")) {
    dropped++;
    continue;
  }
  if (byCodename.has(codename)) {
    dupes++;
    continue; // keep the lowest id (file is id-ordered)
  }
  byCodename.set(codename, id);
}

if (byCodename.size === 0) throw new Error(`no items parsed from ${src}`);
const objtypesCount = byCodename.size;
const maxObjId = Math.max(...byCodename.values());

function discoverJar() {
  if (process.env.RUNELITE_API_JAR) return { jar: process.env.RUNELITE_API_JAR, version: "env-override" };
  const root = join(homedir(), ".gradle/caches/modules-2/files-2.1/net.runelite/runelite-api");
  if (!existsSync(root)) throw new Error(`no gradle cache at ${root} — set RUNELITE_API_JAR`);
  const versions = readdirSync(root).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
  for (const v of versions.reverse()) {
    for (const hash of readdirSync(join(root, v))) {
      const jar = join(root, v, hash, `runelite-api-${v}.jar`);
      if (existsSync(jar)) return { jar, version: v };
    }
  }
  throw new Error(`no runelite-api jar found under ${root} — set RUNELITE_API_JAR`);
}

function javaBin() {
  const home = process.env.JAVA_HOME || "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home";
  const candidate = join(home, "bin/java");
  return existsSync(candidate) ? candidate : "java";
}

const { jar, version: apiVersion } = discoverJar();
const work = mkdtempSync(join(tmpdir(), "gen-items-"));
let gameval;
try {
  const dump = join(work, "ItemDump.java");
  writeFileSync(
    dump,
    `import java.lang.reflect.Field;
public class ItemDump {
    public static void main(String[] args) throws Exception {
        for (Field f : net.runelite.api.gameval.ItemID.class.getFields()) {
            if (f.getType() == int.class) System.out.println(f.getInt(null) + "\\t" + f.getName());
        }
    }
}
`,
  );
  gameval = execFileSync(javaBin(), ["-cp", jar, dump], { encoding: "utf8", maxBuffer: 64 << 20 });
} finally {
  rmSync(work, { recursive: true, force: true });
}

const newer = [];
for (const line of gameval.split(/\r?\n/)) {
  const [idStr, name] = line.split("\t");
  const id = Number.parseInt(idStr, 10);
  if (!name || !Number.isInteger(id) || id <= maxObjId) continue;
  newer.push([id, name.toLowerCase().replace(/^_(?=\d)/, "")]);
}
newer.sort((a, b) => a[0] - b[0]);
let added = 0;
for (const [id, codename] of newer) {
  if (codename.startsWith("placeholder_") || codename.startsWith("cert_")) {
    dropped++;
    continue;
  }
  if (byCodename.has(codename)) {
    dupes++;
    continue;
  }
  byCodename.set(codename, id);
  added++;
}
if (added === 0) console.warn(`warning: runelite-api ${apiVersion} added no items above id ${maxObjId}`);

// Pack as "id\tcodename" lines, id-ascending — compact + diff-friendly.
const packed = [...byCodename.entries()]
  .sort((a, b) => a[1] - b[1])
  .map(([codename, id]) => `${id}\t${codename}`)
  .join("\n");

const out = join(here, "..", "src", "refdata", "items.data.ts");
const content = `/**
 * Item reference data — \`itemId → internal codename\` for every real OSRS item,
 * from the OSRS cache \`objtypes.txt\` (JayArrowz mcp-osrs), topped up with newer
 * content from RuneLite's \`gameval.ItemID\`. Bank placeholders
 * (\`placeholder_*\`) and noted certs (\`cert_*\`) are filtered out; the plugin's
 * ItemTracker counts an EXACT itemId, so an ITEM_GRIND goal must carry the base
 * tradeable id.
 *
 * GENERATED — do not hand-edit. Regenerate with \`npm run gen:items\`
 * (see scripts/gen-items.mjs). Source: objtypes.txt (${objtypesCount} items) plus
 * runelite-api ${apiVersion} gameval.ItemID for ids above ${maxObjId} (${added} items).
 *
 * Packed as one \`id<TAB>codename\` per line; refdata/items.ts builds the lookup
 * indexes from this once at module load.
 */

export const PACKED_ITEMS = \`${packed}\`;
`;

writeFileSync(out, content);
console.log(
  `wrote ${out} with ${byCodename.size} items (${added} from runelite-api ${apiVersion}; dropped ${dropped} placeholder/cert/null, ${dupes} dup codenames) from ${src}`,
);
