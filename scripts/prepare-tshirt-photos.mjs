/**
 * Women's T-shirt studio shoot → web-ready garment photos.
 *
 * Source masters live outside git (see .gitignore) at 1254x1254 and ~1.3MB each.
 * This writes the small, pre-aligned set the customizer serves, matching the
 * convention WomanTshirtClassic/ already uses: 700x700, <name>-<view>.png.
 *
 * Three corrections are applied, each established by measuring pixels rather
 * than trusting the filename — see the README Evolution Log:
 *   · two files labelled BodyFit measure identically to their Fit group, and
 *     fill that group's one missing colour
 *   · one colour set carries a stray "Front" token mid-name
 *   · the Puff off-white and cream views are interchanged; the "(1)" copies are
 *     the off-white ones, distinguished by red-minus-blue warmth (13 vs 25)
 *
 * Framing: the masters are shot larger and lower than WomanTshirtClassic/, and
 * the side views are shot at a different zoom again (garment height 1000±44px
 * against the front's 904±6). Each image is therefore scaled to a fixed garment
 * height and pinned to the same shoulder line, so rotating the garment or
 * changing style never makes it jump. Height is the safe axis to normalise on:
 * it is constant across all five silhouettes (904±6 across the whole front set),
 * while width — 1149 fitted to 1231 oversized — is what distinguishes them, and
 * scaling by height preserves those ratios exactly.
 *
 * Usage: node scripts/prepare-tshirt-photos.mjs [--dry-run]
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'public/assets/garments/New Tshirts';
const OUT = 'public/assets/garments/WomanTshirtStudio';

/** The numeric prefix is the reliable view axis; the trailing word is typo-prone. */
const VIEW = { '01.': 'front', '02.': 'back', '03.': 'three-quarter', '04.': 'left', '05.': 'right' };
/** Views the schema stores — layer_option_colors has no three-quarter column. */
const KEPT = new Set(['front', 'back', 'left', 'right']);

const SILHOUETTE = {
    Fitted: 'fitted', Wide: 'wide', Drop: 'dropped', Dropped: 'dropped',
    Oversized: 'oversized', Puff: 'puff',
};

/**
 * Views the shoot did not actually deliver, keyed `silhouette-colour-view`.
 *
 * Puff/black's 05 file is a second frame of the LEFT side, not the right: it
 * overlaps its own left view far better unmirrored (0.94) than mirrored (0.76),
 * where all 101 other pairs in the set are the other way round. Writing it would
 * put a left-facing photograph behind the Right tile.
 */
const NOT_SHOT = new Set(['puff-black-right']);

const COLOUR = {
    Beige: 'beige', Black: 'black', Blue: 'blue', Blush: 'blush', Brown: 'brown',
    Burgundy: 'burgundy', Camel: 'camel', Charc: 'charcoal', Charcoal: 'charcoal',
    CharcoalGray: 'charcoal', Cream: 'cream', Emerald: 'emerald', Green: 'green',
    Lavender: 'lavender', LightG: 'light-gray', LightGra: 'light-gray', LightGray: 'light-gray',
    Navy: 'navy', Off: 'off-white', Olive: 'olive', Orange: 'orange', Pink: 'pink',
    Purple: 'purple', Red: 'red', Sky: 'sky', Turqu: 'turquoise', Turquoise: 'turquoise',
    White: 'white', Yellow: 'yellow',
};

/* The frame WomanTshirtClassic/ already uses: a 700px canvas holding the garment
   411px tall, shoulder line 38px down, horizontally centred. */
const CANVAS = 700, GARMENT_H = 411, TOP = 38;
/** Anything at least this dark is garment rather than the white sweep. */
const INK = 235;

function parse(file) {
    let tokens = file.replace(/\.png$/, '').split('_');
    const isCopy = / \(1\)$/.test(tokens.at(-1));
    if (tokens.length === 10 && tokens[3] === 'Front') {
        tokens = [...tokens.slice(0, 3), ...tokens.slice(4)];
    }
    const [index, , , , , , shape, tone] = tokens;

    const view = VIEW[index];
    const silhouette = SILHOUETTE[shape];
    let colour = COLOUR[tone];

    // Puff's off-white and cream were filed under one name: the plain files are
    // cream, the "(1)" copies off-white. Only the fronts were filed correctly.
    if (silhouette === 'puff' && colour === 'off-white' && view !== 'front') {
        colour = isCopy ? 'off-white' : 'cream';
    }
    return { view, silhouette, colour };
}

/** Bounding box of the garment within a white-swept frame. */
function bounds(data, info) {
    let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const i = (y * info.width + x) * info.channels;
            if ((data[i] + data[i + 1] + data[i + 2]) / 3 < INK) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1, maxX, maxY };
}

const dryRun = process.argv.includes('--dry-run');
const files = (await readdir(SRC)).filter(file => file.endsWith('.png'));
if (!dryRun) await mkdir(OUT, { recursive: true });

const catalogue = {};
const clipped = [];
const rejected = [];
let written = 0, skipped = 0;

for (const file of files) {
    const { view, silhouette, colour } = parse(file);
    if (!view || !silhouette || !colour) throw new Error(`cannot parse: ${file}`);
    if (!KEPT.has(view)) { skipped++; continue; }

    const target = `${silhouette}-${colour}-${view}.png`;
    if (NOT_SHOT.has(`${silhouette}-${colour}-${view}`)) { rejected.push(target); continue; }
    ((catalogue[silhouette] ??= {})[colour] ??= {})[view] = target;
    if (dryRun) continue;

    const master = sharp(path.join(SRC, file)).removeAlpha();
    const raw = await master.clone().raw().toBuffer({ resolveWithObject: true });
    const box = bounds(raw.data, raw.info);
    const width = Math.round(box.width * (GARMENT_H / box.height));

    const garment = await master
        .extract({ left: box.minX, top: box.minY, width: box.width, height: box.height })
        .resize(width, GARMENT_H)
        .toBuffer();

    const out = await sharp({ create: { width: CANVAS, height: CANVAS, channels: 3, background: '#ffffff' } })
        .composite([{ input: garment, left: Math.round((CANVAS - width) / 2), top: TOP }])
        // Quantised to 200 colours: indistinguishable from lossless at 4x zoom
        // on the fabric shadows, and a quarter of the weight across 408 files.
        .png({ compressionLevel: 9, palette: true, quality: 95, colours: 200 })
        .toBuffer();

    // Reframing must never crop the garment — verify against the written pixels.
    const verify = await sharp(out).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const placed = bounds(verify.data, verify.info);
    if (placed.minX <= 0 || placed.minY <= 0 || placed.maxX >= CANVAS - 1 || placed.maxY >= CANVAS - 1) {
        clipped.push(target);
    }

    await writeFile(path.join(OUT, target), out);
    written++;
}

const counts = Object.entries(catalogue)
    .map(([silhouette, colours]) => `${silhouette}:${Object.keys(colours).length}`)
    .join(' ');
console.log(`read ${files.length} · wrote ${written} · skipped ${skipped} three-quarter`);
console.log(`silhouettes ${counts}`);
if (rejected.length) console.log(`not shot, skipped: ${rejected.join(', ')}`);
console.log(clipped.length ? `CLIPPED (${clipped.length}): ${clipped.join(', ')}` : 'no clipping');
