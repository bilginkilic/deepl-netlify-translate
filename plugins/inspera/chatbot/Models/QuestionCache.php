<?php declare(strict_types=1);

namespace Inspera\Chatbot\Models;

use October\Rain\Database\Model;

/**
 * @property int $id
 * @property string $question_hash
 * @property string $question
 * @property string $normalized_question
 * @property string $answer
 * @property string $source
 * @property int $hit_count
 * @property bool $is_approved
 * @property string|null $last_used_at
 * @property string|null $expires_at
 */
class QuestionCache extends Model
{
    public $table = 'inspera_chatbot_question_cache';

    /** @var list<string> */
    protected $fillable = [
        'question_hash',
        'question',
        'normalized_question',
        'answer',
        'source',
        'hit_count',
        'is_approved',
        'last_used_at',
        'expires_at',
    ];

    /** @var array<string, string> */
    protected $casts = [
        'hit_count' => 'integer',
        'is_approved' => 'boolean',
    ];
}
