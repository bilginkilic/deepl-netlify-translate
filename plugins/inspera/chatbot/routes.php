<?php declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inspera\Chatbot\Classes\BookingApiController;
use Inspera\Chatbot\Classes\ChatConfigController;
use Inspera\Chatbot\Classes\ChatProxyController;

Route::middleware(['web'])->prefix('inspera-chatbot')->group(function (): void {
    Route::get('config', [ChatConfigController::class, 'show'])
        ->middleware('throttle:120,1')
        ->name('inspera.chatbot.config');

    Route::post('message', [ChatProxyController::class, 'proxy'])
        ->middleware('throttle:60,1')
        ->name('inspera.chatbot.message');

    Route::prefix('api')->group(function (): void {
        Route::post('bookings', [BookingApiController::class, 'store'])
            ->middleware('throttle:30,1')
            ->name('inspera.chatbot.api.bookings.store');

        Route::get('bookings/ping', [BookingApiController::class, 'ping'])
            ->middleware('throttle:120,1')
            ->name('inspera.chatbot.api.bookings.ping');
    });
});
