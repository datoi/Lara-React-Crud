<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// The privacy policy's retention periods (§13), kept every night.
Schedule::command('privacy:purge')->dailyAt('03:30')->withoutOverlapping();
