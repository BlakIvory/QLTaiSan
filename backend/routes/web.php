<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'QLTaiSan API',
        'status' => 'online',
        'version' => '1.0.0',
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'healthy']);
});
