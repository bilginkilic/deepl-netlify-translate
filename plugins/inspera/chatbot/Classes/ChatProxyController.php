<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class ChatProxyController extends Controller
{
    public function proxy(Request $request): JsonResponse
    {
        if (! ChatbotSettings::bool('enabled', true)) {
            return response()->json(
                ['error' => 'Asistan şu anda kapalı.', 'code' => 'disabled'],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        $maxMessages = max(1, ChatbotSettings::int('max_client_messages', 24));
        $maxChars = max(1, ChatbotSettings::int('max_message_chars', 4000));

        $validated = $request->validate(
            [
                'messages' => ['required', 'array', 'min:1', 'max:' . $maxMessages],
                'messages.*.role' => ['required', 'string', 'in:user,assistant'],
                'messages.*.content' => ['required', 'string', 'max:' . $maxChars],
            ],
            [
                'messages.required' => 'Geçerli bir mesaj göndermelisiniz.',
            ]
        );

        /** @var list<array{role: string, content: string}> $messages */
        $messages = $validated['messages'];
        $latestUserMessage = '';
        foreach ($messages as $row) {
            if ($row['content'] === '' || ctype_space($row['content'])) {
                return response()->json(
                    ['error' => 'Boş mesaj gönderilemez.', 'code' => 'validation'],
                    Response::HTTP_UNPROCESSABLE_ENTITY
                );
            }

            if ($row['role'] === 'user') {
                $latestUserMessage = trim((string) $row['content']);
            }
        }

        if ($latestUserMessage === '') {
            return response()->json(
                ['error' => 'En az bir kullanıcı mesajı göndermelisiniz.', 'code' => 'validation'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $contactAnswer = (new SiteContactResolver())->resolve($latestUserMessage);
        if ($contactAnswer !== null) {
            return response()->json([
                'message' => $contactAnswer,
                'source' => 'static',
            ]);
        }

        $staticAnswer = (new StaticAnswerResolver())->resolve($latestUserMessage);
        if ($staticAnswer !== null) {
            return response()->json([
                'message' => $staticAnswer,
                'source' => 'static',
            ]);
        }

        $cache = new QuestionCacheRepository();
        $cachedAnswer = $cache->findAnswer($latestUserMessage);
        if ($cachedAnswer !== null) {
            return response()->json([
                'message' => $cachedAnswer,
                'source' => 'cache',
            ]);
        }

        $actionResult = (new ActionRunner())->runIfMatched($latestUserMessage, $messages);
        if ($actionResult !== null) {
            return response()->json([
                'message' => $actionResult['message'],
                'source' => 'action',
                'action_code' => $actionResult['action_code'],
                'action_success' => $actionResult['success'],
            ]);
        }

        $apiKey = ChatbotSettings::string('anthropic_api_key', '');
        if ($apiKey === '') {
            $apiKey = trim((string) env('ANTHROPIC_API_KEY'));
        }

        if ($apiKey === '') {
            return response()->json(
                ['error' => 'Asistan şu anda kullanılamıyor.', 'code' => 'misconfigured_server'],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        $system = $this->loadSystemPrompt()
            . (new SourceContextRepository())->buildContext($latestUserMessage);
        $model = ChatbotSettings::string('ai_model', 'claude-haiku-4-5');
        $maxTokens = max(1, ChatbotSettings::int('max_tokens', 400));

        $payload = [
            'model' => $model,
            'max_tokens' => $maxTokens,
            'system' => $system,
            'messages' => $messages,
        ];

        try {
            $upstream = Http::timeout(55)
                ->withHeaders([
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'Content-Type' => 'application/json',
                ])
                ->post('https://api.anthropic.com/v1/messages', $payload);
        } catch (Throwable $e) {
            Log::warning('inspera.chatbot: anthropic request failed', ['exception' => $e->getMessage()]);

            return response()->json(
                ['error' => 'Bağlantı kurulamadı. Lütfen biraz sonra tekrar deneyin.', 'code' => 'network'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        if ($upstream->status() === 429) {
            return response()->json(
                [
                    'error' => 'Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.',
                    'code' => 'rate_limited',
                ],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        if ($upstream->failed()) {
            $body = $upstream->json();

            Log::warning('inspera.chatbot: anthropic error', [
                'status' => $upstream->status(),
                'body' => $upstream->body(),
            ]);

            $userMessage = 'Asistan şu anda yanıt oluşturamıyor. Lütfen biraz sonra tekrar deneyin.';
            if (is_array($body) && isset($body['error']['message']) && is_string($body['error']['message'])) {
                Log::notice('inspera.chatbot: anthropic upstream message', ['msg' => $body['error']['message']]);
            }

            return response()->json(['error' => $userMessage, 'code' => 'upstream'], $upstream->status());
        }

        $json = $upstream->json();
        if (!is_array($json)) {
            return response()->json(
                ['error' => 'Geçersiz yanıt alındı. Lütfen tekrar deneyin.', 'code' => 'invalid_response'],
                Response::HTTP_BAD_GATEWAY
            );
        }

        $assistantText = '';
        if (isset($json['content']) && is_array($json['content'])) {
            foreach ($json['content'] as $block) {
                if (is_array($block) && ($block['type'] ?? '') === 'text' && isset($block['text'])) {
                    $assistantText .= (string) $block['text'];
                }
            }
        }

        $cache->storeAiAnswer($latestUserMessage, $assistantText);

        return response()->json([
            'message' => $assistantText,
            'source' => 'ai',
        ]);
    }

    private function loadSystemPrompt(): string
    {
        $override = ChatbotSettings::string('system_prompt', '');
        if ($override !== '') {
            return $override;
        }

        $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'prompts' . DIRECTORY_SEPARATOR . 'system_prompt.php';

        if (! is_readable($path)) {
            return '';
        }

        $prompt = require $path;

        return is_string($prompt) ? $prompt : '';
    }
}
