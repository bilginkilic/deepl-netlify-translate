<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Log;
use Inspera\Chatbot\Models\BookingRequest;
use Symfony\Component\HttpFoundation\Response;

class BookingApiController extends Controller
{
    /**
     * Kayıt / rezervasyon talebini kalıcı kayda alır (JSON API).
     */
    public function store(Request $request): JsonResponse
    {
        /** @phpstan-ignore-next-line */
        $validated = $request->validate(
            [
                'request_type' => ['required', 'string', 'in:workshop,theater,restaurant,other'],
                'full_name' => ['required', 'string', 'max:191'],
                'email' => ['nullable', 'string', 'email', 'max:191', 'required_without:phone'],
                'phone' => ['nullable', 'string', 'max:64', 'required_without:email'],
                'preferred_datetime_text' => ['nullable', 'string', 'max:500'],
                'party_size' => ['nullable', 'integer', 'min:1', 'max:500'],
                'notes' => ['nullable', 'string', 'max:5000'],
                'conversation_snapshot' => ['nullable', 'array', 'max:40'],
                'conversation_snapshot.*.role' => ['required_with:conversation_snapshot', 'string', 'in:user,assistant'],
                'conversation_snapshot.*.content' => ['required_with:conversation_snapshot', 'string', 'max:6000'],
            ],
            [
                'full_name.required' => 'Ad soyad gereklidir.',
                'request_type.required' => 'Talep türü seçilmelidir.',
                'email.required_without' => 'E-posta veya telefon girilmelidir.',
                'phone.required_without' => 'Telefon veya e-posta girilmelidir.',
            ]
        );

        $conversationJson = null;
        if (isset($validated['conversation_snapshot']) && is_array($validated['conversation_snapshot'])) {
            $encoded = json_encode($validated['conversation_snapshot'], JSON_UNESCAPED_UNICODE);
            if ($encoded === false) {
                return response()->json(
                    ['message' => 'Sohbet özeti işlenemedi.'],
                    Response::HTTP_UNPROCESSABLE_ENTITY
                );
            }
            $conversationJson = $encoded;
        }

        if ($conversationJson !== null && mb_strlen($conversationJson) > 120000) {
            return response()->json(
                ['message' => 'Sohbet özeti çok uzun. Lütfen tekrar deneyin.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        try {
            $email = isset($validated['email']) ? trim((string) $validated['email']) : '';
            $phone = isset($validated['phone']) ? trim((string) $validated['phone']) : '';

            /** @phpstan-ignore-next-line */
            $pdt = isset($validated['preferred_datetime_text']) ? trim((string) $validated['preferred_datetime_text']) : '';
            $note = isset($validated['notes']) ? trim((string) $validated['notes']) : '';

            /** @phpstan-ignore-next-line */
            $row = BookingRequest::create([
                'request_type' => $validated['request_type'],
                'full_name' => trim((string) $validated['full_name']),
                'email' => $email !== '' ? $email : null,
                'phone' => $phone !== '' ? $phone : null,
                'preferred_datetime_text' => $pdt !== '' ? $pdt : null,
                'party_size' => $validated['party_size'] ?? null,
                'notes' => $note !== '' ? $note : null,
                'conversation_snapshot' => $conversationJson,
            ]);

            /** @phpstan-ignore-next-line */
            return response()->json(
                [
                    'id' => $row->id,
                    'message' => 'Talebiniz kaydedildi. Ekibimiz en kısa sürede sizinle iletişime geçecek.',
                ],
                Response::HTTP_CREATED
            );
        } catch (\Throwable $e) {
            Log::error('inspera.booking.create_failed', ['e' => $e->getMessage()]);

            return response()->json(
                ['message' => 'Sunucuda bir hata oluştu. Lütfen sonra tekrar deneyin.'],
                Response::HTTP_INTERNAL_SERVER_ERROR
            );
        }
    }

    /** Basit doğrulama (sağlık kontrolü, auth yok — sadece aynı origin / CSRF). */
    public function ping(): JsonResponse
    {
        return response()->json(['ok' => true, 'service' => 'inspera-chatbot-bookings']);
    }
}
