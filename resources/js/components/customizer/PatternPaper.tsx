/**
 * Pattern paper — the drafting sheet behind the stage.
 *
 * Three blocks a tailor would actually cut from: a bodice front, a set-in
 * sleeve and a flared skirt panel, each with its seam allowance offset, its
 * balance notches and a grainline arrow. Drawn rather than photographed so it
 * scales to any stage size and takes its colour from the surface it sits on.
 *
 * Decorative: it carries no information the customer has to read, so it is
 * hidden from assistive technology and kept faint enough that anything mounted
 * over it stays the subject.
 */
export default function PatternPaper({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 400 300"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Bodice front — shoulder, armhole scoop, waist */}
            <g>
                <path d="M40 46 L96 40 L112 74 Q104 104 116 132 L120 214 L44 224 Z" />
                <path d="M46 54 L94 49 L105 76 Q98 104 109 130 L113 208 L51 216 Z" strokeDasharray="4 4" opacity={0.7} />
                <path d="M78 128 V166" />
                <path d="M74 132 L78 126 L82 132" />
                <path d="M74 162 L78 168 L82 162" />
                <path d="M96 40 L94 49 M112 74 L105 76" />
                <path d="M60 44 V51 M62 220 V213" />
            </g>

            {/* Sleeve — head curve, underarm seam, hem */}
            <g>
                <path d="M168 62 Q188 34 210 40 Q232 46 244 74 L252 172 Q210 186 164 172 Z" />
                <path d="M175 68 Q190 44 209 49 Q228 54 238 77 L245 166 Q210 178 172 166 Z" strokeDasharray="4 4" opacity={0.7} />
                <path d="M208 84 V140" />
                <path d="M204 88 L208 82 L212 88" />
                <path d="M204 136 L208 142 L212 136" />
                <path d="M186 48 L189 55 M228 51 L224 58" />
            </g>

            {/* Skirt panel — waist curve flaring to a swept hem */}
            <g>
                <path d="M296 48 Q322 42 348 50 L380 208 Q330 226 280 206 Z" />
                <path d="M302 56 Q322 51 343 57 L371 202 Q330 217 289 200 Z" strokeDasharray="4 4" opacity={0.7} />
                <path d="M332 96 V162" />
                <path d="M328 100 L332 94 L336 100" />
                <path d="M328 158 L332 164 L336 158" />
                <path d="M322 45 V52 M318 214 V206" />
            </g>
        </svg>
    );
}
