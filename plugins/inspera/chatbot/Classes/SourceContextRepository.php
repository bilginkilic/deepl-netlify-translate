<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Cms\Classes\Page;
use Cms\Classes\Theme;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;
use Carbon\Carbon;

class SourceContextRepository
{
    public function buildContext(string $question): string
    {
        $limit = max(0, ChatbotSettings::int('source_context_limit', 4));
        if ($limit === 0) {
            return '';
        }

        $snippets = [];
        foreach (ChatbotSettings::rows('data_sources') as $source) {
            if (! ChatbotSettings::rowEnabled($source)) {
                continue;
            }

            $type = (string) ($source['type'] ?? 'static');
            if ($type === 'site_settings') {
                $snippet = $this->siteSettingsSnippet($question, $source);
                if ($snippet !== null) {
                    $snippets[] = $snippet;
                }
                continue;
            }

            if ($type === 'cms_pages') {
                $snippets = array_merge($snippets, $this->cmsPageSnippets($question, $source));
                continue;
            }

            if ($type === 'database_table') {
                $snippets = array_merge($snippets, $this->databaseSnippets($question, $source));
                continue;
            }

            $snippet = $this->staticSnippet($question, $source);
            if ($snippet !== null) {
                $snippets[] = $snippet;
            }
        }

        usort($snippets, static function (array $a, array $b): int {
            return ((int) $b['score']) <=> ((int) $a['score']);
        });

        $selected = array_slice(array_filter($snippets, static fn (array $row): bool => ((int) $row['score']) > 0), 0, $limit);
        if ($selected === []) {
            return '';
        }

        $lines = ["\n\n### SEÇİLİ SİTE VERİSİ", 'Aşağıdaki parçaları yalnızca ilgiliyse kullan; emin olmadığın bilgiyi uydurma.'];
        foreach ($selected as $snippet) {
            $title = trim((string) ($snippet['title'] ?? 'Kaynak'));
            $content = trim((string) ($snippet['content'] ?? ''));
            if ($content === '') {
                continue;
            }

            $lines[] = sprintf("- %s: %s", $title, mb_substr($this->compact($content), 0, 1200));
        }

        return implode("\n", $lines);
    }

    /** @param array<string, mixed> $source */
    private function siteSettingsSnippet(string $question, array $source): ?array
    {
        $mapping = DataSourceCatalog::resolveSourceMapping($source);
        $content = SiteSettingsReader::formatBlock(
            $mapping['settings_keys'],
            $mapping['settings_code'] !== '' ? $mapping['settings_code'] : 'swordbros_settings'
        );

        if ($content === '') {
            return null;
        }

        $title = trim((string) ($source['title'] ?? 'Site iletişim bilgileri'));
        $haystack = $title . ' ' . $content . ' adres iletişim telefon email harita yol tarifi';

        return [
            'title' => $title,
            'content' => $content,
            'score' => max(1, $this->score($question, $haystack)),
        ];
    }

    /** @param array<string, mixed> $source */
    private function staticSnippet(string $question, array $source): ?array
    {
        $content = trim((string) ($source['content'] ?? ''));
        if ($content === '') {
            return null;
        }

        $title = trim((string) ($source['title'] ?? 'Statik kaynak'));
        $haystack = $title . ' ' . $content;

        return [
            'title' => $title,
            'content' => $content,
            'score' => $this->score($question, $haystack),
        ];
    }

    /**
     * @param array<string, mixed> $source
     * @return list<array{title: string, content: string, score: int}>
     */
    private function cmsPageSnippets(string $question, array $source): array
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

        $mapping = DataSourceCatalog::resolveSourceMapping($source);
        $selectedPages = $mapping['pages'];
        $searchFields = $mapping['search_fields'] !== []
            ? $mapping['search_fields']
            : ['title', 'url', 'markup', 'meta_description'];
        $displayFields = $mapping['display_fields'] !== []
            ? $mapping['display_fields']
            : $searchFields;
        $titleField = $mapping['title_field'] !== '' ? $mapping['title_field'] : 'title';
        $keywordBoost = implode(' ', $searchFields);

        $snippets = [];
        foreach ($pages as $page) {
            $fileName = (string) ($page->fileName ?? '');
            if ($selectedPages !== [] && ! in_array($fileName, $selectedPages, true)) {
                continue;
            }

            $fieldValues = $this->cmsFieldValues($page);
            $searchHaystack = implode(' ', array_map(
                static fn (string $field): string => (string) ($fieldValues[$field] ?? ''),
                $searchFields
            ));
            $score = $this->score($question, $searchHaystack . ' ' . $keywordBoost);
            if ($score <= 0) {
                continue;
            }

            $displayParts = [];
            foreach ($displayFields as $field) {
                $value = trim((string) ($fieldValues[$field] ?? ''));
                if ($value !== '') {
                    $label = DataSourceCatalog::cmsFieldCatalog()[$field] ?? $field;
                    $displayParts[] = $label . ': ' . $value;
                }
            }

            $pageTitle = trim((string) ($fieldValues[$titleField] ?? $page->title ?? $page->fileName ?? 'CMS sayfası'));
            $snippets[] = [
                'title' => 'CMS: ' . $pageTitle,
                'content' => implode('; ', $displayParts),
                'score' => $score,
            ];
        }

        return $snippets;
    }

    /**
     * @param array<string, mixed> $source
     * @return list<array{title: string, content: string, score: int}>
     */
    private function databaseSnippets(string $question, array $source): array
    {
        $mapping = DataSourceCatalog::resolveSourceMapping($source);
        $table = $mapping['table_name'];
        if (! DataSourceCatalog::isSafeIdentifier($table) || ! Schema::hasTable($table)) {
            return [];
        }

        $searchColumns = array_values(array_filter(
            $mapping['search_fields'],
            static fn (string $column): bool => DataSourceCatalog::isSafeIdentifier($column) && Schema::hasColumn($table, $column)
        ));
        $displayColumns = array_values(array_filter(
            $mapping['display_fields'],
            static fn (string $column): bool => DataSourceCatalog::isSafeIdentifier($column) && Schema::hasColumn($table, $column)
        ));

        if ($searchColumns === []) {
            $searchColumns = $displayColumns;
        }

        if ($displayColumns === []) {
            $displayColumns = $searchColumns;
        }

        if ($searchColumns === []) {
            return [];
        }

        $selectColumns = array_values(array_unique(array_merge($searchColumns, $displayColumns)));
        $tokens = $this->queryTokens($question);
        if ($tokens === []) {
            return [];
        }

        $maxResults = max(1, min(10, (int) ($source['max_results'] ?? 3)));
        $titleField = $mapping['title_field'];
        $keywordBoost = implode(' ', $searchColumns);

        try {
            $query = DB::table($table)
                ->select($selectColumns)
                ->where(function ($query) use ($searchColumns, $tokens): void {
                    foreach ($searchColumns as $column) {
                        foreach ($tokens as $token) {
                            $query->orWhere($column, 'like', '%' . $token . '%');
                        }
                    }
                });

            if (Schema::hasColumn($table, 'is_enabled')) {
                $query->where('is_enabled', 1);
            }

            if (Schema::hasColumn($table, 'deleted_at')) {
                $query->whereNull('deleted_at');
            }

            if (! empty($source['upcoming_only']) && Schema::hasColumn($table, 'start')) {
                $query->where('start', '>=', Carbon::now());
            }

            if (Schema::hasColumn($table, 'start')) {
                $query->orderBy('start');
            }

            $rows = $query
                ->limit($maxResults)
                ->get();
        } catch (Throwable $e) {
            return [];
        }

        $snippets = [];
        foreach ($rows as $row) {
            $values = [];
            foreach ($displayColumns as $column) {
                $value = $row->{$column} ?? null;
                if ($value !== null && trim((string) $value) !== '') {
                    $values[] = $column . ': ' . trim((string) $value);
                }
            }

            $content = implode('; ', $values);
            $recordTitle = trim((string) ($source['title'] ?? $table));
            if ($titleField !== '' && isset($row->{$titleField}) && trim((string) $row->{$titleField}) !== '') {
                $recordTitle = trim((string) $row->{$titleField});
            }

            $snippets[] = [
                'title' => 'Tablo ' . $recordTitle,
                'content' => $content,
                'score' => $this->score($question, $content . ' ' . $keywordBoost),
            ];
        }

        return $snippets;
    }

    /** @return array<string, string> */
    private function cmsFieldValues(Page $page): array
    {
        return [
            'title' => (string) ($page->title ?? ''),
            'url' => (string) ($page->url ?? ''),
            'markup' => $this->compact((string) ($page->markup ?? '')),
            'meta_title' => (string) ($page->meta_title ?? ''),
            'meta_description' => (string) ($page->meta_description ?? ''),
        ];
    }

    /** @return list<string> */
    private function queryTokens(string $question): array
    {
        $normalized = mb_strtolower($question);
        $parts = preg_split('/[^\p{L}\p{N}]+/u', $normalized) ?: [];

        return array_values(array_unique(array_filter($parts, static fn (string $word): bool => mb_strlen($word) >= 3)));
    }

    private function score(string $question, string $haystack): int
    {
        $haystack = mb_strtolower($haystack);
        $score = 0;
        foreach ($this->queryTokens($question) as $token) {
            if (str_contains($haystack, $token)) {
                $score += mb_strlen($token) >= 6 ? 3 : 1;
            }
        }

        return $score;
    }

    private function compact(string $value): string
    {
        $value = strip_tags($value);
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
    }
}
