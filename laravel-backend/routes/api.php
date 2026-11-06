<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SettingsController;

// Public Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected Restaurant Management & Analytics Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('reservations', ReservationController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('menu', MenuController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('inventory', InventoryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('customers', CustomerController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store', 'destroy']);

    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
});
