<?php declare(strict_types=1);

namespace Inspera\Chatbot\Models;

use October\Rain\Database\Model;

/**
 * @property int $id
 * @property string $action_code
 * @property string|null $matched_keyword
 * @property bool $success
 * @property int|null $status_code
 * @property string|null $request_payload
 * @property string|null $response_body
 * @property string|null $error_message
 */
class ActionLog extends Model
{
    public $table = 'inspera_chatbot_action_logs';

    /** @var list<string> */
    protected $fillable = [
        'action_code',
        'matched_keyword',
        'success',
        'status_code',
        'request_payload',
        'response_body',
        'error_message',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'success' => 'boolean',
        'status_code' => 'integer',
    ];
}
