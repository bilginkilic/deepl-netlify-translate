<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inspera\Chatbot\Models\ActionLog;
use Throwable;

class ActionRunner
{
    /**
     * @param list<array{role: string, content: string}> $messages
     * @return array{message: string, action_code: string, success: bool}|null
     */
    public function runIfMatched(string $message, array $messages): ?array
    {
        if (! ChatbotSettings::bool('run_actions_from_chat', true)) {
            return null;
        }

        foreach (ChatbotSettings::rows('actions') as $action) {
            if (! ChatbotSettings::rowEnabled($action)) {
                continue;
            }

            $matchedKeyword = $this->matchedKeyword($message, $action);
            if ($matchedKeyword === null) {
                continue;
            }

            $hookUrl = trim((string) ($action['hook_url'] ?? ''));
            if ($hookUrl === '') {
                return null;
            }

            return $this->callHook($action, $matchedKeyword, $message, $messages);
        }

        return null;
    }

    /** @param array<string, mixed> $action */
    private function matchedKeyword(string $message, array $action): ?string
    {
        $message = mb_strtolower($message);
        foreach ($this->terms($action['trigger_keywords'] ?? []) as $keyword) {
            $keyword = mb_strtolower(trim($keyword));
            if ($keyword !== '' && str_contains($message, $keyword)) {
                return $keyword;
            }
        }

        return null;
    }

    /**
     * @param array<string, mixed> $action
     * @param list<array{role: string, content: string}> $messages
     * @return array{message: string, action_code: string, success: bool}
     */
    private function callHook(array $action, string $matchedKeyword, string $message, array $messages): array
    {
        $code = trim((string) ($action['code'] ?? 'action'));
        $method = strtoupper(trim((string) ($action['method'] ?? 'POST')));
        if (! in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            $method = 'POST';
        }

        $payload = [
            'action_code' => $code,
            'matched_keyword' => $matchedKeyword,
            'message' => $message,
            'conversation' => array_slice($messages, -12),
        ];

        $extraPayload = $this->jsonObject((string) ($action['payload_template'] ?? ''));
        if ($extraPayload !== []) {
            $payload = array_merge($payload, $extraPayload);
        }

        $headers = $this->jsonObject((string) ($action['headers_json'] ?? ''));
        $status = null;
        $responseBody = null;

        try {
            $response = Http::timeout(20)
                ->withHeaders($headers)
                ->send($method, (string) $action['hook_url'], ['json' => $payload]);

            $status = $response->status();
            $responseBody = mb_substr($response->body(), 0, 60000);
            $success = $response->successful();
            $this->log($code, $matchedKeyword, $success, $status, $payload, $responseBody, null);

            return [
                'message' => $success
                    ? $this->message($action, 'success_message', 'İşleminiz başarıyla başlatıldı.')
                    : $this->message($action, 'error_message', 'İşlem başlatılamadı. Lütfen bilgileri kontrol edip tekrar deneyin.'),
                'action_code' => $code,
                'success' => $success,
            ];
        } catch (Throwable $e) {
            Log::warning('inspera.chatbot.action_failed', [
                'action_code' => $code,
                'exception' => $e->getMessage(),
            ]);

            $this->log($code, $matchedKeyword, false, $status, $payload, $responseBody, $e->getMessage());

            return [
                'message' => $this->message($action, 'error_message', 'İşlem sırasında bağlantı hatası oluştu. Lütfen sonra tekrar deneyin.'),
                'action_code' => $code,
                'success' => false,
            ];
        }
    }

    /** @param array<string, mixed> $action */
    private function message(array $action, string $key, string $default): string
    {
        $message = trim((string) ($action[$key] ?? ''));

        return $message !== '' ? $message : $default;
    }

    /** @return array<string, string> */
    private function jsonObject(string $json): array
    {
        $json = trim($json);
        if ($json === '') {
            return [];
        }

        $decoded = json_decode($json, true);
        if (! is_array($decoded)) {
            return [];
        }

        $object = [];
        foreach ($decoded as $key => $value) {
            if (is_string($key) && is_scalar($value)) {
                $object[$key] = (string) $value;
            }
        }

        return $object;
    }

    /** @param mixed $value @return list<string> */
    private function terms($value): array
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map('strval', $value)));
        }

        return array_values(array_filter(array_map('trim', preg_split('/[,;\n]+/', (string) $value) ?: [])));
    }

    /** @param array<string, mixed> $payload */
    private function log(
        string $code,
        string $matchedKeyword,
        bool $success,
        ?int $status,
        array $payload,
        ?string $responseBody,
        ?string $error
    ): void {
        try {
            ActionLog::create([
                'action_code' => $code,
                'matched_keyword' => $matchedKeyword,
                'success' => $success,
                'status_code' => $status,
                'request_payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
                'response_body' => $responseBody,
                'error_message' => $error,
            ]);
        } catch (Throwable $e) {
            Log::warning('inspera.chatbot.action_log_failed', ['exception' => $e->getMessage()]);
        }
    }
}
