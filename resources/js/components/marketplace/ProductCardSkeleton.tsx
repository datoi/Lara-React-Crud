/**
 * The marketplace card while its product is still in flight: same 4:5 image
 * bed, same ruled footer, so the grid does not reflow when the data lands.
 *
 * Lives beside the page that renders it rather than in a generic skeletons/
 * folder, because it paints in --kd-* tokens that only exist under the warm
 * surfaces — anywhere else it would render invisible on invisible.
 */
export function ProductCardSkeleton() {
    return (
        <div className="border border-[var(--kd-rule)] bg-[var(--kd-tile)]">
            <div className="aspect-[4/5] animate-pulse bg-[var(--kd-stage)]" />
            <div className="border-t border-[var(--kd-rule-soft)] px-4 pt-3.5 pb-4">
                <div className="h-[21px] w-3/4 animate-pulse bg-[var(--kd-stage)]" />
                <div className="mt-2 h-3 w-1/2 animate-pulse bg-[var(--kd-stage)]" />
                <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-[var(--kd-rule-soft)] pt-2.5">
                    <div className="h-3 w-16 animate-pulse bg-[var(--kd-stage)]" />
                    <div className="h-4 w-12 animate-pulse bg-[var(--kd-stage)]" />
                </div>
            </div>
        </div>
    );
}
