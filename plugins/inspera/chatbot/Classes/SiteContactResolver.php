<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

class SiteContactResolver
{
    public function resolve(string $question): ?string
    {
        $normalized = $this->normalize($question);
        if ($normalized === '') {
            return null;
        }

        if ($this->matchesAny($normalized, [
            'yol tarifi', 'nasil gelirim', 'nasıl gelirim', 'nerede', 'konum', 'adres tarifi',
            'harita', 'maps', 'ulasim', 'ulaşım', 'yol tarif', 'directions',
        ])) {
            return SiteSettingsReader::directionsReply();
        }

        if ($this->matchesAny($normalized, [
            'iletisim', 'iletişim', 'telefon', 'e-posta', 'eposta', 'email', 'whatsapp',
            'adres', 'ulasim bilgisi', 'ulaşım bilgisi', 'calisma saati', 'çalışma saati',
            'acilis', 'açılış', 'kapanis', 'kapanış', 'bize ulas', 'bize ulaş',
        ])) {
            return SiteSettingsReader::contactReply();
        }

        return null;
    }

    /** @param list<string> $terms */
    private function matchesAny(string $question, array $terms): bool
    {
        foreach ($terms as $term) {
            if (str_contains($question, $this->normalize($term))) {
                return true;
            }
        }

        return false;
    }

    private function normalize(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = str_replace(['ı', 'İ'], ['i', 'i'], $value);

        return preg_replace('/\s+/u', ' ', $value) ?? $value;
    }
}
