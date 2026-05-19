<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inspera\Chatbot\Classes\SourceContextRepository;
use Inspera\Chatbot\Models\Settings;
use PluginTestCase;

class SourceContextRepositoryTest extends PluginTestCase
{
    private SourceContextRepository $repository;

    public function setUp(): void
    {
        parent::setUp();

        $this->repository = new SourceContextRepository();
    }

    public function testBuildContextReturnsEmptyWhenLimitIsZero(): void
    {
        Settings::set([
            'source_context_limit' => 0,
            'data_sources' => [
                [
                    'type' => 'static',
                    'title' => 'Atölye',
                    'content' => 'Atölye programları',
                    'is_enabled' => true,
                ],
            ],
        ]);

        $this->assertSame('', $this->repository->buildContext('atölye'));
    }

    public function testBuildContextIncludesMatchingStaticSource(): void
    {
        Settings::set([
            'source_context_limit' => 4,
            'data_sources' => [
                [
                    'type' => 'static',
                    'title' => 'Atölye bilgisi',
                    'content' => 'Çocuklar için resim atölyesi her cumartesi düzenlenir.',
                    'is_enabled' => true,
                ],
                [
                    'type' => 'static',
                    'title' => 'Alakasız',
                    'content' => 'xyz qwerty unrelated content',
                    'is_enabled' => true,
                ],
            ],
        ]);

        $context = $this->repository->buildContext('cumartesi atölye var mı?');

        $this->assertStringContainsString('SEÇİLİ SİTE VERİSİ', $context);
        $this->assertStringContainsString('Atölye bilgisi', $context);
        $this->assertStringContainsString('resim atölyesi', $context);
        $this->assertStringNotContainsString('Alakasız', $context);
    }

    public function testBuildContextQueriesDatabaseSourceWithFieldMapper(): void
    {
        Schema::create('inspera_chatbot_test_items', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('title');
            $table->text('description');
        });

        DB::table('inspera_chatbot_test_items')->insert([
            [
                'title' => 'Seramik Atölyesi',
                'description' => 'Yetişkinler için seramik ve boyama atölyesi',
            ],
            [
                'title' => 'Konser',
                'description' => 'Caz gecesi etkinliği',
            ],
        ]);

        Settings::set([
            'source_context_limit' => 5,
            'data_sources' => [
                [
                    'type' => 'database_table',
                    'title' => 'Etkinlikler',
                    'field_mapper' => [
                        'table_name' => 'inspera_chatbot_test_items',
                        'search_fields' => ['title', 'description'],
                        'display_fields' => ['title', 'description'],
                        'title_field' => 'title',
                    ],
                    'is_enabled' => true,
                ],
            ],
        ]);

        $context = $this->repository->buildContext('seramik atölyesi ne zaman?');

        $this->assertStringContainsString('Seramik Atölyesi', $context);
        $this->assertStringNotContainsString('Konser', $context);

        Schema::dropIfExists('inspera_chatbot_test_items');
    }
}
