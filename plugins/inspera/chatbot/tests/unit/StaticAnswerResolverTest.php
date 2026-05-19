<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Inspera\Chatbot\Classes\StaticAnswerResolver;
use Inspera\Chatbot\Models\Settings;
use PluginTestCase;

class StaticAnswerResolverTest extends PluginTestCase
{
    private StaticAnswerResolver $resolver;

    public function setUp(): void
    {
        parent::setUp();

        Settings::set([
            'static_answers' => [
                [
                    'trigger' => 'merhaba',
                    'answer' => 'Hoş geldiniz',
                    'match_type' => 'contains',
                    'is_enabled' => true,
                    'priority' => 20,
                ],
                [
                    'trigger' => 'tam eşleşme',
                    'answer' => 'Exact cevap',
                    'match_type' => 'exact',
                    'is_enabled' => true,
                    'priority' => 10,
                ],
                [
                    'trigger' => 'tiyatro program',
                    'answer' => 'Tiyatro programı bilgisi',
                    'match_type' => 'keyword',
                    'is_enabled' => true,
                    'priority' => 30,
                ],
                [
                    'trigger' => 'kapalı',
                    'answer' => 'Görünmemeli',
                    'match_type' => 'contains',
                    'is_enabled' => false,
                ],
            ],
        ]);

        $this->resolver = new StaticAnswerResolver();
    }

    public function testResolveContainsMatch(): void
    {
        $this->assertSame('Hoş geldiniz', $this->resolver->resolve('Merhaba, bilgi alabilir miyim?'));
    }

    public function testResolveExactMatch(): void
    {
        $this->assertSame('Exact cevap', $this->resolver->resolve('tam eşleşme'));
        $this->assertNull($this->resolver->resolve('tam eşleşme fazla kelime'));
    }

    public function testResolveKeywordMatchRequiresAllWords(): void
    {
        $this->assertSame('Tiyatro programı bilgisi', $this->resolver->resolve('Bu hafta tiyatro programı nedir?'));
        $this->assertNull($this->resolver->resolve('sadece tiyatro'));
    }

    public function testResolveSkipsDisabledRows(): void
    {
        $this->assertNull($this->resolver->resolve('kapalı kaynak sorusu'));
    }

    public function testResolveReturnsNullForEmptyQuestion(): void
    {
        $this->assertNull($this->resolver->resolve('   '));
    }
}
