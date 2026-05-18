<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class ChatConfigController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'enabled' => ChatbotSettings::bool('enabled', true),
            'assistant_name' => ChatbotSettings::string('assistant_name', 'Inspera Asistan'),
            'greeting' => ChatbotSettings::string('greeting', ChatbotSettings::defaultGreeting()),
            'menu_items' => ChatbotSettings::menuItems(),
            'booking_enabled' => ChatbotSettings::bool('booking_enabled', true),
            'booking_title' => ChatbotSettings::string('booking_title', 'Kayıt / rezervasyon talebi'),
        ]);
    }
}
