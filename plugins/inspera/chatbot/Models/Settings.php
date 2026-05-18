<?php declare(strict_types=1);

namespace Inspera\Chatbot\Models;

use October\Rain\Database\Model;

class Settings extends Model
{
    /** @var array<int, string> */
    public $implement = ['System.Behaviors.SettingsModel'];

    public $settingsCode = 'inspera_chatbot_settings';

    public $settingsFields = '$/inspera/chatbot/models/settings/fields.yaml';
}
