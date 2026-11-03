<?php
use Illuminate\Support\Facades\Route;
Route::get('/', function () {
    return response()->json(['service' => 'gabo-live-api', 'message' => 'The GABO LIVE website is served separately from the API.']);
});
