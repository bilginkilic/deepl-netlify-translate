<?php declare(strict_types=1);

namespace Inspera\Chatbot\Tests\Unit;

use Inspera\Chatbot\Classes\DataSourceCatalog;
use PHPUnit\Framework\TestCase;

class DataSourceCatalogTest extends TestCase
{
    public function testIsSafeIdentifierAcceptsValidNames(): void
    {
        $this->assertTrue(DataSourceCatalog::isSafeIdentifier('users'));
        $this->assertTrue(DataSourceCatalog::isSafeIdentifier('inspera_chatbot_test_1'));
    }

    public function testIsSafeIdentifierRejectsUnsafeNames(): void
    {
        $this->assertFalse(DataSourceCatalog::isSafeIdentifier('users;drop'));
        $this->assertFalse(DataSourceCatalog::isSafeIdentifier('db.users'));
        $this->assertFalse(DataSourceCatalog::isSafeIdentifier(''));
    }

    public function testNormalizeMapperFromJsonString(): void
    {
        $json = json_encode([
            'table_name' => 'events',
            'search_fields' => ['title', 'body'],
            'display_fields' => ['title'],
            'title_field' => 'title',
            'pages' => ['home.htm'],
        ], JSON_THROW_ON_ERROR);

        $mapper = DataSourceCatalog::normalizeMapper($json);

        $this->assertSame('events', $mapper['table_name']);
        $this->assertSame(['title', 'body'], $mapper['search_fields']);
        $this->assertSame(['title'], $mapper['display_fields']);
        $this->assertSame('title', $mapper['title_field']);
        $this->assertSame(['home.htm'], $mapper['pages']);
    }

    public function testNormalizeMapperFromInvalidValueReturnsEmptyShape(): void
    {
        $mapper = DataSourceCatalog::normalizeMapper(null);

        $this->assertSame([
            'table_name' => '',
            'search_fields' => [],
            'display_fields' => [],
            'title_field' => '',
            'pages' => [],
            'settings_code' => 'swordbros_settings',
            'settings_keys' => [],
        ], $mapper);
    }

    public function testResolveSourceMappingUsesLegacyColumns(): void
    {
        $mapper = DataSourceCatalog::resolveSourceMapping([
            'table_name' => 'articles',
            'columns' => 'title, summary',
        ]);

        $this->assertSame('articles', $mapper['table_name']);
        $this->assertSame(['title', 'summary'], $mapper['search_fields']);
        $this->assertSame(['title', 'summary'], $mapper['display_fields']);
        $this->assertSame('title', $mapper['title_field']);
    }

    public function testResolveSourceMappingPrefersFieldMapper(): void
    {
        $mapper = DataSourceCatalog::resolveSourceMapping([
            'table_name' => 'legacy_table',
            'columns' => 'legacy_col',
            'field_mapper' => [
                'table_name' => 'courses',
                'search_fields' => ['name'],
                'display_fields' => ['name', 'description'],
                'title_field' => 'name',
            ],
        ]);

        $this->assertSame('courses', $mapper['table_name']);
        $this->assertSame(['name'], $mapper['search_fields']);
        $this->assertSame(['name', 'description'], $mapper['display_fields']);
        $this->assertSame('name', $mapper['title_field']);
    }

    public function testStringListParsesDelimitedString(): void
    {
        $this->assertSame(['a', 'b', 'c'], DataSourceCatalog::stringList("a, b;\nc"));
        $this->assertSame(['x'], DataSourceCatalog::stringList(['x', '']));
        $this->assertSame([], DataSourceCatalog::stringList('   '));
    }

    public function testCmsFieldCatalogContainsExpectedKeys(): void
    {
        $catalog = DataSourceCatalog::cmsFieldCatalog();

        $this->assertArrayHasKey('title', $catalog);
        $this->assertArrayHasKey('markup', $catalog);
        $this->assertArrayHasKey('meta_description', $catalog);
    }
}
