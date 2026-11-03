<?php
use Illuminate\Support\Facades\Route;
Route::prefix('v1')->group(function (): void {
    Route::get('/health', function () {
        return response()->json(['ok' => true, 'service' => 'gabo-live-api', 'version' => '1']);
    })->name('api.v1.health');
});
