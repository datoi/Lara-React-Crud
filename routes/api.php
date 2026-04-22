<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CustomerOrderController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SupportEmailController;
use App\Http\Controllers\Api\TailorController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::get('/products',                     [ProductController::class, 'index']);
Route::get('/products/{product}',           [ProductController::class, 'show']);
Route::get('/products/{id}/meta',           [ProductController::class, 'meta']);
Route::get('/products/{productId}/reviews', [ReviewController::class, 'productReviews']);
Route::get('/categories',                   [CategoryController::class, 'index']);
Route::get('/tailors',                      [TailorController::class, 'index']);
Route::get('/tailors/{id}',                 [TailorController::class, 'show']);
Route::get('/reviews/landing',              [ReviewController::class, 'landing']);
Route::get('/platform/stats',               [ProductController::class, 'platformStats']);

// ─── Authenticated (Bearer token, 60 req/min) ─────────────────────────────────
Route::middleware(['auth.bearer', 'throttle:60,1'])->group(function () {
    // Orders
    Route::post('/orders', [OrderController::class, 'store']);

    // Customer
    Route::get('/customer/orders', [CustomerOrderController::class, 'index']);

    // Notifications
    Route::get('/notifications',                [NotificationController::class, 'index']);
    Route::post('/notifications/read-all',      [NotificationController::class, 'markAllRead']);
    Route::patch('/notifications/{id}/read',    [NotificationController::class, 'markRead']);
    Route::delete('/notifications/{id}',        [NotificationController::class, 'destroy']);
    Route::delete('/notifications',             [NotificationController::class, 'destroyAll']);

    // Tailor
    Route::get('/tailor/orders',               [OrderController::class, 'tailorOrders']);
    Route::patch('/tailor/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/tailor/profile',            [TailorController::class, 'updateProfile']);
    Route::get('/tailor/stats',                [ProductController::class, 'tailorStats']);
    Route::get('/tailor/products',             [ProductController::class, 'tailorProducts']);
    Route::post('/tailor/products',            [ProductController::class, 'store']);

    // Reviews
    Route::post('/reviews',                                      [ReviewController::class, 'store']);
    Route::get('/customer/orders/{orderId}/review-status',       [ReviewController::class, 'orderReviewStatus']);

    // Support
    Route::post('/support-email', [SupportEmailController::class, 'store']);

    // Upload
    Route::post('/upload/image',         [UploadController::class, 'image']);
    Route::post('/upload/profile-image', [UploadController::class, 'profileImage']);
});
