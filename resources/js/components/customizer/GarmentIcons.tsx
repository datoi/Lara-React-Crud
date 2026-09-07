/**
 * Line-art garment marks for the design studio's category tiles.
 *
 * Technical-sketch style rather than photography: a single even stroke, no
 * fill, drawn on one 48x64 grid so every garment sits at the same scale and
 * optical weight beside its neighbours in the tile row.
 *
 * Each garment is one continuous silhouette — neck, shoulder, out along the
 * sleeve, under the arm, down the side and across the hem — with interior lines
 * only for the details that identify it. Drawing the sleeves as separate open
 * shapes reads as wings at 40px; carrying the outline through them reads as a
 * garment.
 *
 * Every stroke is `currentColor`, so a mark takes the colour of the tile it is
 * in — burgundy on cream, cream once the tile is selected — with no second
 * asset and no recolouring.
 */
import type { ReactElement, SVGProps } from 'react';

const BASE: SVGProps<SVGSVGElement> = {
    viewBox: '0 0 48 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    focusable: false,
};

type Mark = (props: SVGProps<SVGSVGElement>) => ReactElement;

/** Short sleeves, straight body, V neckline. */
const Tops: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 13 L14 11 L7 17 L5 26 L12 28 L15 23 V49 H33 V23 L36 28 L43 26 L41 17 L34 11 L29 13" />
        <path d="M19 13 L24 20 L29 13" />
    </svg>
);

/** Fitted bodice falling into a flared skirt. */
const Dresses: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 11 L14 9 L8 15 L6 23 L12 25 L15 20 L16 31 L9 55 H39 L32 31 L33 20 L36 25 L42 23 L40 15 L34 9 L29 11" />
        <path d="M19 11 L24 17 L29 11" />
        <path d="M16 31 H32" />
    </svg>
);

/** A-line skirt: waistband, hem, two pressed folds. */
const Skirts: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M14 17 H34 V23 L41 51 H7 L14 23 Z" />
        <path d="M14 23 H34" />
        <path d="M20 23 L18 51 M28 23 L30 51" />
    </svg>
);

/** Waistband and two straight legs. */
const Trousers: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M13 12 H35 L36 54 H27 L24 31 L21 54 H12 Z" />
        <path d="M13 19 H35" />
    </svg>
);

/** Open front, notched lapels, two buttons. */
const Blazers: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 11 L13 9 L6 16 L4 27 L11 29 L14 23 V52 H34 V23 L37 29 L44 27 L42 16 L35 9 L29 11" />
        <path d="M19 11 L23 24 V52" />
        <path d="M29 11 L25 24 V52" />
        <path d="M19 11 L21 21 M29 11 L27 21" />
        <circle cx="24" cy="33" r="1" />
        <circle cx="24" cy="41" r="1" />
    </svg>
);

/** A top and a skirt side by side — the set, not one garment. */
const MatchingSets: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M9 15 L6 13 L2 18 L1 24 L5 25 L7 22 V40 H19 V22 L21 25 L25 24 L24 18 L20 13 L17 15" />
        <path d="M9 15 L13 19 L17 15" />
        <path d="M30 26 H42 V31 L47 54 H25 L30 31 Z" />
        <path d="M30 31 H42" />
        <path d="M36 31 V54" />
    </svg>
);

/** Bodice into full-length legs. */
const Jumpsuits: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 10 L14 8 L8 14 L6 22 L12 24 L15 19 V30 L14 56 H22 L24 34 L26 56 H34 L33 30 V19 L36 24 L42 22 L40 14 L34 8 L29 10" />
        <path d="M19 10 L24 16 L29 10" />
        <path d="M15 30 H33" />
    </svg>
);

/** Column gown: narrow through the body, sweeping to a long hem. */
const EveningDresses: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 12 L24 17 L29 12 L31 19 L30 32 L36 46 L39 58 H9 L12 46 L18 32 L17 19 Z" />
        <path d="M18 32 H30" />
        <path d="M24 17 V32" />
    </svg>
);

/** Collar, placket and buttons. */
const Shirt: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 12 L14 10 L7 16 L5 25 L12 27 L15 22 V51 H33 V22 L36 27 L43 25 L41 16 L34 10 L29 12" />
        <path d="M19 12 L24 18 L29 12" />
        <path d="M19 12 L22 15 L24 18 M29 12 L26 15 L24 18" />
        <path d="M24 18 V51" />
        <circle cx="24" cy="27" r="0.9" />
        <circle cx="24" cy="35" r="0.9" />
        <circle cx="24" cy="43" r="0.9" />
    </svg>
);

/** Short jacket: lapels, two buttons, cropped hem. */
const Jacket: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 12 L13 10 L6 17 L4 27 L11 29 L14 23 V48 H34 V23 L37 29 L44 27 L42 17 L35 10 L29 12" />
        <path d="M19 12 L23 24 V48" />
        <path d="M29 12 L25 24 V48" />
        <circle cx="24" cy="32" r="1" />
        <circle cx="24" cy="39" r="1" />
    </svg>
);

/** Long coat, belted at the waist, falling past the knee. */
const Coat: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M19 10 L13 8 L5 16 L3 28 L10 30 L14 22 V56 H34 V22 L38 30 L45 28 L43 16 L35 8 L29 10" />
        <path d="M19 10 L23 22 V56" />
        <path d="M29 10 L25 22 V56" />
        <path d="M13 33 H35" />
        <circle cx="24" cy="42" r="1" />
        <circle cx="24" cy="49" r="1" />
    </svg>
);

/** Dress form — the heading that has no one garment behind it. */
const SomethingElse: Mark = props => (
    <svg {...BASE} {...props}>
        <path d="M20 9 H28" />
        <path d="M24 9 V14" />
        <path d="M17 19 Q24 13 31 19 L34 34 Q24 40 14 34 Z" />
        <path d="M14 34 L16 45 Q24 49 32 45 L34 34" />
        <path d="M24 49 V57" />
        <path d="M18 59 H30" />
    </svg>
);

/** Category key → its mark. A key with no entry falls back to the dress form. */
const MARKS: Record<string, Mark> = {
    tops: Tops,
    dresses: Dresses,
    'evening-dresses': EveningDresses,
    skirts: Skirts,
    bottoms: Trousers,
    trousers: Trousers,
    blazers: Blazers,
    suits: MatchingSets,
    jumpsuits: Jumpsuits,
    shirt: Shirt,
    jacket: Jacket,
    coat: Coat,
};

export function GarmentMark({ category, className }: { category: string; className?: string }) {
    const Icon = MARKS[category] ?? SomethingElse;

    return <Icon className={className} />;
}
