<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Inspera\Chatbot\Models\Settings;
use Throwable;

class ChatbotSettings
{
    /** @return mixed */
    public static function get(string $key, $default = null)
    {
        try {
            $value = Settings::get($key);
        } catch (Throwable $e) {
            $value = null;
        }

        if (($value === null || $value === '') && $key === 'ai_model') {
            try {
                $legacy = Settings::get('model');
                if ($legacy !== null && $legacy !== '') {
                    return $legacy;
                }
            } catch (Throwable $e) {
                // ignore legacy lookup failures
            }
        }

        if ($value === null || $value === '') {
            return self::configFallback($key, $default);
        }

        return $value;
    }

    public static function string(string $key, string $default = ''): string
    {
        $value = self::get($key, $default);

        return is_scalar($value) ? trim((string) $value) : $default;
    }

    public static function int(string $key, int $default = 0): int
    {
        $value = self::get($key, $default);

        return is_numeric($value) ? (int) $value : $default;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::get($key, $default);
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return ((int) $value) === 1;
        }

        if (is_string($value)) {
            return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
        }

        return $default;
    }

    /** @return list<array<string, mixed>> */
    public static function rows(string $key): array
    {
        $value = self::get($key, []);
        if (! is_array($value)) {
            $value = [];
        }

        $rows = [];
        foreach ($value as $row) {
            if (is_array($row)) {
                $rows[] = $row;
            }
        }

        if ($rows === []) {
            if ($key === 'data_sources') {
                return ChatbotDefaults::dataSources();
            }

            if ($key === 'static_answers') {
                return ChatbotDefaults::staticAnswers();
            }
        }

        return $rows;
    }

    public static function defaultGreeting(): string
    {
        return "Merhaba! Inspera Bodrum'a hoş geldiniz 🎨\n\n"
            . "Size nasıl yardımcı olabilirim?\n\n"
            . "• 🎨 Akademi & Atölyeler\n"
            . "• 🎭 Tiyatro & Etkinlikler  \n"
            . "• 🍽️ Gastronomi & Rezervasyon\n"
            . "• 🛍️ Mağazalar\n"
            . "• 📅 Rezervasyon Yap";
    }

    /** @return list<array{label: string, message: string}> */
    public static function menuItems(): array
    {
        $items = [];
        foreach (self::rows('menu_items') as $row) {
            if (! self::rowEnabled($row)) {
                continue;
            }

            $label = trim((string) ($row['label'] ?? ''));
            $message = trim((string) ($row['message'] ?? $label));
            if ($label === '' || $message === '') {
                continue;
            }

            $items[] = ['label' => $label, 'message' => $message];
        }

        if ($items !== []) {
            return $items;
        }

        $defaults = ChatbotDefaults::menuItems();
        if ($defaults !== []) {
            $items = [];
            foreach ($defaults as $row) {
                $label = trim((string) ($row['label'] ?? ''));
                $message = trim((string) ($row['message'] ?? $label));
                if ($label === '' || $message === '') {
                    continue;
                }

                $items[] = ['label' => $label, 'message' => $message];
            }

            if ($items !== []) {
                return $items;
            }
        }

        return [
            ['label' => 'Atölye bilgisi almak istiyorum', 'message' => 'Atölye bilgisi almak istiyorum'],
            ['label' => 'Tiyatro programı nedir?', 'message' => 'Tiyatro programı nedir?'],
            ['label' => 'Rezervasyon yapmak istiyorum', 'message' => 'Rezervasyon yapmak istiyorum'],
            ['label' => 'Voyn Kitchen menüsü nedir?', 'message' => 'Voyn Kitchen menüsü nedir?'],
        ];
    }

    /** @param array<string, mixed> $row */
    public static function rowEnabled(array $row): bool
    {
        if (! array_key_exists('is_enabled', $row)) {
            return true;
        }

        $value = $row['is_enabled'];
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return ((int) $value) === 1;
        }

        return ! in_array(strtolower((string) $value), ['0', 'false', 'off', 'no'], true);
    }

    /**
     * @return mixed
     */
    private static function configFallback(string $key, $default)
    {
        $map = [
            'anthropic_api_key' => 'inspera.chatbot.anthropic_api_key',
            'ai_model' => 'inspera.chatbot.model',
            'max_tokens' => 'inspera.chatbot.max_tokens',
            'max_client_messages' => 'inspera.chatbot.max_client_messages',
            'max_message_chars' => 'inspera.chatbot.max_message_chars',
        ];

        if (array_key_exists($key, $map)) {
            $value = config($map[$key]);
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        $defaults = [
            'enabled' => true,
            'assistant_name' => 'Inspera Asistan',
            'greeting' => self::defaultGreeting(),
            'ai_model' => 'claude-haiku-4-5',
            'max_tokens' => 400,
            'max_client_messages' => 24,
            'max_message_chars' => 4000,
            'source_context_limit' => 6,
            'auto_cache_ai_answers' => true,
            'auto_approve_cache' => true,
            'cache_ttl_days' => 0,
            'run_actions_from_chat' => true,
            'booking_enabled' => true,
            'booking_title' => 'Kayıt / rezervasyon talebi',
        ];

        return $defaults[$key] ?? $default;
    }
}
