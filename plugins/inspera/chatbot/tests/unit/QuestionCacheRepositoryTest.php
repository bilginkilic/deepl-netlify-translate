<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Carbon\Carbon;
use Inspera\Chatbot\Classes\QuestionCacheRepository;
use Inspera\Chatbot\Models\QuestionCache;
use Inspera\Chatbot\Models\Settings;
use PluginTestCase;

class QuestionCacheRepositoryTest extends PluginTestCase
{
    private QuestionCacheRepository $repository;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = new QuestionCacheRepository();
    }

    public function testNormalizeLowercasesAndCollapsesWhitespace(): void
    {
        $this->assertSame('merhaba dünya', $this->repository->normalize("  Merhaba   Dünya  "));
    }

    public function testStoreAndFindApprovedAnswer(): void
    {
        Settings::set([
            'auto_cache_ai_answers' => true,
            'auto_approve_cache' => true,
            'cache_ttl_days' => 0,
        ]);

        $this->repository->storeAiAnswer('Atölye saatleri nedir?', 'Atölyeler 10:00-18:00 arası açıktır.');

        $answer = $this->repository->findAnswer('atölye saatleri nedir?');

        $this->assertSame('Atölyeler 10:00-18:00 arası açıktır.', $answer);

        $row = QuestionCache::query()->first();
        $this->assertNotNull($row);
        $this->assertSame(1, (int) $row->hit_count);
        $this->assertNotNull($row->last_used_at);
    }

    public function testFindAnswerIgnoresExpiredCache(): void
    {
        Settings::set([
            'auto_cache_ai_answers' => true,
            'auto_approve_cache' => true,
        ]);

        QuestionCache::query()->create([
            'question_hash' => hash('sha256', 'eski soru'),
            'question' => 'Eski soru',
            'normalized_question' => 'eski soru',
            'answer' => 'Eski cevap',
            'source' => 'ai',
            'is_approved' => true,
            'expires_at' => Carbon::now()->subMinute(),
        ]);

        $this->assertNull($this->repository->findAnswer('eski soru'));
    }

    public function testStoreAiAnswerSkipsWhenAutoCacheDisabled(): void
    {
        Settings::set(['auto_cache_ai_answers' => false]);

        $this->repository->storeAiAnswer('Soru', 'Cevap');

        $this->assertSame(0, QuestionCache::query()->count());
    }
}
