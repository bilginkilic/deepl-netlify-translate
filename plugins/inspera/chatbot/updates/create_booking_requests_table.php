<?php namespace Inspera\Chatbot\Updates;

use Illuminate\Database\Schema\Blueprint;
use October\Rain\Database\Updates\Migration;
use Schema;

class CreateBookingRequestsTable extends Migration
{
    public function up(): void
    {
        Schema::create('inspera_chatbot_booking_requests', function (Blueprint $table): void {
            $table->increments('id');
            $table->string('request_type', 32);
            $table->string('full_name', 191);
            $table->string('email', 191)->nullable();
            $table->string('phone', 64)->nullable();
            $table->string('preferred_datetime_text', 500)->nullable();
            $table->unsignedSmallInteger('party_size')->nullable();
            $table->text('notes')->nullable();
            $table->longText('conversation_snapshot')->nullable();
            $table->timestamps();

            $table->index(['request_type', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspera_chatbot_booking_requests');
    }
}
