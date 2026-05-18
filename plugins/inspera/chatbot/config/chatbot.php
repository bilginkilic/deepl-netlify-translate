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

    /*
    |--------------------------------------------------------------------------
    | Model (cost vs quality)
    |--------------------------------------------------------------------------
    |
    | Default uses Claude Haiku (lower cost). Override with e.g. INSPERA_CHATBOT_MODEL=claude-sonnet-4-6 for higher quality.
    | Pinned alternative: claude-haiku-4-5-20251001
    |
    */

    'model' => env('INSPERA_CHATBOT_MODEL', 'claude-haiku-4-5'),

    'max_tokens' => (int) env('INSPERA_CHATBOT_MAX_TOKENS', 400),

    /*
    | Client messages cap (array length guard before Anthropic round-trip).
    */

    'max_client_messages' => (int) env('INSPERA_CHATBOT_MAX_MESSAGES', 24),

    /*
    | Per-message content guard (characters, rough abuse/cost brake).
    */

    'max_message_chars' => (int) env('INSPERA_CHATBOT_MAX_MESSAGE_CHARS', 4000),
];
