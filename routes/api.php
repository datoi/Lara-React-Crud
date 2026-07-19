<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerOrderController;
use App\Http\Controllers\Api\CustomizerAdminController;
use App\Http\Controllers\Api\CustomizerProductController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SavedDesignController;
use App\Http\Controllers\Api\SupportEmailController;
use App\Http\Controllers\Api\TailorController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────
Route::post('/register/initiate', [AuthController::class, 'registerInitiate'])->middleware('throttle:10,1');
Route::post('/register/verify-email', [AuthController::class, 'registerVerifyEmail'])->middleware('throttle:20,1');
Route::post('/register/verify-phone', [AuthController::class, 'registerVerifyPhone'])->middleware('throttle:20,1');
Route::post('/register/resend', [AuthController::class, 'registerResend'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/admin/auth', [AuthController::class, 'adminLogin'])->middleware('throttle:admin-login');

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/products/{id}/meta', [ProductController::class, 'meta']);
Route::get('/products/{productId}/reviews', [ReviewController::class, 'productReviews']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/tailors', [TailorController::class, 'index']);
Route::get('/tailors/{id}', [TailorController::class, 'show']);
Route::get('/reviews/landing', [ReviewController::class, 'landing']);
Route::get('/platform/stats', [ProductController::class, 'platformStats']);

// ─── Authenticated reads (60 req/min) ─────────────────────────────────────────
// NOTE: each group needs its own bucket prefix — inline throttles without one
// share a single per-user counter, so read polling starves write endpoints.
Route::middleware(['auth.bearer', 'throttle:60,1,api-reads'])->group(function () {
    // Current user
    Route::get('/me', [AuthController::class, 'me']);

    // Customer
    Route::get('/customer/orders', [CustomerOrderController::class, 'index']);
    Route::get('/customer/orders/{orderId}/review-status', [ReviewController::class, 'orderReviewStatus']);
    Route::get('/customer/orders/{orderId}/requests', [CustomerOrderController::class, 'requests']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications', [NotificationController::class, 'destroyAll']);

    // Tailor reads
    Route::get('/tailor/orders', [OrderController::class, 'tailorOrders']);
    Route::get('/tailor/open-orders', [OrderController::class, 'openOrders']);
    Route::get('/tailor/stats', [ProductController::class, 'tailorStats']);
    Route::get('/tailor/products', [ProductController::class, 'tailorProducts']);

    // Chat reads
    Route::get('/orders/{orderId}/messages', [MessageController::class, 'index']);
    Route::get('/messages/counts', [MessageController::class, 'counts']);
});

// ─── Authenticated writes (10 req/min) ────────────────────────────────────────
Route::middleware(['auth.bearer', 'throttle:10,1,api-writes'])->group(function () {
    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::patch('/tailor/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::post('/tailor/orders/{id}/request', [OrderController::class, 'requestOrder']);
    Route::post('/customer/orders/{orderId}/choose-tailor', [CustomerOrderController::class, 'chooseTailor']);

    // Tailor
    Route::patch('/tailor/profile', [TailorController::class, 'updateProfile']);
    Route::post('/tailor/products', [ProductController::class, 'store']);
    Route::patch('/tailor/products/{id}', [ProductController::class, 'update']);
    Route::patch('/tailor/products/{id}/status', [ProductController::class, 'updateStatus']);
    Route::delete('/tailor/products/{id}', [ProductController::class, 'destroy']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);

    // Support
    Route::post('/support-email', [SupportEmailController::class, 'store']);

    // Upload
    Route::post('/upload/image', [UploadController::class, 'image']);
    Route::post('/upload/profile-image', [UploadController::class, 'profileImage']);
    Route::post('/uploads', [UploadController::class, 'design']);

    // Chat writes
    Route::post('/orders/{orderId}/messages', [MessageController::class, 'store']);
});

// ─── Customizer — Public ──────────────────────────────────────────────────────
Route::prefix('customizer')->group(function () {
    Route::get('/products', [CustomizerProductController::class, 'index']);
    Route::get('/products/{slug}', [CustomizerProductController::class, 'show']);
    Route::post('/preview', [CustomizerProductController::class, 'preview']);
});

// ─── Customizer — Auth-protected ──────────────────────────────────────────────
Route::middleware(['auth.bearer', 'throttle:30,1,api-customizer'])->prefix('customizer')->group(function () {
    Route::get('/designs', [SavedDesignController::class, 'index']);
    Route::post('/designs', [SavedDesignController::class, 'store']);
    Route::get('/designs/{id}', [SavedDesignController::class, 'show']);
    Route::put('/designs/{id}', [SavedDesignController::class, 'update']);
    Route::delete('/designs/{id}', [SavedDesignController::class, 'destroy']);
});

// ─── Admin (bearer + admin role, 30 req/min) ──────────────────────────────────
Route::middleware(['auth.bearer', 'auth.admin', 'throttle:30,1,api-admin'])->prefix('admin')->group(function () {
    Route::get('/orders', [AdminController::class, 'orders']);
    Route::get('/orders/{orderId}/messages', [AdminController::class, 'orderMessages']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::patch('/orders/{id}/assign', [AdminController::class, 'assignTailor']);
    Route::patch('/orders/{id}/deliver', [AdminController::class, 'deliverOrder']);
    Route::patch('/users/{id}/suspend', [AdminController::class, 'suspendUser']);
    Route::get('/tailors/pending', [AdminController::class, 'pendingTailors']);
    Route::post('/tailors/{id}/approve', [AdminController::class, 'approveTailor']);
    Route::post('/tailors/{id}/reject', [AdminController::class, 'rejectTailor']);

    // Customizer admin CRUD
    Route::prefix('customizer')->group(function () {
        // Products
        Route::get('/products', [CustomizerAdminController::class, 'indexProducts']);
        Route::post('/products', [CustomizerAdminController::class, 'storeProduct']);
        Route::put('/products/{id}', [CustomizerAdminController::class, 'updateProduct']);
        Route::delete('/products/{id}', [CustomizerAdminController::class, 'destroyProduct']);
        // Layer categories
        Route::post('/categories', [CustomizerAdminController::class, 'storeCategory']);
        Route::put('/categories/{id}', [CustomizerAdminController::class, 'updateCategory']);
        Route::delete('/categories/{id}', [CustomizerAdminController::class, 'destroyCategory']);
        // Layer options (with image upload — use POST + _method=PUT for multipart)
        Route::post('/options', [CustomizerAdminController::class, 'storeOption']);
        Route::put('/options/{id}', [CustomizerAdminController::class, 'updateOption']);
        Route::delete('/options/{id}', [CustomizerAdminController::class, 'destroyOption']);

        Route::post('/options/{id}/colors', [CustomizerAdminController::class, 'storeOptionColor']);
        Route::put('/options/colors/{colorId}', [CustomizerAdminController::class, 'updateOptionColor']);
        Route::delete('/options/colors/{colorId}', [CustomizerAdminController::class, 'destroyOptionColor']);
        // Fabrics
        Route::get('/fabrics', [CustomizerAdminController::class, 'indexFabrics']);
        Route::post('/fabrics', [CustomizerAdminController::class, 'storeFabric']);
        Route::put('/fabrics/{id}', [CustomizerAdminController::class, 'updateFabric']);
        Route::delete('/fabrics/{id}', [CustomizerAdminController::class, 'destroyFabric']);
    });
});
