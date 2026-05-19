<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Inspera\Chatbot\Classes\ChatbotSettings;
use Inspera\Chatbot\Models\Settings;
use PluginTestCase;

class ChatbotSettingsTest extends PluginTestCase
{
    public function testRowEnabledDefaultsToTrueWhenMissing(): void
    {
        $this->assertTrue(ChatbotSettings::rowEnabled(['label' => 'Test']));
    }

    public function testRowEnabledHonorsBooleanAndStringValues(): void
    {
        $this->assertFalse(ChatbotSettings::rowEnabled(['is_enabled' => false]));
        $this->assertFalse(ChatbotSettings::rowEnabled(['is_enabled' => '0']));
        $this->assertFalse(ChatbotSettings::rowEnabled(['is_enabled' => 'off']));
        $this->assertTrue(ChatbotSettings::rowEnabled(['is_enabled' => 1]));
        $this->assertTrue(ChatbotSettings::rowEnabled(['is_enabled' => 'yes']));
    }

    public function testBoolIntAndStringHelpersReadStoredSettings(): void
    {
        Settings::set([
            'enabled' => 'yes',
            'max_tokens' => '512',
            'assistant_name' => 'Test Asistan',
        ]);

        $this->assertTrue(ChatbotSettings::bool('enabled'));
        $this->assertSame(512, ChatbotSettings::int('max_tokens'));
        $this->assertSame('Test Asistan', ChatbotSettings::string('assistant_name'));
    }

    public function testMenuItemsFiltersDisabledRowsAndUsesDefaultsWhenEmpty(): void
    {
        Settings::set([
            'menu_items' => [
                ['label' => 'Aktif', 'message' => 'Aktif mesaj', 'is_enabled' => true],
                ['label' => 'Pasif', 'message' => 'Pasif mesaj', 'is_enabled' => false],
                ['label' => '', 'message' => 'Boş etiket', 'is_enabled' => true],
            ],
        ]);

        $items = ChatbotSettings::menuItems();

        $this->assertCount(1, $items);
        $this->assertSame('Aktif', $items[0]['label']);
        $this->assertSame('Aktif mesaj', $items[0]['message']);
    }

    public function testMenuItemsReturnsDefaultsWhenNoValidRows(): void
    {
        Settings::set(['menu_items' => []]);

        $items = ChatbotSettings::menuItems();

        $this->assertNotEmpty($items);
        $this->assertArrayHasKey('label', $items[0]);
        $this->assertArrayHasKey('message', $items[0]);
    }
}
