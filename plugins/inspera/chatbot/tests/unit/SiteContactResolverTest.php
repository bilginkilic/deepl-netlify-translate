<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Illuminate\Support\Facades\DB;
use Inspera\Chatbot\Classes\SiteContactResolver;
use Inspera\Chatbot\Classes\SiteSettingsReader;
use PluginTestCase;

class SiteContactResolverTest extends PluginTestCase
{
    public function testContactReplyUsesSiteSettingsRow(): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['item' => 'swordbros_settings'],
            [
                'value' => json_encode([
                    'address' => 'Test Adres 1',
                    'telephone' => '+90 252 000 0000',
                    'email' => 'test@example.com',
                ], JSON_UNESCAPED_UNICODE),
            ]
        );

        SiteSettingsReader::flushCache();

        $answer = (new SiteContactResolver())->resolve('iletişim bilgileriniz nedir?');

        $this->assertNotNull($answer);
        $this->assertStringContainsString('Test Adres 1', $answer);
        $this->assertStringContainsString('test@example.com', $answer);
    }

    public function testDirectionsReplyIncludesMapUrl(): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['item' => 'swordbros_settings'],
            [
                'value' => json_encode([
                    'address' => 'Bodrum Test',
                    'map_url' => 'https://maps.example.test/inspera',
                ], JSON_UNESCAPED_UNICODE),
            ]
        );

        SiteSettingsReader::flushCache();

        $answer = (new SiteContactResolver())->resolve('nasıl gelirim?');

        $this->assertNotNull($answer);
        $this->assertStringContainsString('Bodrum Test', $answer);
        $this->assertStringContainsString('https://maps.example.test/inspera', $answer);
    }
}
