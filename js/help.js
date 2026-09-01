/**
 * Lógica de Ayuda Global - Fluxer
 */

function openHelp() {
    navigator.clipboard.writeText("fluxergestion@gmail.com");
    alert("Si no se abre tu correo automáticamente, hemos copiado 'fluxergestion@gmail.com' a tu portapapeles.");
    window.location.href = "mailto:fluxergestion@gmail.com?subject=Solicitud de Soporte - Fluxer";
}
