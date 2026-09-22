/**
 * Studio drop (as delivered) → renamed masters in New Tshirts/.
 *
 * The shoot is delivered as a nested tree that spells each axis out in prose,
 * one folder per level, with a numbered file per view:
 *
 *   01. Fitted/01. Above the waist/01. Crew Neck/01. Sleeveless/
 *     01. Plain Closed Back/12. Blush Pink/01. ..._Blush_Front.png
 *
 * prepare-tshirt-photos.mjs expects the flat master convention instead —
 * <fit>_<length>_<neckline>_<back-design>_<sleeve>_<colour>_<view>.png — so a
 * name states its combination of customizer option slugs and re-deriving the
 * web set is a pure resize. This script is the step between: it reads the
 * delivered tree and writes those names.
 *
 * View comes from the numbered file prefix, not the suffix. The suffix is not
 * dependable — this drop spells Front as Front/Fron/Fr/F, Back as Back/Ba/Bk/B,
 * writes one three-quarter as '3,4', puts the colour last on one file and
 * leaves four Turquoise frames with no view at all. The prefix agreed with the
 * suffix on all 343 files wherever the suffix could be read, so it is the key.
 *
 * Every folder name must be in the maps below. An unrecognised one throws
 * rather than guessing, because a silently mislabelled frame is a garment
 * photographed as one option and sold as another.
 *
 * Usage: node scripts/import-studio-drop.mjs <drop-root> <sleeve>... [--dry-run]
 */
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'public/assets/garments/New Tshirts';

/** Numbered prefix → the view the frame shows. */
const VIEWS = { '01': 'front', '02': 'back', '03': 'three-quarter', '04': 'left', '05': 'right' };

/** Delivered folder name → the option slug the customizer stores. */
const FIT       = { 'Fitted': 'body-fitting' };
const LENGTH    = { 'Above the waist': 'cropped' };
const NECKLINE  = { 'Crew Neck': 'crew' };
const BACK      = { 'Plain Closed Back': 'normal', 'Classsic Straight': 'normal', 'Puff Sleeve': 'normal' };

/**
 * Sleeve is the one axis the tree splits across two levels: the drop files Puff
 * under Cap Sleeve as a second shape, where the customizer has kept them as
 * sibling options since the first shoot. Keyed on both levels so it stays a
 * lookup rather than a special case.
 */
const SLEEVES = {
    'Sleeveless/Plain Closed Back': 'sleeveless',
    'Cap Sleeve/Classsic Straight': 'cap',
    'Cap Sleeve/Puff Sleeve':       'puff',
};

const COLOURS = {
    'White': 'white', 'Off White': 'off-white', 'Cream': 'cream', 'Beige': 'beige',
    'Camel': 'camel', 'Light Gray': 'light-gray', 'Charcoal Gray': 'charcoal',
    'Black': 'black', 'Brown': 'brown', 'Red': 'red', 'Burgundy': 'burgundy',
    'Blush Pink': 'blush', 'Pink': 'pink', 'Orange': 'orange', 'Yellow': 'yellow',
    'Olive Green': 'olive', 'Green': 'green', 'Sky Blue': 'sky', 'Blue': 'blue',
    'Navy': 'navy', 'Turquoise': 'turquoise', 'Lavender': 'lavender', 'Purple': 'purple',
};

/** Strips the ordering prefix the drop puts on every folder: '12. Blush Pink'. */
const label = name => name.replace(/^\d+\.\s*/, '').trim();

function lookup(map, name, level) {
    const key = label(name);
    if (!(key in map)) throw new Error(`unmapped ${level}: "${key}"`);
    return map[key];
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [root, ...wanted] = args.filter(a => a !== '--dry-run');
if (!root || wanted.length === 0) {
    throw new Error('usage: node scripts/import-studio-drop.mjs <drop-root> <sleeve>... [--dry-run]');
}

const dirs = async dir =>
    (await readdir(dir, { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name);

if (!dryRun) await mkdir(OUT, { recursive: true });

const written = {};
const skippedSleeve = new Set();
let duplicates = 0, threeQuarter = 0;

for (const fitDir of await dirs(root)) {
    const fit = lookup(FIT, fitDir, 'fit');

    for (const lengthDir of await dirs(path.join(root, fitDir))) {
        const length = lookup(LENGTH, lengthDir, 'length');

        for (const neckDir of await dirs(path.join(root, fitDir, lengthDir))) {
            const neckline = lookup(NECKLINE, neckDir, 'neckline');
            const neckPath = path.join(root, fitDir, lengthDir, neckDir);

            for (const sleeveDir of await dirs(neckPath)) {
                for (const shapeDir of await dirs(path.join(neckPath, sleeveDir))) {
                    const sleeveKey = `${label(sleeveDir)}/${label(shapeDir)}`;
                    if (!(sleeveKey in SLEEVES)) throw new Error(`unmapped sleeve: "${sleeveKey}"`);

                    const sleeve = SLEEVES[sleeveKey];
                    if (!wanted.includes(sleeve)) { skippedSleeve.add(sleeve); continue; }

                    const backDesign = lookup(BACK, shapeDir, 'back design');
                    const shapePath = path.join(neckPath, sleeveDir, shapeDir);

                    for (const colourDir of await dirs(shapePath)) {
                        const colour = lookup(COLOURS, colourDir, 'colour');
                        const from = path.join(shapePath, colourDir);
                        const seen = new Set();

                        for (const file of (await readdir(from)).filter(f => f.endsWith('.png'))) {
                            const prefix = file.match(/^(\d{2})\./)?.[1];
                            const view = VIEWS[prefix];
                            if (!view) throw new Error(`unreadable view prefix: ${path.join(from, file)}`);

                            // The drop ships a handful of frames twice, as '…(1).png'.
                            // Verified byte-identical to their pair, so the second is dropped.
                            if (seen.has(view)) { duplicates++; continue; }
                            seen.add(view);

                            if (view === 'three-quarter') threeQuarter++;

                            const target = `${fit}_${length}_${neckline}_${backDesign}_${sleeve}_${colour}_${view}.png`;
                            if (!dryRun) await copyFile(path.join(from, file), path.join(OUT, target));
                            (written[sleeve] ??= new Set()).add(colour);
                        }
                    }
                }
            }
        }
    }
}

const summary = Object.entries(written)
    .map(([sleeve, colours]) => `${sleeve}:${colours.size} colours`)
    .join(' · ');
console.log(`${dryRun ? 'DRY RUN — ' : ''}imported ${summary || 'nothing'}`);
console.log(`duplicate frames dropped: ${duplicates} · three-quarter kept as masters: ${threeQuarter}`);
if (skippedSleeve.size) console.log(`not requested, left untouched: ${[...skippedSleeve].join(', ')}`);
