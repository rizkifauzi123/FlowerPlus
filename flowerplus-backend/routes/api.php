<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/* ============================
   Invoice Routes
============================ */
Route::get('/invoices',                  [InvoiceController::class, 'index']);
Route::post('/invoices',                 [InvoiceController::class, 'store']);
Route::put('/invoices/{id}',             [InvoiceController::class, 'update']);
Route::delete('/invoices/{id}',          [InvoiceController::class, 'destroy']);
Route::get('/dashboard-summary',         [InvoiceController::class, 'summary']);

// ✅ Static route HARUS di atas dynamic {id}
Route::get('/invoices/preview-number',   [InvoiceController::class, 'previewNumber']);
Route::get('/invoices/{id}',             [InvoiceController::class, 'show']);

/* ============================
   User / Profile Routes
============================ */
Route::get('/users',        [UserController::class, 'index']);
Route::get('/users/{id}',   [UserController::class, 'show']);
Route::put('/users/{id}',   [UserController::class, 'update']);
Route::post('/users/{id}',  [UserController::class, 'update']);

Route::post('/login',       [UserController::class, 'login']);