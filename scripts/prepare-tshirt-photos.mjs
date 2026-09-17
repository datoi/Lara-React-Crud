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
 * against the sleeved front's 904±6). Each image is therefore scaled to a fixed
 * garment height and pinned to the same shoulder line, so rotating the garment
 * or changing sleeve never makes it jump. Height is the safe axis to normalise
 * on: it is constant within a shoot, while width — 1149 cap to 1231 oversized —
 * is what distinguishes the sleeves, and scaling by height preserves those
 * ratios exactly. It is also what lets a shoot framed at another zoom join the
 * set unchanged: the sleeveless masters carry the garment at 1136-1170px and
 * land on the same shoulder line as the rest once scaled.
 *
 * The seeder's swatch hexes are sampled from these photographs rather than
 * picked by eye, so --hexes reads the derived set back and prints them; see
 * sampleHex() for where in the garment it reads.
 *
 * Usage: node scripts/prepare-tshirt-photos.mjs [--dry-run | --hexes]
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

/**
 * The colour the seeder's dot should show for a derived photo.
 *
 * Read from the core of the body — the middle 40% across, 45-80% down from the
 * shoulder — because the neckline, the hem and the sleeve edges all carry
 * shading or the white sweep, and a mean over the whole garment comes back
 * washed out. Within that core the modal colour wins rather than the mean, so
 * a fold crossing the chest cannot drag the swatch off the dye; channels are
 * bucketed to 5 levels before the vote so a smooth gradient still lands in one
 * bucket, and the bucket's own mean is what gets returned.
 */
async function sampleHex(file) {
    const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const box = bounds(data, info);
    const x0 = Math.round(box.minX + box.width * 0.30), x1 = Math.round(box.minX + box.width * 0.70);
    const y0 = Math.round(box.minY + box.height * 0.45), y1 = Math.round(box.minY + box.height * 0.80);

    const votes = new Map();
    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            const i = (y * info.width + x) * info.channels;
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            if ((r + g + b) / 3 >= INK) continue;
            const key = `${Math.round(r / 51)},${Math.round(g / 51)},${Math.round(b / 51)}`;
            const vote = votes.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
            vote.n++; vote.r += r; vote.g += g; vote.b += b;
            votes.set(key, vote);
        }
    }
    if (!votes.size) throw new Error(`no garment pixels in the sampling window: ${file}`);

    const top = [...votes.values()].sort((a, b) => b.n - a.n)[0];
    const channel = value => Math.round(value / top.n).toString(16).padStart(2, '0');
    return `#${channel(top.r)}${channel(top.g)}${channel(top.b)}`;
}

// Reads the derived set back rather than the masters, so re-sampling after a
// palette change costs a second instead of a full re-derive.
if (process.argv.includes('--hexes')) {
    const derived = (await readdir(OUT)).filter(file => file.endsWith('-front.png')).sort();
    for (const file of derived) {
        const [sleeve, ...rest] = file.replace('-front.png', '').split('-');
        console.log(`${sleeve}\t${rest.join('-')}\t${await sampleHex(path.join(OUT, file))}`);
    }
    process.exit(0);
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
        // on the fabric shadows, and a quarter of the weight across 429 files.
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
