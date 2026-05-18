<?php declare(strict_types=1);

namespace Inspera\Chatbot\Models;

use October\Rain\Database\Model;

/**
 * @property int $id
 * @property string $request_type
 * @property string $full_name
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $preferred_datetime_text
 * @property int|null $party_size
 * @property string|null $notes
 * @property string|null $conversation_snapshot
 */
class BookingRequest extends Model
{
    public $table = 'inspera_chatbot_booking_requests';

    /** @var list<string> */
    protected $fillable = [
        'request_type',
        'full_name',
        'email',
        'phone',
        'preferred_datetime_text',
        'party_size',
        'notes',
        'conversation_snapshot',
    ];
}
