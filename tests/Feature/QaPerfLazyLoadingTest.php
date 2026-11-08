<?php

use App\Models\Category;
use App\Models\CustomizerProduct;
use App\Models\KereNotification;
use App\Models\LayerCategory;
use App\Models\LayerOption;
use App\Models\LayerOptionColor;
use App\Models\Message;
use App\Models\Order;
use App\Models\OrderClaim;
use App\Models\OrderNote;
use App\Models\OrderPayment;
use App\Models\Product;
use App\Models\Review;
use App\Models\TailorRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Pre-launch QA: query counts on the heavy read endpoints, at 5 and at 30 of
 * everything, plus any lazy load Eloquent would flag. A count that grows with
 * the data is an N+1. Results are also written to qa-perf-queries.json in the system temp directory
 * so the numbers can be read after the run.
 */
function qap_actor(string $role, array $extra = []): array
{
    $token = Str::random(60);
    $user = User::factory()->create(array_merge([
        'role' => $role,
        'terms_accepted_at' => now(),
        'api_token' => hash('sha256', $token),
    ], $role === 'tailor' ? ['approval_status' => 'approved', 'does_remodeling' => true] : [], $extra));

    return [$user, $token];
}

/** Adds $n of everything the endpoints read, around the same actors. */
function qap_seed(array $ctx, int $n): void
{
    Model::unguarded(function () use ($ctx, $n) {
        [$customer, $tailor, $admin, $otherTailors, $categories] = [$ctx['customer'], $ctx['tailor'], $ctx['admin'], $ctx['otherTailors'], $ctx['categories']];

        for ($i = 0; $i < $n; $i++) {
            $maker = $i % 2 ? $tailor : $otherTailors[$i % count($otherTailors)];
            $product = Product::create([
                'category_id' => $categories[$i % count($categories)]->id,
                'tailor_id' => $maker->id,
                'name' => "Perf product {$i} ".Str::random(4),
                'slug' => 'perf-'.Str::random(10),
                'price' => 40 + $i,
                'stock' => 50,
                'status' => 'active',
                'gender' => 'unisex',
                'colors' => ['#000000'],
                'sizes' => ['M'],
                'images' => ['https://example.com/p.jpg'],
            ]);

            // A delivered, paid marketplace order for the main customer, made by the main tailor.
            $order = Order::create([
                'user_id' => $customer->id, 'tailor_id' => $tailor->id,
                'order_number' => 'ORD-'.Str::upper(Str::random(8)), 'order_type' => 'marketplace',
                'status' => 'delivered', 'payment_status' => 'paid', 'delivered_at' => now(),
                'subtotal' => 50, 'shipping' => 15, 'total' => 65,
                'first_name' => 'A', 'last_name' => 'B', 'email' => 'a@example.com', 'phone' => '+995555000000',
                'address' => 'N/A', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
            ]);
            $order->items()->create(['product_id' => $product->id, 'product_name' => $product->name, 'quantity' => 1, 'price' => 50, 'color' => '#000000', 'size' => 'M']);
            $order->items()->create(['product_id' => $product->id, 'product_name' => $product->name, 'quantity' => 2, 'price' => 50, 'color' => '#000000', 'size' => 'L']);
            OrderPayment::create(['order_id' => $order->id, 'stage' => 'full', 'reference' => $order->order_number.'_'.Str::lower(Str::random(8)), 'amount' => 65, 'paid_at' => now()]);
            Message::create(['order_id' => $order->id, 'sender_id' => $customer->id, 'channel' => 'customer', 'message' => 'Hello']);
            Message::create(['order_id' => $order->id, 'sender_id' => $admin->id, 'channel' => 'customer', 'message' => 'Hi']);
            OrderClaim::create(['order_id' => $order->id, 'user_id' => $customer->id, 'type' => 'problem', 'message' => 'Loose seam', 'photos' => ['https://example.com/c.jpg'], 'status' => 'open']);
            OrderNote::create(['order_id' => $order->id, 'admin_id' => $admin->id, 'body' => 'Checked']);
            Review::create(['order_id' => $order->id, 'user_id' => $customer->id, 'product_id' => $product->id, 'rating' => 4 + ($i % 2), 'comment' => 'Nice', 'status' => 'published']);

            // An open remodel request with an estimate from another tailor.
            $open = Order::create([
                'user_id' => $customer->id, 'tailor_id' => null,
                'order_number' => 'RMD-'.Str::upper(Str::random(8)), 'order_type' => 'remodel',
                'status' => 'pending_assignment', 'payment_status' => 'not_required',
                'subtotal' => 0, 'shipping' => 15, 'total' => 15,
                'custom_design_data' => ['change_request' => 'Shorten', 'remodel_images' => ['https://example.com/r.jpg'], 'measurements' => ['chest' => 90]],
                'first_name' => 'A', 'last_name' => 'B', 'email' => 'a@example.com', 'phone' => '+995555000000',
                'address' => 'Rustaveli 1', 'city' => 'Tbilisi', 'zip' => '0100', 'country' => 'GE',
            ]);
            TailorRequest::create(['order_id' => $open->id, 'tailor_id' => $otherTailors[$i % count($otherTailors)]->id, 'offered_price' => 80, 'ready_in_days' => 5, 'status' => 'pending']);

            KereNotification::create(['user_id' => $customer->id, 'type' => 'order_status', 'title' => 't', 'body' => 'b', 'data' => ['order_id' => $order->id], 'is_read' => false]);

            // A studio garment with three attributes of three options, two colourways each.
            $garment = CustomizerProduct::create(['name' => "Perf garment {$i}", 'slug' => 'perf-garment-'.Str::lower(Str::random(8)), 'category' => 'tops', 'gender' => 'women', 'base_price' => 45, 'is_active' => true]);
            foreach (['fit', 'sleeves', 'neckline'] as $a => $attr) {
                $layer = LayerCategory::create(['customizer_product_id' => $garment->id, 'name' => ucfirst($attr), 'slug' => $attr, 'z_index' => $a, 'display_order' => $a]);
                for ($o = 0; $o < 3; $o++) {
                    $option = LayerOption::create(['layer_category_id' => $layer->id, 'name' => "{$attr} {$o}", 'slug' => "{$attr}-{$o}", 'image_path' => '/assets/x.png', 'price_modifier' => 0, 'is_active' => true, 'display_order' => $o, 'depicts' => $attr === 'sleeves' ? ['fit' => 'fit-0'] : null]);
                    if ($attr === 'sleeves') {
                        foreach (['red', 'blue'] as $c => $colour) {
                            LayerOptionColor::create(['layer_option_id' => $option->id, 'name' => $colour, 'color_hex' => '#ff0000', 'image_path' => '/assets/x.png', 'display_order' => $c]);
                        }
                    }
                }
            }
        }
    });
}

function qap_context(): array
{
    [$customer, $customerToken] = qap_actor('customer');
    [$tailor, $tailorToken] = qap_actor('tailor');
    [$admin, $adminToken] = qap_actor('admin');
    $otherTailors = [qap_actor('tailor')[0], qap_actor('tailor')[0], qap_actor('tailor')[0]];
    $categories = collect(['dresses', 'shirts', 'pants'])->map(fn ($slug) => Category::create(['name' => ucfirst($slug), 'slug' => $slug]))->all();

    return compact('customer', 'customerToken', 'tailor', 'tailorToken', 'admin', 'adminToken', 'otherTailors', 'categories');
}

/** Runs the request and returns [status, query count, lazy loads]. */
function qap_measure(callable $request): array
{
    $queries = 0;
    $lazy = [];
    Model::handleLazyLoadingViolationUsing(function ($model, $relation) use (&$lazy) {
        $lazy[get_class($model).'::'.$relation] = true;
    });
    DB::flushQueryLog();
    $listener = function () use (&$queries) {
        $queries++;
    };
    DB::listen($listener);
    app('auth')->forgetGuards();
    $response = $request();
    $count = $queries;
    $queries = PHP_INT_MIN; // stop counting (DB::listen cannot be removed)

    return [$response->status(), $count, array_keys($lazy), strlen((string) $response->getContent())];
}

function qap_record(string $endpoint, array $row): void
{
    $file = sys_get_temp_dir().'/qa-perf-queries.json';
    $all = file_exists($file) ? (json_decode(file_get_contents($file), true) ?: []) : [];
    $all[$endpoint] = $row;
    file_put_contents($file, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

beforeEach(function () {
    Model::preventLazyLoading(true);
});

afterEach(function () {
    Model::preventLazyLoading(false);
    Model::handleLazyLoadingViolationUsing(null);
});

dataset('heavy endpoints', [
    'GET /api/products' => ['/api/products', null],
    'GET /api/products/{id}' => ['/api/products/{product}', null],
    'GET /api/products/{id}/reviews' => ['/api/products/{product}/reviews', null],
    'GET /api/categories' => ['/api/categories', null],
    'GET /api/reviews/landing' => ['/api/reviews/landing', null],
    'GET /api/platform/stats' => ['/api/platform/stats', null],
    'GET /api/customizer/products' => ['/api/customizer/products?gender=women', null],
    'GET /api/customizer/products/{slug}' => ['/api/customizer/products/{garment}', null],
    'GET /api/customer/orders' => ['/api/customer/orders', 'customerToken'],
    'GET /api/notifications' => ['/api/notifications', 'customerToken'],
    'GET /api/messages/counts' => ['/api/messages/counts', 'customerToken'],
    'GET /api/tailor/orders' => ['/api/tailor/orders', 'tailorToken'],
    'GET /api/tailor/open-orders' => ['/api/tailor/open-orders', 'tailorToken'],
    'GET /api/tailor/products' => ['/api/tailor/products', 'tailorToken'],
    'GET /api/admin/orders' => ['/api/admin/orders', 'adminToken'],
    'GET /api/admin/users' => ['/api/admin/users', 'adminToken'],
    'GET /api/admin/reviews' => ['/api/admin/reviews', 'adminToken'],
    'GET /api/admin/claims' => ['/api/admin/claims', 'adminToken'],
    'GET /api/admin/tailors/pending' => ['/api/admin/tailors/pending', 'adminToken'],
    'GET /sitemap.xml' => ['/sitemap.xml', null],
]);

test('query count does not grow with the data, and nothing lazy loads', function (string $path, ?string $tokenKey) {
    $ctx = qap_context();

    $run = function () use ($ctx, $path, $tokenKey) {
        $url = str_replace(
            ['{product}', '{garment}'],
            [Product::latest('id')->value('id'), CustomizerProduct::latest('id')->value('slug')],
            $path
        );

        return qap_measure(function () use ($url, $ctx, $tokenKey) {
            $test = test();
            if ($tokenKey) {
                $test = $test->withToken($ctx[$tokenKey]);
            }

            return str_starts_with($url, '/api') ? $test->getJson($url) : $test->get($url);
        });
    };

    qap_seed($ctx, 5);
    [$status5, $q5, $lazy5, $bytes5] = $run();

    qap_seed($ctx, 25);
    [$status30, $q30, $lazy30, $bytes30] = $run();

    $lazy = array_values(array_unique(array_merge($lazy5, $lazy30)));
    qap_record("GET {$path}", ['status' => [$status5, $status30], 'queries_n5' => $q5, 'queries_n30' => $q30, 'bytes_n5' => $bytes5, 'bytes_n30' => $bytes30, 'lazy_loads' => $lazy]);

    expect($status5)->toBe(200)->and($status30)->toBe(200);
    expect($lazy)->toBe([]);
    // Allow a little slack for paginators and counts; growth beyond that is per-row querying.
    expect($q30 - $q5)->toBeLessThanOrEqual(2);
})->with('heavy endpoints');
