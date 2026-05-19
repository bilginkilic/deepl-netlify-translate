<?php declare(strict_types=1);

namespace Inspera\Chatbot\Classes;

use Illuminate\Support\Facades\DB;
use Throwable;

class SiteSettingsReader
{
    /** @var array<string, array<string, mixed>> */
    private static array $cache = [];

    /** @var array<string, string> */
    public static function keyLabels(): array
    {
        return [
            'panel_intro' => 'Tanıtım',
            'address' => 'Adres',
            'email' => 'E-posta',
            'telephone' => 'Telefon',
            'whatsapp' => 'WhatsApp',
            'map_url' => 'Harita bağlantısı',
            'opening_time' => 'Açılış saati',
            'closing_time' => 'Kapanış saati',
        ];
    }

    public static function get(string $key, string $settingsCode = 'swordbros_settings', string $default = ''): string
    {
        if (class_exists(\Swordbros\Setting\Models\SwordbrosSettingModel::class) && $settingsCode === 'swordbros_settings') {
            try {
                $value = \Swordbros\Setting\Models\SwordbrosSettingModel::swordbros_setting($key);
                if (is_scalar($value) && trim((string) $value) !== '') {
                    return self::clean((string) $value);
                }
            } catch (Throwable $e) {
                // fall through to DB lookup
            }
        }

        $bag = self::readBag($settingsCode);
        $value = $bag[$key] ?? $default;

        return is_scalar($value) ? self::clean((string) $value) : $default;
    }

    /** @param list<string> $keys */
    public static function formatBlock(array $keys, string $settingsCode = 'swordbros_settings'): string
    {
        $labels = self::keyLabels();
        $parts = [];

        foreach ($keys as $key) {
            $value = self::get($key, $settingsCode);
            if ($value === '') {
                continue;
            }

            $label = $labels[$key] ?? $key;
            $parts[] = $label . ': ' . $value;
        }

        return implode("\n", $parts);
    }

    public static function contactReply(): string
    {
        $address = self::get('address');
        $telephone = self::get('telephone');
        $email = self::get('email');
        $whatsapp = self::get('whatsapp');
        $opening = self::get('opening_time');
        $closing = self::get('closing_time');
        $mapUrl = self::get('map_url');

        $lines = ['Inspera Bodrum iletişim bilgileri:'];

        if ($address !== '') {
            $lines[] = '📍 Adres: ' . $address;
        }
        if ($telephone !== '') {
            $lines[] = '📞 Telefon: ' . $telephone;
        }
        if ($email !== '') {
            $lines[] = '✉️ E-posta: ' . $email;
        }
        if ($whatsapp !== '' && $whatsapp !== $telephone) {
            $lines[] = '💬 WhatsApp: ' . $whatsapp;
        }
        if ($opening !== '' || $closing !== '') {
            $lines[] = '🕐 Çalışma saatleri: ' . trim($opening . ' – ' . $closing, ' –');
        }

        return implode("\n", $lines);
    }

    public static function directionsReply(): string
    {
        $address = self::get('address');
        $mapUrl = self::get('map_url');

        $lines = ['Inspera Bodrum\'a yol tarifi:'];

        if ($address !== '') {
            $lines[] = '📍 ' . $address;
        }

        $lines[] = 'Ortakentyahşi, Kemer Sokak üzerinde yer alan Inspera Bodrum kültür ve sanat merkezidir.';
        $lines[] = 'Özel araç veya taksi ile Bodrum yarımadasından Ortakentyahşi yönüne ilerleyebilirsiniz.';

        if ($mapUrl !== '') {
            $lines[] = '🗺️ Google Maps: ' . $mapUrl;
        }

        $lines[] = 'Varış saatinizi veya ulaşım tercihinizi yazarsanız daha net yönlendirme yapabilirim.';

        return implode("\n", $lines);
    }

    private static function clean(string $value): string
    {
        $value = html_entity_decode(strip_tags($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $value = preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);

        return $value;
    }

    /** @internal */
    public static function flushCache(): void
    {
        self::$cache = [];
    }

    /** @return array<string, mixed> */
    private static function readBag(string $settingsCode): array
    {
        if (isset(self::$cache[$settingsCode])) {
            return self::$cache[$settingsCode];
        }

        try {
            $json = DB::table('system_settings')->where('item', $settingsCode)->value('value');
            self::$cache[$settingsCode] = is_string($json) ? (json_decode($json, true) ?: []) : [];
        } catch (Throwable $e) {
            self::$cache[$settingsCode] = [];
        }

        return self::$cache[$settingsCode];
    }
}
