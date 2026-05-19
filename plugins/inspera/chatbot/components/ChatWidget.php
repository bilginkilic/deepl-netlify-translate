<?php declare(strict_types=1);

namespace Inspera\Chatbot\Components;

use Cms\Classes\ComponentBase;

class ChatWidget extends ComponentBase
{
    public function componentDetails(): array
    {
        return [
            'name' => 'Inspera Chatbot',
            'description' => 'Inspera Bodrum yapay zeka sohbet widget\'ı.',
        ];
    }

    public function defineProperties(): array
    {
        return [];
    }
}
