<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\UploadController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

/* ============================
   Auth
============================ */
Route::post('/login', [UserController::class, 'login']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

/* ============================
   Upload
============================ */
Route::post('/upload-image', [UploadController::class, 'store']);

/* ============================
   Invoice
============================ */
// Static routes HARUS di atas dynamic {id}
Route::get('/invoices/preview-number',  [InvoiceController::class, 'previewNumber']);
Route::get('/invoices',                 [InvoiceController::class, 'index']);
Route::post('/invoices',                [InvoiceController::class, 'store']);
Route::get('/invoices/{id}',            [InvoiceController::class, 'show']);
Route::put('/invoices/{id}',            [InvoiceController::class, 'update']);
Route::delete('/invoices/{id}',         [InvoiceController::class, 'destroy']);
Route::get('/dashboard-summary',        [InvoiceController::class, 'summary']);

/* ============================
   User
============================ */
Route::get('/users',        [UserController::class, 'index']);
Route::get('/users/{id}',   [UserController::class, 'show']);
Route::put('/users/{id}',   [UserController::class, 'update']);
Route::post('/users/{id}',  [UserController::class, 'update']);