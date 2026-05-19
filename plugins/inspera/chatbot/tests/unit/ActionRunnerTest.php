<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Illuminate\Support\Facades\Http;
use Inspera\Chatbot\Classes\ActionRunner;
use Inspera\Chatbot\Models\ActionLog;
use Inspera\Chatbot\Models\Settings;
use PluginTestCase;

class ActionRunnerTest extends PluginTestCase
{
    public function testRunIfMatchedCallsHookAndReturnsSuccessMessage(): void
    {
        Settings::set([
            'run_actions_from_chat' => true,
            'actions' => [
                [
                    'code' => 'booking',
                    'trigger_keywords' => 'rezervasyon, kayıt',
                    'hook_url' => 'https://example.test/hooks/booking',
                    'method' => 'POST',
                    'success_message' => 'Rezervasyon talebiniz alındı.',
                    'error_message' => 'Rezervasyon başarısız.',
                    'is_enabled' => true,
                ],
            ],
        ]);

        Http::fake([
            'example.test/*' => Http::response(['ok' => true], 200),
        ]);

        $runner = new ActionRunner();
        $result = $runner->runIfMatched('Rezervasyon yapmak istiyorum', [
            ['role' => 'user', 'content' => 'Merhaba'],
        ]);

        $this->assertNotNull($result);
        $this->assertTrue($result['success']);
        $this->assertSame('booking', $result['action_code']);
        $this->assertSame('Rezervasyon talebiniz alındı.', $result['message']);
        $this->assertSame(1, ActionLog::query()->count());

        Http::assertSent(function ($request): bool {
            return $request->url() === 'https://example.test/hooks/booking'
                && $request['action_code'] === 'booking'
                && $request['matched_keyword'] === 'rezervasyon';
        });
    }

    public function testRunIfMatchedReturnsNullWhenDisabled(): void
    {
        Settings::set(['run_actions_from_chat' => false]);

        $runner = new ActionRunner();
        $result = $runner->runIfMatched('rezervasyon', []);

        $this->assertNull($result);
    }

    public function testRunIfMatchedReturnsNullWhenKeywordDoesNotMatch(): void
    {
        Settings::set([
            'run_actions_from_chat' => true,
            'actions' => [
                [
                    'code' => 'booking',
                    'trigger_keywords' => 'rezervasyon',
                    'hook_url' => 'https://example.test/hooks/booking',
                    'is_enabled' => true,
                ],
            ],
        ]);

        $runner = new ActionRunner();
        $result = $runner->runIfMatched('sadece bilgi istiyorum', []);

        $this->assertNull($result);
    }
}
