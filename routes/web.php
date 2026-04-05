<?php

use Illuminate\Support\Facades\Route;

// Serve the SPA for all routes
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
