<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

class StaticAnswerResolver
{
    public function resolve(string $question): ?string
    {
        $question = $this->normalize($question);
        if ($question === '') {
            return null;
        }

        $rows = ChatbotSettings::rows('static_answers');
        usort($rows, static function (array $a, array $b): int {
            return ((int) ($a['priority'] ?? 100)) <=> ((int) ($b['priority'] ?? 100));
        });

        foreach ($rows as $row) {
            if (! ChatbotSettings::rowEnabled($row)) {
                continue;
            }

            $answer = trim((string) ($row['answer'] ?? ''));
            if ($answer === '') {
                continue;
            }

            if ($this->matches($question, $row)) {
                return $answer;
            }
        }

        return null;
    }

    /** @param array<string, mixed> $row */
    private function matches(string $question, array $row): bool
    {
        $matchType = (string) ($row['match_type'] ?? 'contains');
        $terms = [];
        $trigger = $this->normalize((string) ($row['trigger'] ?? ''));
        if ($trigger !== '') {
            $terms[] = $trigger;
        }

        foreach ($this->splitTerms($row['keywords'] ?? []) as $keyword) {
            $normalized = $this->normalize($keyword);
            if ($normalized !== '') {
                $terms[] = $normalized;
            }
        }

        foreach (array_unique($terms) as $term) {
            if ($matchType === 'exact' && $question === $term) {
                return true;
            }

            if ($matchType === 'contains' && str_contains($question, $term)) {
                return true;
            }

            if ($matchType === 'keyword' && $this->keywordMatches($question, $term)) {
                return true;
            }
        }

        return false;
    }

    private function keywordMatches(string $question, string $term): bool
    {
        $words = array_filter(explode(' ', $term), static fn (string $word): bool => mb_strlen($word) > 2);
        if ($words === []) {
            return false;
        }

        foreach ($words as $word) {
            if (! str_contains($question, $word)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @param mixed $value
     * @return list<string>
     */
    private function splitTerms($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('strval', $value)));
        }

        return array_values(array_filter(array_map('trim', preg_split('/[,;\n]+/', (string) $value) ?: [])));
    }

    private function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return $value;
    }
}
