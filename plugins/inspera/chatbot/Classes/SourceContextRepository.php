<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Cms\Classes\Page;
use Cms\Classes\Theme;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

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
    private function staticSnippet(string $question, array $source): ?array
    {
        $content = trim((string) ($source['content'] ?? ''));
        if ($content === '') {
            return null;
        }

        $title = trim((string) ($source['title'] ?? 'Statik kaynak'));
        $haystack = $title . ' ' . $content . ' ' . implode(' ', $this->terms($source['keywords'] ?? []));

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

        $snippets = [];
        foreach ($pages as $page) {
            $title = (string) ($page->title ?? $page->fileName ?? 'CMS sayfası');
            $content = $this->compact((string) ($page->markup ?? ''));
            $url = (string) ($page->url ?? '');
            $score = $this->score($question, $title . ' ' . $url . ' ' . $content . ' ' . implode(' ', $this->terms($source['keywords'] ?? [])));
            if ($score <= 0) {
                continue;
            }

            $snippets[] = [
                'title' => 'CMS: ' . $title,
                'content' => $content,
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
        $table = trim((string) ($source['table_name'] ?? ''));
        if (! preg_match('/^[A-Za-z0-9_]+$/', $table) || ! Schema::hasTable($table)) {
            return [];
        }

        $columns = array_values(array_filter(array_map('trim', explode(',', (string) ($source['columns'] ?? '')))));
        $columns = array_values(array_filter($columns, static function (string $column) use ($table): bool {
            return preg_match('/^[A-Za-z0-9_]+$/', $column) === 1 && Schema::hasColumn($table, $column);
        }));

        if ($columns === []) {
            return [];
        }

        $tokens = $this->queryTokens($question);
        if ($tokens === []) {
            return [];
        }

        $maxResults = max(1, min(10, (int) ($source['max_results'] ?? 3)));

        try {
            $rows = DB::table($table)
                ->select($columns)
                ->where(function ($query) use ($columns, $tokens): void {
                    foreach ($columns as $column) {
                        foreach ($tokens as $token) {
                            $query->orWhere($column, 'like', '%' . $token . '%');
                        }
                    }
                })
                ->limit($maxResults)
                ->get();
        } catch (Throwable $e) {
            return [];
        }

        $snippets = [];
        foreach ($rows as $row) {
            $values = [];
            foreach ($columns as $column) {
                $value = $row->{$column} ?? null;
                if ($value !== null && trim((string) $value) !== '') {
                    $values[] = $column . ': ' . trim((string) $value);
                }
            }

            $content = implode('; ', $values);
            $title = trim((string) ($source['title'] ?? $table));
            $snippets[] = [
                'title' => 'Tablo ' . $title,
                'content' => $content,
                'score' => $this->score($question, $content . ' ' . implode(' ', $this->terms($source['keywords'] ?? []))),
            ];
        }

        return $snippets;
    }

    /** @param mixed $value @return list<string> */
    private function terms($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('strval', $value)));
        }

        return array_values(array_filter(array_map('trim', preg_split('/[,;\n]+/', (string) $value) ?: [])));
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
