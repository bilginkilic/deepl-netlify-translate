<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Cms\Classes\Page;
use Cms\Classes\Theme;
use Illuminate\Support\Facades\Schema;
use Throwable;

class DataSourceCatalog
{
    /** @return array<string, string> */
    public static function listTables(): array
    {
        try {
            $tables = Schema::getConnection()->getSchemaBuilder()->getTableListing(null, false);
        } catch (Throwable $e) {
            return [];
        }

        $prefix = (string) Schema::getConnection()->getTablePrefix();
        $options = [];

        foreach ($tables as $table) {
            $name = is_string($table) ? $table : (string) $table;
            if (str_contains($name, '.')) {
                $parts = explode('.', $name);
                $name = (string) end($parts);
            }

            if ($prefix !== '' && str_starts_with($name, $prefix)) {
                $name = substr($name, strlen($prefix));
            }

            if (! self::isSafeIdentifier($name)) {
                continue;
            }

            $options[$name] = $name;
        }

        asort($options);

        return $options;
    }

    /** @return array<string, string> */
    public static function listColumns(string $table): array
    {
        $table = trim($table);
        if (! self::isSafeIdentifier($table) || ! Schema::hasTable($table)) {
            return [];
        }

        try {
            $columns = Schema::getColumnListing($table);
        } catch (Throwable $e) {
            return [];
        }

        $options = [];
        foreach ($columns as $column) {
            $column = (string) $column;
            if (self::isSafeIdentifier($column)) {
                $options[$column] = $column;
            }
        }

        return $options;
    }

    /** @return array<string, string> fileName => title */
    public static function listCmsPages(): array
    {
        if (! class_exists(Theme::class) || ! class_exists(Page::class)) {
            return [];
        }

        try {
            $theme = Theme::getActiveTheme();
            if (! $theme) {
                return [];
            }

            $pages = Page::listInTheme($theme, true);
        } catch (Throwable $e) {
            return [];
        }

        $options = [];
        foreach ($pages as $page) {
            $file = (string) ($page->fileName ?? '');
            if ($file === '') {
                continue;
            }

            $title = trim((string) ($page->title ?? $file));
            $url = trim((string) ($page->url ?? ''));
            $label = $url !== '' ? sprintf('%s (%s)', $title, $url) : $title;
            $options[$file] = $label;
        }

        asort($options);

        return $options;
    }

    /** @return array<string, string> */
    public static function cmsFieldCatalog(): array
    {
        return [
            'title' => 'Sayfa başlığı',
            'url' => 'URL',
            'markup' => 'Sayfa içeriği (markup)',
            'meta_title' => 'Meta başlık',
            'meta_description' => 'Meta açıklama',
        ];
    }

    public static function isSafeIdentifier(string $value): bool
    {
        return preg_match('/^[A-Za-z0-9_]+$/', $value) === 1;
    }

    /**
     * @param mixed $raw
     * @return array<string, mixed>
     */
    public static function normalizeMapper($raw): array
    {
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            $raw = is_array($decoded) ? $decoded : [];
        }

        if (! is_array($raw)) {
            $raw = [];
        }

        return [
            'table_name' => trim((string) ($raw['table_name'] ?? '')),
            'search_fields' => self::stringList($raw['search_fields'] ?? []),
            'display_fields' => self::stringList($raw['display_fields'] ?? []),
            'title_field' => trim((string) ($raw['title_field'] ?? '')),
            'pages' => self::stringList($raw['pages'] ?? []),
            'settings_code' => trim((string) ($raw['settings_code'] ?? 'swordbros_settings')),
            'settings_keys' => self::stringList($raw['settings_keys'] ?? []),
        ];
    }

    /**
     * @param array<string, mixed> $source
     * @return array<string, mixed>
     */
    public static function resolveSourceMapping(array $source): array
    {
        $mapper = self::normalizeMapper($source['field_mapper'] ?? []);

        if ($mapper['table_name'] === '' && ! empty($source['table_name'])) {
            $mapper['table_name'] = trim((string) $source['table_name']);
        }

        $legacyColumns = self::stringList($source['columns'] ?? '');
        if ($mapper['search_fields'] === [] && $legacyColumns !== []) {
            $mapper['search_fields'] = $legacyColumns;
        }

        if ($mapper['display_fields'] === [] && $mapper['search_fields'] !== []) {
            $mapper['display_fields'] = $mapper['search_fields'];
        }

        if ($mapper['search_fields'] === [] && $mapper['display_fields'] !== []) {
            $mapper['search_fields'] = $mapper['display_fields'];
        }

        if ($mapper['title_field'] === '' && $mapper['display_fields'] !== []) {
            $mapper['title_field'] = $mapper['display_fields'][0];
        }

        if ($mapper['settings_code'] === '') {
            $mapper['settings_code'] = 'swordbros_settings';
        }

        if ($mapper['settings_keys'] === []) {
            $mapper['settings_keys'] = [
                'panel_intro',
                'address',
                'email',
                'telephone',
                'whatsapp',
                'map_url',
                'opening_time',
                'closing_time',
            ];
        }

        return $mapper;
    }

    /** @param mixed $value @return list<string> */
    public static function stringList($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(static fn ($item): string => trim((string) $item), $value)));
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', preg_split('/[,;\n]+/', $value) ?: [])));
    }
}
