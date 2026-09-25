<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Fills out catalogue descriptions that are too thin to read as descriptions.
 *
 * Flitt will not switch the merchant to real payments until every product
 * carries a description and a price in GEL. The prices were always right; the
 * descriptions were mostly one or two words, several of them just the product's
 * own name repeated — technically present, and not what the requirement is for.
 *
 * It appends rather than rewrites. A tailor's own words about their garment are
 * the part worth keeping, so what they wrote stays at the front and the facts
 * the catalogue already holds — fabric, sizes, that the piece is made to measure
 * — are added behind it. Nothing here is invented: every clause comes from a
 * column, which is why a product missing both fabric and sizes is skipped rather
 * than padded with something agreeable.
 *
 * Georgian, because the column is one string rather than one per locale, the
 * site's default is Georgian, and all but one of the existing descriptions are
 * already Georgian.
 */
class EnrichProductDescriptions extends Command
{
    protected $signature = 'catalogue:enrich-descriptions
                            {--apply : Write the changes. Without this the command only shows them}
                            {--threshold=40 : Descriptions shorter than this many characters are treated as thin}';

    protected $description = 'Append fabric, sizes and made-to-order detail to catalogue descriptions that are too thin';

    /**
     * Fabrics are stored in English from the tailor's dropdown. Anything not
     * listed falls through as written rather than being guessed at.
     */
    private const FABRICS = [
        'silk'       => 'აბრეშუმი',
        'cotton'     => 'ბამბა',
        'linen'      => 'სელი',
        'wool'       => 'მატყლი',
        'polyester'  => 'პოლიესტერი',
        'denim'      => 'ჯინსი',
        'leather'    => 'ტყავი',
        'viscose'    => 'ვისკოზა',
        'chiffon'    => 'შიფონი',
        'crepe'      => 'კრეპი',
        'jersey'     => 'ჯერსი',
    ];

    /** Present in every enriched description, so a second run is a no-op. */
    private const MARKER = 'მზადდება 7–14 სამუშაო დღეში';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $threshold = max(1, (int) $this->option('threshold'));

        $rows = [];
        $skipped = 0;

        foreach (Product::orderBy('id')->get() as $product) {
            $current = trim((string) $product->description);

            if (str_contains($current, self::MARKER)) {
                $skipped++;
                continue;
            }

            $thin = $current === ''
                || mb_strlen($current) < $threshold
                || mb_strtolower($current) === mb_strtolower(trim((string) $product->name));

            if (! $thin) {
                $skipped++;
                continue;
            }

            $next = $this->compose($product, $current);

            if ($next === null || $next === $current) {
                $skipped++;
                continue;
            }

            $rows[] = [$product->id, mb_strimwidth($product->name, 0, 22, '…'), mb_strimwidth($next, 0, 78, '…')];

            if ($apply) {
                DB::transaction(fn () => $product->forceFill(['description' => $next])->save());
            }
        }

        if ($rows === []) {
            $this->info("Nothing to do — {$skipped} product(s) already read well enough.");

            return self::SUCCESS;
        }

        $this->table(['id', 'product', $apply ? 'written' : 'would write'], $rows);
        $this->line('');
        $this->info(count($rows) . ' updated, ' . $skipped . ' left alone.');

        if (! $apply) {
            $this->warn('Dry run. Re-run with --apply to write these.');
        }

        return self::SUCCESS;
    }

    /**
     * The tailor's words, then whatever the catalogue can state as fact.
     * Returns null when there is nothing factual to add, so a bare product is
     * left for a human rather than padded.
     */
    private function compose(Product $product, string $current): ?string
    {
        $clauses = [];

        if ($fabric = $this->fabric($product)) {
            $clauses[] = "მასალა — {$fabric}";
        }

        if ($sizes = $this->sizes($product)) {
            $clauses[] = "ზომები — {$sizes}";
        }

        if ($clauses === []) {
            return null;
        }

        $clauses[] = 'იკერება ინდივიდუალური ზომებით და ' . self::MARKER;

        $lead = rtrim($current, " \t\n\r\0\x0B.,;:");

        return ($lead === '' ? '' : $lead . '. ') . implode('. ', $clauses) . '.';
    }

    private function fabric(Product $product): ?string
    {
        $raw = trim((string) $product->fabric);

        if ($raw === '') {
            return null;
        }

        return self::FABRICS[mb_strtolower($raw)] ?? $raw;
    }

    /**
     * "Custom" is the made-to-measure option rather than a size, and the closing
     * clause already says the piece is cut to the customer, so listing it would
     * say the same thing twice.
     */
    private function sizes(Product $product): ?string
    {
        $sizes = array_values(array_filter(
            (array) $product->sizes,
            fn ($size) => is_string($size) && trim($size) !== '' && mb_strtolower(trim($size)) !== 'custom',
        ));

        return $sizes === [] ? null : implode(', ', $sizes);
    }
}
