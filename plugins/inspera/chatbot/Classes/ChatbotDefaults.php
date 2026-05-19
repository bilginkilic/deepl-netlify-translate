<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Inspera\Chatbot\Models\Settings;
use Throwable;

class ChatbotDefaults
{
    /** @return array<string, mixed> */
    public static function all(): array
    {
        $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'defaults.php';
        $defaults = is_readable($path) ? require $path : [];

        return is_array($defaults) ? $defaults : [];
    }

    /** @return list<array<string, mixed>> */
    public static function dataSources(): array
    {
        $sources = self::all()['data_sources'] ?? [];

        return is_array($sources) ? array_values(array_filter($sources, 'is_array')) : [];
    }

    /** @return list<array<string, mixed>> */
    public static function staticAnswers(): array
    {
        $rows = self::all()['static_answers'] ?? [];

        return is_array($rows) ? array_values(array_filter($rows, 'is_array')) : [];
    }

    /** @return list<array<string, mixed>> */
    public static function menuItems(): array
    {
        $rows = self::all()['menu_items'] ?? [];

        return is_array($rows) ? array_values(array_filter($rows, 'is_array')) : [];
    }

    public static function seed(bool $replaceDataSources = true): void
    {
        try {
            $current = Settings::instance()->value ?? [];
            if (! is_array($current)) {
                $current = [];
            }
        } catch (Throwable $e) {
            $current = [];
        }

        $defaults = self::all();
        $merged = $current;

        $storedVersion = (int) ($current['turkuaz_defaults_version'] ?? 0);
        $targetVersion = (int) ($defaults['turkuaz_defaults_version'] ?? 1);

        if ($replaceDataSources || self::dataSourcesNeedUpgrade($current) || $storedVersion < $targetVersion) {
            $merged['data_sources'] = $defaults['data_sources'] ?? [];
        }

        if (self::menuItemsNeedUpgrade($current)) {
            $merged['menu_items'] = $defaults['menu_items'] ?? [];
        }

        if (self::staticAnswersNeedUpgrade($current)) {
            $merged['static_answers'] = $defaults['static_answers'] ?? [];
        }

        if (! isset($merged['source_context_limit']) || (int) $merged['source_context_limit'] < 6) {
            $merged['source_context_limit'] = (int) ($defaults['source_context_limit'] ?? 6);
        }

        $merged['turkuaz_defaults_version'] = $targetVersion;

        Settings::set($merged);
    }

    /** @param array<string, mixed> $current */
    public static function dataSourcesNeedUpgrade(array $current): bool
    {
        $rows = $current['data_sources'] ?? [];
        if (! is_array($rows) || $rows === []) {
            return true;
        }

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            $mapper = DataSourceCatalog::resolveSourceMapping($row);
            if ($mapper['table_name'] === 'swordbros_event_events') {
                return true;
            }

            if (trim((string) ($row['title'] ?? '')) === '') {
                return true;
            }
        }

        return false;
    }

    /** @param array<string, mixed> $current */
    private static function menuItemsNeedUpgrade(array $current): bool
    {
        $rows = $current['menu_items'] ?? [];
        if (! is_array($rows) || $rows === []) {
            return true;
        }

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            if (trim((string) ($row['label'] ?? '')) !== '') {
                return false;
            }
        }

        return true;
    }

    /** @param array<string, mixed> $current */
    private static function staticAnswersNeedUpgrade(array $current): bool
    {
        $rows = $current['static_answers'] ?? [];
        if (! is_array($rows) || $rows === []) {
            return true;
        }

        foreach ($rows as $row) {
            if (! is_array($row)) {
                continue;
            }

            if (trim((string) ($row['answer'] ?? '')) !== '') {
                return false;
            }
        }

        return true;
    }
}
