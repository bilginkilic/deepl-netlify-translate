<?php namespace Inspera\Chatbot\Updates;

use Illuminate\Database\Schema\Blueprint;
use October\Rain\Database\Updates\Migration;
use Schema;

class CreateV2ChatbotTables extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('inspera_chatbot_question_cache')) {
            Schema::create('inspera_chatbot_question_cache', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('question_hash', 64)->unique();
                $table->text('question');
                $table->text('normalized_question');
                $table->longText('answer');
                $table->string('source', 32)->default('ai');
                $table->unsignedInteger('hit_count')->default(0);
                $table->boolean('is_approved')->default(true);
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();

                $table->index(['is_approved', 'expires_at']);
                $table->index('last_used_at');
            });
        }

        if (! Schema::hasTable('inspera_chatbot_action_logs')) {
            Schema::create('inspera_chatbot_action_logs', function (Blueprint $table): void {
                $table->increments('id');
                $table->string('action_code', 100);
                $table->string('matched_keyword', 191)->nullable();
                $table->boolean('success')->default(false);
                $table->unsignedSmallInteger('status_code')->nullable();
                $table->longText('request_payload')->nullable();
                $table->mediumText('response_body')->nullable();
                $table->text('error_message')->nullable();
                $table->timestamps();

                $table->index(['action_code', 'success']);
                $table->index('created_at');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inspera_chatbot_action_logs');
        Schema::dropIfExists('inspera_chatbot_question_cache');
    }
}
