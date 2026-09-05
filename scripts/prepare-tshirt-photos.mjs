/**
 * Women's T-shirt studio shoot → web-ready garment photos.
 *
 * Source masters live outside git (see .gitignore) at 1254x1254 and ~1.3MB each.
 * This writes the small, pre-aligned set the customizer serves, matching the
 * convention the derived sets already use: 700x700, <name>-<view>.png.
 *
 * Both sides of this script speak the customizer's option slugs. A master is
 *
 *   <fit>_<length>_<neckline>_<back-design>_<sleeve>_<colour>_<view>.png
 *   body-fitting_cropped_crew_normal_cap_burgundy_front.png
 *
 * so its name states exactly which combination of options it depicts, and the
 * output keeps the two axes that vary: <sleeve>-<colour>-<view>.png. Nothing
 * here has to correct or translate a name any more — the shoot's own
 * vocabulary, its typos, its one mislabelled side view and its interchanged
 * cream/off-white puff frames were all resolved when the masters were renamed
 * (see the README Evolution Log). Re-deriving is now a pure resize.
 *
 * Framing: the masters are shot larger and lower than WomanTshirtClassic/, and
 * the side views are shot at a different zoom again (garment height 1000±44px
 * against the front's 904±6). Each image is therefore scaled to a fixed garment
 * height and pinned to the same shoulder line, so rotating the garment or
 * changing sleeve never makes it jump. Height is the safe axis to normalise on:
 * it is constant across all five sleeves (904±6 across the whole front set),
 * while width — 1149 cap to 1231 oversized — is what distinguishes them, and
 * scaling by height preserves those ratios exactly.
 *
 * Usage: node scripts/prepare-tshirt-photos.mjs [--dry-run]
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'public/assets/garments/New Tshirts';
const OUT = 'public/assets/garments/WomanTshirtStudio';

/**
 * Views the schema stores — layer_option_colors has no three-quarter column,
 * and 'left-alt' marks the one frame the shoot delivered twice: puff/black's
 * second file is another view of the LEFT side, not the right (it overlaps its
 * own left view better unmirrored, 0.87, than mirrored, 0.71, where all 101
 * other pairs in the set are the other way round). Puff/black therefore offers
 * three angles rather than a fourth that faces the wrong way.
 */
const KEPT = new Set(['front', 'back', 'left', 'right']);

/* The frame WomanTshirtClassic/ already uses: a 700px canvas holding the garment
   411px tall, shoulder line 38px down, horizontally centred. */
const CANVAS = 700, GARMENT_H = 411, TOP = 38;
/** Anything at least this dark is garment rather than the white sweep. */
const INK = 235;

/** The sleeve, colour and view a master's name declares. */
function parse(file) {
    const [, , , , sleeve, colour, view] = file.replace(/\.png$/, '').split('_');

    return { view, sleeve, colour };
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
let written = 0, skipped = 0;

for (const file of files) {
    const { view, sleeve, colour } = parse(file);
    if (!view || !sleeve || !colour) throw new Error(`cannot parse: ${file}`);
    if (!KEPT.has(view)) { skipped++; continue; }

    const target = `${sleeve}-${colour}-${view}.png`;
    ((catalogue[sleeve] ??= {})[colour] ??= {})[view] = target;
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
    .map(([sleeve, colours]) => `${sleeve}:${Object.keys(colours).length}`)
    .join(' ');
console.log(`read ${files.length} · wrote ${written} · skipped ${skipped} not stored (three-quarter, left-alt)`);
console.log(`sleeves ${counts}`);
console.log(clipped.length ? `CLIPPED (${clipped.length}): ${clipped.join(', ')}` : 'no clipping');
