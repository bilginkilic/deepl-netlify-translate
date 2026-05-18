<?php declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Anthropic API Key
    |--------------------------------------------------------------------------
    |
    | Set ANTHROPIC_API_KEY in the October app's .env (never commit secrets).
    |
    */

    'anthropic_api_key' => env('ANTHROPIC_API_KEY'),

    'model' => env('INSPERA_CHATBOT_MODEL', 'claude-sonnet-4-20250514'),

    'max_tokens' => (int) env('INSPERA_CHATBOT_MAX_TOKENS', 500),

    /*
    | Client messages cap (array length guard before Anthropic round-trip).
    */

    'max_client_messages' => (int) env('INSPERA_CHATBOT_MAX_MESSAGES', 40),

    /*
    | Per-message content guard (characters, rough abuse/cost brake).
    */

    'max_message_chars' => (int) env('INSPERA_CHATBOT_MAX_MESSAGE_CHARS', 8000),
];
