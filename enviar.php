<?php
/**
 * NEXUS Diamond Team — receptor de formularios
 * Funciona en Hostinger (PHP). Envía cada solicitud por correo.
 *
 * CONFIGURACIÓN: cambia estos dos valores si es necesario.
 *  - $DESTINO:   correo donde quieres recibir los leads.
 *  - $REMITENTE: debe ser un correo de TU dominio creado en Hostinger
 *                (por ejemplo web@nexusdiamondteam.com) para que no caiga en spam.
 */
$DESTINO   = 'info@nexusdiamondteam.com';
$REMITENTE = 'web@nexusdiamondteam.com';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
    exit;
}

// Anti-spam: campo oculto que las personas no llenan
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

function limpio($v) {
    if (is_array($v)) { return implode(', ', array_map('limpio', $v)); }
    $v = trim((string)$v);
    $v = str_replace(["\r", "\n"], ' ', $v);
    return mb_substr(strip_tags($v), 0, 2000);
}

$tipoForm = limpio($_POST['formulario'] ?? 'Contacto');
$nombre   = limpio($_POST['nombre'] ?? '');
$emailInput = $_POST['email'] ?? '';
$email    = is_string($emailInput)
    ? filter_var(trim($emailInput), FILTER_VALIDATE_EMAIL)
    : false;
$telefono = limpio($_POST['telefono'] ?? '');

if ($nombre === '' || $telefono === '' || !$email) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Faltan datos obligatorios']);
    exit;
}

$etiquetas = [
    'nombre' => 'Nombre', 'telefono' => 'Teléfono', 'email' => 'Correo',
    'estado' => 'Estado', 'codigo_postal' => 'Código postal', 'condado' => 'Condado',
    'miembros' => 'Miembros del hogar', 'ingresos' => 'Ingresos anuales aprox.',
    'seguro' => 'Seguro de interés', 'modalidad' => 'Modalidad preferida',
    'dia' => 'Día preferido', 'horario' => 'Horario preferido',
    'experiencia' => 'Experiencia', 'licencia' => 'Licencia', 'comentarios' => 'Comentarios',
];

$cuerpo = "Nueva solicitud desde nexusdiamondteam.com\n";
$cuerpo .= "Formulario: $tipoForm\n";
$cuerpo .= "Fecha: " . date('Y-m-d H:i') . "\n\n";
foreach ($etiquetas as $k => $label) {
    if (isset($_POST[$k]) && $_POST[$k] !== '' && $_POST[$k] !== []) {
        $cuerpo .= "$label: " . limpio($_POST[$k]) . "\n";
    }
}

$asunto = '=?UTF-8?B?' . base64_encode("Nuevo lead ($tipoForm): $nombre") . '?=';
$headers  = "From: NEXUS Diamond Team <$REMITENTE>\r\n";
$headers .= "Reply-To: $nombre <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$enviado = @mail($DESTINO, $asunto, $cuerpo, $headers);

// Copia de respaldo en un archivo protegido (por si el correo falla)
$dir = __DIR__ . '/leads';
if (!is_dir($dir) && !mkdir($dir, 0750, true) && !is_dir($dir)) {
    error_log('No se pudo crear el directorio de respaldo de leads.');
} elseif (is_dir($dir)) {
    $rules = "$dir/.htaccess";
    if (!file_exists($rules) && file_put_contents($rules, "Require all denied\nDeny from all\n") === false) {
        error_log('No se pudo proteger el directorio de respaldo de leads.');
    } else {
        $csv = fopen("$dir/leads.csv", 'ab');
        if ($csv === false) {
            error_log('No se pudo abrir el archivo de respaldo de leads.');
        } elseif (!flock($csv, LOCK_EX)) {
            error_log('No se pudo bloquear el archivo de respaldo de leads.');
            fclose($csv);
        } else {
            $guardado = fputcsv($csv, [
                date('c'),
                $tipoForm,
                $nombre,
                $telefono,
                $email,
                limpio($_POST['seguro'] ?? ''),
                limpio($_POST['comentarios'] ?? ''),
            ], ',', '"', '\\');
            if ($guardado === false) {
                error_log('No se pudo guardar el respaldo de leads.');
            }
            flock($csv, LOCK_UN);
            fclose($csv);
        }
    }
}

if ($enviado) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo enviar el correo']);
}
