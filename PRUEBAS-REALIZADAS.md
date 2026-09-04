# Pruebas realizadas

Resultado: correcto.

- Compilación de producción con Vite.
- Validación de las cinco páginas HTML.
- Verificación de enlaces y archivos locales.
- Verificación de que no existen IDs HTML duplicados.
- Verificación de que las 16 imágenes WebP existen y tienen contenido.
- Validación de sintaxis de `core.js` y `Code.gs`.
- Prueba simulada del precio oficial: un precio falso enviado por el navegador se ignora.
- Prueba de creación de pedido `PENDIENTE`.
- Prueba de confirmación y rebaja de inventario.
- Prueba de cancelación y devolución de inventario.
- Prueba de rechazo cuando se solicita más stock del disponible.
- Inspección visual de fotografías optimizadas de camiseta y gorra.

La prueba real contra Google Sheets y WhatsApp debe hacerse después de pegar la URL de Apps Script en `config.js`, porque esa dirección se genera únicamente desde la cuenta de Google propietaria de la hoja.
