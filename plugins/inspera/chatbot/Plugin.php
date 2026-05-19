<?php declare(strict_types=1);

namespace Inspera\Chatbot;

use Inspera\Chatbot\Components\ChatWidget;
use Inspera\Chatbot\FormWidgets\DataSourceMapper;
use Inspera\Chatbot\Models\Settings;
use System\Classes\PluginBase;

class Plugin extends PluginBase
{
    public function pluginDetails(): array
    {
        return [
            'name' => 'Inspera Chatbot',
            'description' => 'October CMS managed chatbot with Anthropic proxy, data sources, cache, and action hooks.',
            'author' => 'Inspera',
            'icon' => 'icon-comments',
        ];
    }

    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'chatbot.php',
            'inspera.chatbot'
        );
    }

    public function registerComponents(): array
    {
        return [
            ChatWidget::class => 'insperaChatbot',
        ];
    }

    public function registerFormWidgets(): array
    {
        return [
            DataSourceMapper::class => 'datasourcemapper',
        ];
    }

    public function registerMarkupTags(): array
    {
        return [
            'functions' => [
                'csrf_token' => static fn (): ?string => csrf_token(),
            ],
        ];
    }

    public function registerSettings(): array
    {
        return [
            'settings' => [
                'label' => 'Inspera Chatbot',
                'description' => 'AI, kaynak veri, statik cevap, cache ve action ayarları.',
                'category' => 'Inspera',
                'icon' => 'icon-comments',
                'class' => Settings::class,
                'order' => 500,
                'keywords' => 'chatbot ai anthropic claude inspera',
            ],
        ];
    }
}
