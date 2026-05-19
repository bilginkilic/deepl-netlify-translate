<?php namespace Inspera\Chatbot\Updates;

use Inspera\Chatbot\Classes\ChatbotDefaults;
use October\Rain\Database\Updates\Migration;

class SeedTurkuazDefaults extends Migration
{
    public function up(): void
    {
        ChatbotDefaults::seed(true);
    }

    public function down(): void
    {
        // Ayarları silmeyiz; yalnızca ileri migration.
    }
}
