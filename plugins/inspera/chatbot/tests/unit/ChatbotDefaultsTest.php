<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Inspera\Chatbot\Classes\ChatbotDefaults;
use Inspera\Chatbot\Classes\DataSourceCatalog;

class ChatbotDefaultsTest extends \PHPUnit\Framework\TestCase
{
    public function testDefaultsIncludeTurkuazDataSources(): void
    {
        $sources = ChatbotDefaults::dataSources();

        $this->assertNotEmpty($sources);

        $types = array_column($sources, 'type');
        $this->assertContains('site_settings', $types);
        $this->assertContains('database_table', $types);
        $this->assertContains('static', $types);
    }

    public function testDefaultsUseTailorEventAndCourseTables(): void
    {
        $tables = [];
        foreach (ChatbotDefaults::dataSources() as $source) {
            $mapper = DataSourceCatalog::resolveSourceMapping($source);
            if ($mapper['table_name'] !== '') {
                $tables[] = $mapper['table_name'];
            }
        }

        $this->assertContains('xc_turkuazeventeventc', $tables);
        $this->assertContains('xc_turkuazacademycoursec', $tables);
        $this->assertNotContains('swordbros_event_events', $tables);
    }

    public function testDataSourcesNeedUpgradeDetectsLegacyTable(): void
    {
        $needsUpgrade = ChatbotDefaults::dataSourcesNeedUpgrade([
            'data_sources' => [
                [
                    'type' => 'database_table',
                    'field_mapper' => ['table_name' => 'swordbros_event_events'],
                ],
            ],
        ]);

        $this->assertTrue($needsUpgrade);
    }
}
