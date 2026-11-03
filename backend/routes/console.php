<?php
use Illuminate\Support\Facades\Artisan;
Artisan::command('gabo:about', function () {
    $this->info('GABO LIVE API backend is installed.');
})->purpose('Show GABO LIVE backend status');
