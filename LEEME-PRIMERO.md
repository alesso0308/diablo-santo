# DIABLO SANTO — versión final

Esta versión mantiene el funcionamiento actual: el cliente ve las prendas, selecciona talla, color y cantidad, y termina el pedido por WhatsApp. No contiene pasarela de pago ni cobra una comisión por venta.

El control central se lleva en una hoja privada de Google Sheets. Ahí se guardan los precios oficiales, el inventario y los pedidos. El stock solo se rebaja cuando usted cambia el pedido a **CONFIRMADA**.

## Antes de publicar: conectar el inventario

### 1. Crear la hoja privada

1. Abra Google Sheets y cree una hoja en blanco llamada `Control Diablo Santo`.
2. Entre a **Extensiones → Apps Script**.
3. Borre el contenido que aparece en `Code.gs`.
4. Abra el archivo `control-inventario-google-sheets/Code.gs` de esta carpeta, copie todo y péguelo en Apps Script.
5. Guarde el proyecto.
6. En la parte superior, seleccione la función `configurarDiabloSanto` y presione **Ejecutar**.
7. Google pedirá autorización. Autorice el script con la misma cuenta propietaria de la hoja.

La función creará cuatro pestañas:

- `Productos`: nombres y precios oficiales.
- `Inventario`: existencias por talla y color.
- `Pedidos`: solicitudes enviadas por WhatsApp.
- `Configuración`: WhatsApp, SINPE y costos de envío.

### 2. Completar los datos reales

En `Inventario`, escriba las cantidades reales:

- Camiseta: S, M, L y XL.
- Gorras: Brown / Beige, Black / White, Black / Red y White / Black.

`Stock inicial` representa las unidades originales del drop. `Stock disponible` representa lo que queda hoy. Si ya hubo ventas, escriba el valor actual directamente en `Stock disponible`.

Ejemplo: si originalmente existían 15 camisetas y hoy quedan 8, la suma de `Stock inicial` de las cuatro tallas debe ser 15 y la suma de `Stock disponible` debe ser 8.

En `Configuración`:

1. Verifique el número de WhatsApp que recibirá los pedidos.
2. Escriba el número de SINPE.
3. Escriba el nombre del titular del SINPE.
4. Verifique los envíos: GAM ₡2.500 y fuera del GAM ₡3.500.

El número SINPE y el nombre del titular no están en el código público de Vercel. Solo se agregan al mensaje final que genera la hoja privada.

### 3. Publicar el control

1. En Apps Script, presione **Implementar → Nueva implementación**.
2. Seleccione **Aplicación web**.
3. En “Ejecutar como”, seleccione **Yo**.
4. En “Quién tiene acceso”, seleccione **Cualquier persona**.
5. Presione **Implementar** y copie la URL que termina en `/exec`.
6. Abra `config.js` en esta carpeta.
7. Sustituya `PEGAR_AQUI_LA_URL_DE_APPS_SCRIPT` por la URL copiada. No quite las comillas.

El acceso “Cualquier persona” permite que los compradores consulten el stock y creen un pedido. La hoja continúa siendo privada y solo sus editores pueden confirmar ventas o cambiar precios.

## Publicar la página en Vercel

Esta carpeta contiene únicamente la versión Vite que usa Vercel; se retiraron Next.js, `node_modules`, el `dist` antiguo y el historial Git duplicado.

1. Verifique que ya pegó la URL de Apps Script en `config.js`.
2. Reemplace el contenido del proyecto actual por los archivos de esta carpeta, conservando la conexión existente con GitHub/Vercel.
3. Ejecute `npm install` una vez en su computadora.
4. Pruebe con `npm run dev`.
5. Suba los cambios al repositorio. Vercel ejecutará `npm run build` y publicará `dist`.

## Cómo confirmar una venta

1. El cliente finaliza el carrito y envía el mensaje por WhatsApp.
2. En la pestaña `Pedidos` aparecerá un número como `DS-20260904-ABC123` con estado `PENDIENTE`.
3. Revise que el mismo número de pedido esté en el mensaje de WhatsApp.
4. Confirme con el cliente el pago y los datos de entrega.
5. Cambie el estado de la fila a `CONFIRMADA`.
6. En ese momento se rebaja automáticamente la talla o el color vendido.

Si una venta ya confirmada se cancela, cambie el estado a `CANCELADA`; el sistema devolverá las unidades al inventario. No edite manualmente la columna `Inventario descontado`.

## Cómo cambiar un precio

Modifique el precio únicamente en la pestaña `Productos`. Ese valor alimenta la página, registra el pedido y genera el total oficial del mensaje de WhatsApp.

Una persona puede alterar visualmente cualquier página en su propio navegador, pero no puede cambiar el precio guardado en su hoja. Antes de aceptar el pago, confirme que el número de pedido y el total coinciden con la fila de `Pedidos`.

## Prueba final recomendada

Antes de reemplazar el sitio actual:

1. Coloque al menos una unidad de prueba en una talla.
2. Haga un pedido desde la página.
3. Compruebe que aparece como `PENDIENTE` sin rebajar stock.
4. Cámbielo a `CONFIRMADA` y compruebe que se rebaja una unidad.
5. Cámbielo a `CANCELADA` y compruebe que la unidad regresa.
6. Verifique el mensaje de WhatsApp, el SINPE, el nombre, el precio y el envío.

No publique el reemplazo hasta completar esta prueba.
