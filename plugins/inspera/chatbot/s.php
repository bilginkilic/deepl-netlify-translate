<?php

$url = 'https://willowy-sable-701ced.netlify.app/api/translate';
$deeplAuthKey = 'cac094d9-7f39-441b-b3ee-38a19ce7fe01:fx'; // DeepL API key'ini buraya yaz

$data = [
    'text'        => 'Hello world',
    'target_lang' => 'TR',
    'source_lang' => 'EN',
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: DeepL-Auth-Key ' . $deeplAuthKey,
]);

$response   = curl_exec($ch);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$ip         = curl_getinfo($ch, CURLINFO_PRIMARY_IP);
$totalTime  = curl_getinfo($ch, CURLINFO_TOTAL_TIME);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$error      = curl_error($ch);
curl_close($ch);

$headers = substr($response, 0, $headerSize);
$body    = substr($response, $headerSize);

echo "HTTP Status : $httpCode\n";
echo "Bağlanılan IP: $ip\n";
echo "Süre         : {$totalTime}s\n";

if ($error) {
    echo "HATA: $error\n";
}

echo "\n--- HEADERS ---\n$headers\n";
echo "--- BODY ---\n$body\n";
?>