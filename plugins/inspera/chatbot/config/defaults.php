<?php declare(strict_types=1);

/**
 * Inspera Bodrum / Turkuaz tema varsayılan chatbot ayarları.
 * Tablo adları Tailor blueprint içerik tablolarına karşılık gelir.
 */
return [
    'source_context_limit' => 6,
    'turkuaz_defaults_version' => 1,

    'menu_items' => [
        [
            'label' => 'Yaklaşan etkinlikler',
            'message' => 'Yaklaşan etkinlikler neler?',
            'is_enabled' => true,
        ],
        [
            'label' => 'Atölye programı',
            'message' => 'Hangi atölyeler var ve kayıt nasıl yapılır?',
            'is_enabled' => true,
        ],
        [
            'label' => 'Hizmetleriniz',
            'message' => 'Inspera Bodrum hangi hizmetleri sunuyor?',
            'is_enabled' => true,
        ],
        [
            'label' => 'Adres ve iletişim',
            'message' => 'Adres ve iletişim bilgileriniz nedir?',
            'is_enabled' => true,
        ],
        [
            'label' => 'Nasıl gelirim?',
            'message' => 'Inspera Bodrum\'a nasıl gelirim?',
            'is_enabled' => true,
        ],
        [
            'label' => 'Rezervasyon',
            'message' => 'Rezervasyon yapmak istiyorum',
            'is_enabled' => true,
        ],
    ],

    'data_sources' => [
        [
            'is_enabled' => true,
            'type' => 'site_settings',
            'title' => 'İletişim ve adres',
            'field_mapper' => [
                'settings_code' => 'swordbros_settings',
                'settings_keys' => [
                    'panel_intro',
                    'address',
                    'email',
                    'telephone',
                    'whatsapp',
                    'map_url',
                    'opening_time',
                    'closing_time',
                ],
            ],
        ],
        [
            'is_enabled' => true,
            'type' => 'static',
            'title' => 'Inspera hizmetleri',
            'content' => <<<'TXT'
Inspera Bodrum; sanat, kültür, gastronomi ve yaratıcılığı bir arada sunan bir yaşam ve deneyim merkezidir.

Sunulan hizmetler:
• Akademi ve atölyeler (resim, seramik, çocuk atölyeleri, yoga vb.)
• Tiyatro, konser ve kültür-sanat etkinlikleri
• Sergi ve kürasyon alanları
• Voyn Kitchen & Bar gastronomi ve restoran rezervasyonu
• Inspera Art Boutique, Style ve Craft mağazaları
• Kayıt, bilet ve rezervasyon taleplerinin sohbet üzerinden alınması

Sorularınızı etkinlik, atölye, hizmet, adres ve iletişim konularında yanıtlarım.
TXT,
        ],
        [
            'is_enabled' => true,
            'type' => 'database_table',
            'title' => 'Etkinlikler',
            'max_results' => 5,
            'upcoming_only' => true,
            'field_mapper' => [
                'table_name' => 'xc_turkuazeventeventc',
                'search_fields' => ['title', 'short', 'description', 'audience', 'tag'],
                'display_fields' => ['title', 'short', 'start', 'end', 'price', 'booking_url'],
                'title_field' => 'title',
            ],
        ],
        [
            'is_enabled' => true,
            'type' => 'database_table',
            'title' => 'Atölyeler ve kurslar',
            'max_results' => 5,
            'upcoming_only' => true,
            'field_mapper' => [
                'table_name' => 'xc_turkuazacademycoursec',
                'search_fields' => ['title', 'description'],
                'display_fields' => ['title', 'description', 'start', 'end', 'max_capacity', 'is_registration_open'],
                'title_field' => 'title',
            ],
        ],
    ],

    'static_answers' => [
        [
            'is_enabled' => true,
            'priority' => 10,
            'trigger' => 'hangi hizmetleri sunuyorsunuz',
            'match_type' => 'keyword',
            'keywords' => 'hizmet, hizmetler, ne sunuyorsunuz, neler var',
            'answer' => <<<'TXT'
Inspera Bodrum'da şu hizmetler var:
🎨 Akademi ve atölyeler
🎭 Tiyatro, konser ve etkinlikler
🖼️ Sergi alanları
🍽️ Voyn Kitchen & Bar
🛍️ Art Boutique, Style ve Craft mağazaları
📅 Kayıt ve rezervasyon desteği

Hangi alanla ilgileniyorsunuz?
TXT,
        ],
        [
            'is_enabled' => true,
            'priority' => 20,
            'trigger' => 'yaklaşan etkinlikler',
            'match_type' => 'contains',
            'keywords' => 'etkinlik programı, bu hafta etkinlik',
            'answer' => 'Yaklaşan etkinlikleri sizin için kontrol ediyorum. Hangi tarih aralığı veya etkinlik türü (tiyatro, konser, atölye vb.) ile ilgileniyorsunuz?',
        ],
    ],
];
