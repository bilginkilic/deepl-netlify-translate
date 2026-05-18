<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Carbon\Carbon;
use Inspera\Chatbot\Models\QuestionCache;

class QuestionCacheRepository
{
    public function findAnswer(string $question): ?string
    {
        $normalized = $this->normalize($question);
        if ($normalized === '') {
            return null;
        }

        /** @var QuestionCache|null $row */
        $row = QuestionCache::query()
            ->where('question_hash', $this->hash($normalized))
            ->where('is_approved', true)
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', Carbon::now());
            })
            ->first();

        if (! $row) {
            return null;
        }

        $row->hit_count = ((int) $row->hit_count) + 1;
        $row->last_used_at = Carbon::now();
        $row->save();

        return (string) $row->answer;
    }

    public function storeAiAnswer(string $question, string $answer): void
    {
        if (! ChatbotSettings::bool('auto_cache_ai_answers', true)) {
            return;
        }

        $normalized = $this->normalize($question);
        $answer = trim($answer);
        if ($normalized === '' || $answer === '') {
            return;
        }

        $expiresAt = null;
        $ttlDays = ChatbotSettings::int('cache_ttl_days', 0);
        if ($ttlDays > 0) {
            $expiresAt = Carbon::now()->addDays($ttlDays);
        }

        QuestionCache::query()->updateOrCreate(
            ['question_hash' => $this->hash($normalized)],
            [
                'question' => trim($question),
                'normalized_question' => $normalized,
                'answer' => $answer,
                'source' => 'ai',
                'is_approved' => ChatbotSettings::bool('auto_approve_cache', true),
                'expires_at' => $expiresAt,
            ]
        );
    }

    public function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = preg_replace('/\s+/u', ' ', $value) ?? $value;

        return $value;
    }

    private function hash(string $normalizedQuestion): string
    {
        return hash('sha256', $normalizedQuestion);
    }
}
