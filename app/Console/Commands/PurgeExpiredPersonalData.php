<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Console\Command;

/**
 * Deletes personal data whose time is up under the privacy policy (§13):
 *
 *  - the measurements given for an order, 90 days after it was delivered or
 *    cancelled — unless a return or problem report on it is still open, which
 *    the policy allows to be kept until it is settled;
 *  - unfinished registrations after 90 days: pending sign-ups that never
 *    entered their code, and customer accounts that entered it but never
 *    accepted the terms and have no orders.
 *
 * Measurements a customer saved on their own profile are not touched; the
 * policy keeps them until the customer deletes them. Runs daily from the
 * scheduler (routes/console.php), which start.sh keeps running.
 */
class PurgeExpiredPersonalData extends Command
{
    public const RETENTION_DAYS = 90;

    protected $signature = 'privacy:purge {--dry-run : Report what would be deleted without deleting it}';

    protected $description = 'Delete order measurements and unfinished registrations past the privacy policy\'s 90 days';

    public function handle(): int
    {
        $cutoff = now()->subDays(self::RETENTION_DAYS);
        $dryRun = (bool) $this->option('dry-run');

        $orders = 0;

        Order::query()
            ->whereNull('measurements_purged_at')
            ->where(fn ($q) => $q
                ->where(fn ($q) => $q->where('status', 'delivered')->where('delivered_at', '<=', $cutoff))
                ->orWhere(fn ($q) => $q->where('status', 'cancelled')->whereRaw('COALESCE(cancelled_at, updated_at) <= ?', [$cutoff])))
            ->whereDoesntHave('claims', fn ($q) => $q->where('status', 'open'))
            ->with('items')
            ->chunkById(100, function ($chunk) use ($dryRun, &$orders) {
                foreach ($chunk as $order) {
                    $design = $order->custom_design_data ?? [];
                    $items = $order->items->filter(fn ($item) => ! empty($item->cm_measurements));

                    if (! array_key_exists('measurements', $design) && $items->isEmpty()) {
                        continue;
                    }

                    $orders++;

                    if ($dryRun) {
                        continue;
                    }

                    unset($design['measurements']);
                    $items->each(fn ($item) => $item->update(['cm_measurements' => null]));
                    $order->update(['custom_design_data' => $design, 'measurements_purged_at' => now()]);
                }
            });

        $verifications = Verification::where('created_at', '<=', $cutoff);

        $abandoned = User::where('role', 'customer')
            ->whereNull('terms_accepted_at')
            ->where('created_at', '<=', $cutoff)
            ->whereNotIn('id', Order::select('user_id'));

        $counts = [$orders, $verifications->count(), $abandoned->count()];

        if (! $dryRun) {
            $verifications->delete();
            $abandoned->delete();
        }

        $this->info(sprintf(
            '%s measurements of %d order(s), %d pending sign-up(s), %d unfinished account(s).',
            $dryRun ? 'Would delete' : 'Deleted',
            ...$counts,
        ));

        return self::SUCCESS;
    }
}
