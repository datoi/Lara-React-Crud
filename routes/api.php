<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

// ─── Public ───────────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::get('/products',         [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::get('/categories',       [CategoryController::class, 'index']);

// ─── Authenticated (Bearer token) ─────────────────────────────────────────────
Route::post('/orders',                          [OrderController::class, 'store']);
Route::get('/tailor/orders',                    [OrderController::class, 'tailorOrders']);
Route::patch('/tailor/orders/{id}/status',      [OrderController::class, 'updateStatus']);

Route::get('/tailor/products',                  [ProductController::class, 'tailorProducts']);
Route::post('/tailor/products',                 [ProductController::class, 'store']);
Route::post('/upload/image',                    [UploadController::class, 'image']);
