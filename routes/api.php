<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\CustomerOrderController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SupportEmailController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/products',                          [ProductController::class, 'index']);
Route::get('/products/{product}',                [ProductController::class, 'show']);
Route::get('/products/{productId}/reviews',      [ReviewController::class, 'productReviews']);
Route::get('/categories',                        [CategoryController::class, 'index']);
Route::get('/reviews/landing',                   [ReviewController::class, 'landing']);

// ─── Authenticated (Bearer token) ─────────────────────────────────────────────
Route::post('/orders',                         [OrderController::class, 'store']);

// Customer
Route::get('/customer/orders',                 [CustomerOrderController::class, 'index']);

// Notifications
Route::get('/notifications',                   [NotificationController::class, 'index']);
Route::post('/notifications/read-all',         [NotificationController::class, 'markAllRead']);
Route::patch('/notifications/{id}/read',       [NotificationController::class, 'markRead']);
Route::delete('/notifications/{id}',           [NotificationController::class, 'destroy']);
Route::delete('/notifications',                [NotificationController::class, 'destroyAll']);

// Tailor
Route::get('/tailor/orders',                   [OrderController::class, 'tailorOrders']);
Route::patch('/tailor/orders/{id}/status',     [OrderController::class, 'updateStatus']);
Route::get('/tailor/products',                 [ProductController::class, 'tailorProducts']);
Route::post('/tailor/products',                [ProductController::class, 'store']);

// Reviews
Route::post('/reviews',                        [ReviewController::class, 'store']);

// Support
Route::post('/support-email',                  [SupportEmailController::class, 'store']);

// Upload
Route::post('/upload/image',                   [UploadController::class, 'image']);
