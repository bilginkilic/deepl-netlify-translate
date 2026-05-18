<?php declare(strict_types=1);

namespace Inspera\Chatbot;

use System\Classes\PluginBase;

class Plugin extends PluginBase
{
    public function pluginDetails(): array
    {
        return [
            'name' => 'Inspera Chatbot',
            'description' => 'Anthropic Claude proxy and Inspera Bodrum chat endpoint.',
            'author' => 'Inspera',
            'icon' => 'icon-comments'
        ];
    }

    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'chatbot.php',
            'inspera.chatbot'
        );
    }
}
