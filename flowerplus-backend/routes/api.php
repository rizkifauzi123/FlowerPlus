<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\Auth\ForgotPasswordController;

/* ============================
   Auth
============================ */
Route::post('/login', [UserController::class, 'login']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/reset-password/{token}', function () {
    return view('welcome'); // placeholder saja
})->name('password.reset');
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/reset-password',  [ForgotPasswordController::class, 'resetPassword']);

/* ============================
   Upload
============================ */
Route::post('/upload-image', [UploadController::class, 'store']);

/* ============================
   Image (serve file dari storage)
============================ */
Route::options('/image/{folder}/{filename}', function () {
    return response('', 200)->withHeaders([
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
    ]);
});

Route::get('/image/{folder}/{filename}', function ($folder, $filename) {
    $path = storage_path("app/public/{$folder}/{$filename}");

    if (!file_exists($path) || !is_readable($path)) {
        return response()->json(['error' => 'File not found'], 404)
            ->withHeaders(['Access-Control-Allow-Origin' => '*']);
    }

    $mimeType = mime_content_type($path);
    $content  = file_get_contents($path);

    return response($content, 200, [
        'Content-Type'                 => $mimeType,
        'Content-Length'               => strlen($content),
        'Cache-Control'                => 'public, max-age=86400',
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
    ]);
});

/* ============================
   Invoice
============================ */
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