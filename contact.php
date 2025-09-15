<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok'=>false, 'error'=>'Method not allowed']); exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!$data) { $data = $_POST; }

$name  = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$type  = trim($data['project_type'] ?? '');
$desc  = trim($data['project_description'] ?? '');

if (!$name || !$email || !$type) {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>'Faltan campos obligatorios.']); exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'error'=>'Email inválido.']); exit;
}

$to = 'info@mailtest.com';
$subject = 'Nuevo proyecto: ' . $type;

$text = "Nombre: $name\nEmail: $email\nProject type: $type\n\n$desc";
$html = '<h2>Nuevo mensaje del formulario</h2>'
      . '<p><strong>Nombre:</strong> '.htmlspecialchars($name).'</p>'
      . '<p><strong>Email:</strong> '.htmlspecialchars($email).'</p>'
      . '<p><strong>Project type:</strong> '.htmlspecialchars($type).'</p>'
      . '<p><strong>Project description:</strong></p>'
      . '<pre style="white-space:pre-wrap;margin:0;">'.htmlspecialchars($desc).'</pre>';

$boundary = md5(uniqid(time()));
$headers  = "From: Website Form <no-reply@" . $_SERVER['HTTP_HOST'] . ">\r\n";
$headers .= "Reply-To: ".sprintf('"%s" <%s>', addslashes($name), $email)."\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"".$boundary."\"\r\n";

$body  = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
$body .= $text . "\r\n";
$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n\r\n";
$body .= $html . "\r\n";
$body .= "--$boundary--";

$ok = @mail($to, '=?UTF-8?B?'.base64_encode($subject).'?=', $body, $headers);

if ($ok) echo json_encode(['ok'=>true]);
else { http_response_code(500); echo json_encode(['ok'=>false, 'error'=>'Error enviando el correo.']); }
