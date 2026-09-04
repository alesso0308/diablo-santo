/**
 * DIABLO SANTO — inventario, pedidos y precios oficiales.
 *
 * Este archivo se pega en Extensiones > Apps Script dentro de una hoja nueva.
 * Ejecute configurarDiabloSanto() una sola vez y siga LEEME-PRIMERO.md.
 */

const DS = Object.freeze({
  timeZone: "America/Costa_Rica",
  sheets: {
    products: "Productos",
    inventory: "Inventario",
    orders: "Pedidos",
    settings: "Configuración",
  },
  orderStatuses: ["PENDIENTE", "CONFIRMADA", "CANCELADA", "SIN_STOCK"],
});

function configurarDiabloSanto() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Abra este script desde la hoja de Google Sheets.");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", spreadsheet.getId());
  spreadsheet.setSpreadsheetTimeZone(DS.timeZone);

  const products = ensureSheet_(spreadsheet, DS.sheets.products, [
    "ID producto",
    "Producto",
    "Precio oficial (CRC)",
    "Activo",
  ]);
  const inventory = ensureSheet_(spreadsheet, DS.sheets.inventory, [
    "SKU",
    "ID producto",
    "Producto",
    "ID variante",
    "Color",
    "Talla",
    "Stock inicial",
    "Stock disponible",
    "Activo",
  ]);
  const orders = ensureSheet_(spreadsheet, DS.sheets.orders, [
    "Pedido",
    "Fecha",
    "Estado",
    "Detalle",
    "Items JSON",
    "Subtotal",
    "Zona de envío",
    "Envío",
    "Total",
    "Inventario descontado",
    "Fecha de confirmación",
    "Observaciones",
  ]);
  const settings = ensureSheet_(spreadsheet, DS.sheets.settings, [
    "Configuración",
    "Valor",
    "Descripción",
  ]);

  seedProducts_(products);
  seedInventory_(inventory);
  seedSettings_(settings);
  formatSheets_(products, inventory, orders, settings);
  applyValidations_(products, inventory, orders);

  spreadsheet.setActiveSheet(inventory);
  spreadsheet.toast(
    "Complete el stock disponible y luego los datos privados en la pestaña Configuración.",
    "Diablo Santo listo",
    8
  );
}

function doGet(event) {
  try {
    const action = String((event && event.parameter && event.parameter.action) || "catalog");
    if (action !== "catalog") return jsonpResponse_({ ok: false, error: "Acción no válida" }, event);
    return jsonpResponse_(buildCatalog_(), event);
  } catch (error) {
    console.error(error);
    return jsonpResponse_({ ok: false, error: "Inventario temporalmente no disponible" }, event);
  }
}

function doPost(event) {
  try {
    if (event && event.parameter && event.parameter.company) {
      return errorPage_("No fue posible procesar el pedido.");
    }

    const rawPayload = String((event && event.parameter && event.parameter.payload) || "");
    if (!rawPayload || rawPayload.length > 10000) {
      throw new Error("El pedido está vacío o es demasiado grande.");
    }

    const payload = JSON.parse(rawPayload);
    const result = createPendingOrder_(payload);
    return whatsappPage_(result.whatsappUrl, result.orderId);
  } catch (error) {
    console.error(error);
    return errorPage_(error && error.message ? error.message : "No fue posible procesar el pedido.");
  }
}

/**
 * Al cambiar un pedido a CONFIRMADA se rebaja el stock.
 * Al cambiar una venta ya descontada a CANCELADA se devuelve el stock.
 */
function onEdit(event) {
  if (!event || !event.range || event.range.getNumRows() !== 1 || event.range.getNumColumns() !== 1) {
    return;
  }

  const sheet = event.range.getSheet();
  if (sheet.getName() !== DS.sheets.orders || event.range.getRow() < 2 || event.range.getColumn() !== 3) {
    return;
  }

  const status = String(event.value || "").trim().toUpperCase();
  if (status !== "CONFIRMADA" && status !== "CANCELADA") return;

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(8000)) {
    (event.source || sheet.getParent()).toast(
      "Intente cambiar el estado nuevamente en unos segundos.",
      "Inventario ocupado",
      6
    );
    return;
  }

  try {
    if (status === "CONFIRMADA") confirmOrder_(sheet, event.range.getRow());
    if (status === "CANCELADA") cancelOrder_(sheet, event.range.getRow());
  } catch (error) {
    sheet.getRange(event.range.getRow(), 3).setValue("SIN_STOCK");
    sheet.getRange(event.range.getRow(), 12).setValue(error.message || "No se pudo actualizar el inventario.");
    (event.source || sheet.getParent()).toast(
      error.message || "No se pudo actualizar el inventario.",
      "Pedido no confirmado",
      8
    );
  } finally {
    lock.releaseLock();
  }
}

function createPendingOrder_(payload) {
  const normalized = validateOrderPayload_(payload);
  const settings = getSettings_();
  validatePrivateSettings_(settings);

  const catalog = buildCatalog_();
  const skuMap = new Map();
  catalog.items.forEach(function (item) {
    skuMap.set(makeSkuKey_(item.productId, item.size, item.variantId), item);
  });

  const requestedBySku = new Map();
  normalized.items.forEach(function (item) {
    const key = makeSkuKey_(item.id, item.size, item.variantId);
    requestedBySku.set(key, (requestedBySku.get(key) || 0) + item.quantity);
  });

  const orderItems = [];
  requestedBySku.forEach(function (quantity, key) {
    const official = skuMap.get(key);
    if (!official) throw new Error("Una talla o color ya no está disponible.");
    if (quantity > official.stock) {
      throw new Error(
        official.stock > 0
          ? "No hay suficientes unidades de " + official.productName + " en esa talla o color."
          : official.productName + " está agotado en esa talla o color."
      );
    }
    orderItems.push({
      sku: official.sku,
      productId: official.productId,
      productName: official.productName,
      variantId: official.variantId,
      variantLabel: official.variantLabel,
      size: official.size,
      price: official.price,
      quantity: quantity,
      lineTotal: official.price * quantity,
    });
  });

  const subtotal = orderItems.reduce(function (sum, item) {
    return sum + item.lineTotal;
  }, 0);
  const shipping = normalized.shippingZone === "fuera"
    ? numberSetting_(settings, "ENVIO_FUERA")
    : numberSetting_(settings, "ENVIO_GAM");
  const total = subtotal + shipping;
  const orderId = newOrderId_();
  const now = new Date();
  const detail = orderItems
    .map(function (item) {
      return [
        item.productName,
        item.variantLabel ? "Color: " + item.variantLabel : "",
        "Talla: " + item.size,
        "Cantidad: " + item.quantity,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");

  const spreadsheet = getSpreadsheet_();
  const orders = spreadsheet.getSheetByName(DS.sheets.orders);
  orders.appendRow([
    orderId,
    now,
    "PENDIENTE",
    detail,
    JSON.stringify(orderItems),
    subtotal,
    normalized.shippingZone === "fuera" ? "Fuera del GAM" : "GAM",
    shipping,
    total,
    "NO",
    "",
    "Pendiente de confirmación por WhatsApp",
  ]);

  const lastRow = orders.getLastRow();
  orders.getRange(lastRow, 2).setNumberFormat("dd/MM/yyyy HH:mm");
  orders.getRange(lastRow, 6, 1, 4).setNumberFormat('₡#,##0');
  orders.getRange(lastRow, 3).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(DS.orderStatuses, true)
      .setAllowInvalid(false)
      .build()
  );

  return {
    orderId: orderId,
    whatsappUrl: buildWhatsAppUrl_(orderId, orderItems, subtotal, shipping, total, settings),
  };
}

function confirmOrder_(ordersSheet, row) {
  const spreadsheet = ordersSheet.getParent();
  const discounted = String(ordersSheet.getRange(row, 10).getValue() || "").toUpperCase();
  if (discounted === "SI") {
    spreadsheet.toast("Ese pedido ya había rebajado el inventario.", "Sin cambios", 5);
    return;
  }

  const items = parseOrderItems_(ordersSheet.getRange(row, 5).getValue());
  adjustInventory_(items, -1, spreadsheet);
  ordersSheet.getRange(row, 10).setValue("SI");
  ordersSheet.getRange(row, 11).setValue(new Date()).setNumberFormat("dd/MM/yyyy HH:mm");
  ordersSheet.getRange(row, 12).setValue("Venta confirmada; inventario rebajado.");
  spreadsheet.toast("El stock se rebajó correctamente.", "Venta confirmada", 6);
}

function cancelOrder_(ordersSheet, row) {
  const spreadsheet = ordersSheet.getParent();
  const discounted = String(ordersSheet.getRange(row, 10).getValue() || "").toUpperCase();
  if (discounted !== "SI") {
    ordersSheet.getRange(row, 12).setValue("Pedido cancelado sin movimiento de inventario.");
    return;
  }

  const items = parseOrderItems_(ordersSheet.getRange(row, 5).getValue());
  adjustInventory_(items, 1, spreadsheet);
  ordersSheet.getRange(row, 10).setValue("RESTAURADO");
  ordersSheet.getRange(row, 12).setValue("Pedido cancelado; inventario devuelto.");
  spreadsheet.toast("El stock regresó al inventario.", "Pedido cancelado", 6);
}

function adjustInventory_(items, direction, spreadsheet) {
  const inventory = spreadsheet.getSheetByName(DS.sheets.inventory);
  const values = getDataRows_(inventory);
  const rowBySku = new Map();

  values.forEach(function (row, index) {
    rowBySku.set(String(row[0]), { rowNumber: index + 2, stock: Number(row[7]) || 0 });
  });

  const changes = [];
  items.forEach(function (item) {
    const record = rowBySku.get(String(item.sku));
    if (!record) throw new Error("No se encontró el SKU " + item.sku + " en Inventario.");
    const nextStock = record.stock + direction * Number(item.quantity);
    if (nextStock < 0) {
      throw new Error("Stock insuficiente para confirmar " + item.productName + ".");
    }
    changes.push({ rowNumber: record.rowNumber, value: nextStock });
    record.stock = nextStock;
  });

  changes.forEach(function (change) {
    inventory.getRange(change.rowNumber, 8).setValue(change.value);
  });
}

function buildCatalog_() {
  const spreadsheet = getSpreadsheet_();
  const productsSheet = spreadsheet.getSheetByName(DS.sheets.products);
  const inventorySheet = spreadsheet.getSheetByName(DS.sheets.inventory);
  if (!productsSheet || !inventorySheet) {
    throw new Error("Ejecute configurarDiabloSanto() antes de publicar.");
  }

  const products = new Map();
  getDataRows_(productsSheet).forEach(function (row) {
    const active = normalizeYes_(row[3]);
    const price = Number(row[2]);
    if (active && row[0] && Number.isFinite(price) && price >= 0) {
      products.set(String(row[0]), {
        productId: String(row[0]),
        productName: String(row[1]),
        price: Math.round(price),
      });
    }
  });

  const items = [];
  getDataRows_(inventorySheet).forEach(function (row) {
    const product = products.get(String(row[1]));
    if (!product || !normalizeYes_(row[8])) return;
    items.push({
      sku: String(row[0]),
      productId: product.productId,
      productName: product.productName,
      variantId: String(row[3] || ""),
      variantLabel: String(row[4] || ""),
      size: String(row[5]),
      price: product.price,
      initialStock: Math.max(0, Math.floor(Number(row[6]) || 0)),
      stock: Math.max(0, Math.floor(Number(row[7]) || 0)),
    });
  });

  const settings = getSettings_();
  return {
    ok: true,
    updatedAt: new Date().toISOString(),
    shipping: {
      gam: numberSetting_(settings, "ENVIO_GAM", 2500),
      fuera: numberSetting_(settings, "ENVIO_FUERA", 3500),
    },
    items: items,
  };
}

function validateOrderPayload_(payload) {
  if (!payload || !Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 12) {
    throw new Error("El carrito no contiene productos válidos.");
  }

  const items = payload.items.map(function (item) {
    const quantity = Number(item.quantity);
    const id = String(item.id || "");
    const size = String(item.size || "");
    const variantId = String(item.variantId || "");
    if (!/^[a-z0-9-]{1,60}$/.test(id) || !/^[A-Za-z0-9 ÁÉÍÓÚáéíóúñÑ-]{1,30}$/.test(size)) {
      throw new Error("El pedido contiene una talla o producto no válido.");
    }
    if (variantId && !/^[a-z0-9-]{1,60}$/.test(variantId)) {
      throw new Error("El pedido contiene un color no válido.");
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 5) {
      throw new Error("La cantidad solicitada no es válida.");
    }
    return { id: id, size: size, variantId: variantId, quantity: quantity };
  });

  return {
    items: items,
    shippingZone: payload.shippingZone === "fuera" ? "fuera" : "gam",
  };
}

function buildWhatsAppUrl_(orderId, items, subtotal, shipping, total, settings) {
  const lines = [
    "🖤 PEDIDO DIABLO SANTO",
    "Pedido: " + orderId,
    "",
    "Hola, quiero hacer este pedido:",
    "",
  ];

  items.forEach(function (item) {
    lines.push(item.productName);
    if (item.variantLabel) lines.push("  Color: " + item.variantLabel);
    lines.push("  Talla: " + item.size);
    lines.push("  Cantidad: " + item.quantity);
    lines.push("  Precio unitario: " + currencyCRC_(item.price));
    lines.push("  Subtotal: " + currencyCRC_(item.lineTotal));
    lines.push("");
  });

  lines.push("Total de productos: " + currencyCRC_(subtotal));
  lines.push("Envío: " + currencyCRC_(shipping));
  lines.push("Total a pagar: " + currencyCRC_(total));
  lines.push("");
  lines.push("Datos del pedido:");
  lines.push("Nombre:");
  lines.push("Teléfono:");
  lines.push("Dirección:");
  lines.push("");
  lines.push("Pago por SINPE Móvil:");
  lines.push(String(settings.SINPE_TELEFONO));
  lines.push("A nombre de " + String(settings.SINPE_NOMBRE));
  lines.push("");
  lines.push("La compra y el stock se confirman directamente por este chat.");

  const whatsapp = String(settings.WHATSAPP_DESTINO).replace(/\D/g, "");
  return "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent(lines.join("\n"));
}

function validatePrivateSettings_(settings) {
  const whatsapp = String(settings.WHATSAPP_DESTINO || "").replace(/\D/g, "");
  const sinpe = String(settings.SINPE_TELEFONO || "").trim();
  const name = String(settings.SINPE_NOMBRE || "").trim();
  if (whatsapp.length < 8 || !sinpe || !name) {
    throw new Error("Falta completar WhatsApp, SINPE o nombre del titular en la pestaña Configuración.");
  }
}

function parseOrderItems_(raw) {
  const items = JSON.parse(String(raw || "[]"));
  if (!Array.isArray(items) || !items.length) throw new Error("El pedido no contiene detalle de inventario.");
  return items;
}

function getSettings_() {
  const sheet = getSpreadsheet_().getSheetByName(DS.sheets.settings);
  if (!sheet) throw new Error("No existe la pestaña Configuración.");
  const settings = {};
  getDataRows_(sheet).forEach(function (row) {
    if (row[0]) settings[String(row[0])] = row[1];
  });
  return settings;
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error("Ejecute configurarDiabloSanto() desde la hoja antes de publicar.");
  return active;
}

function numberSetting_(settings, key, fallback) {
  const value = Number(settings[key]);
  if (Number.isFinite(value) && value >= 0) return Math.round(value);
  if (fallback !== undefined) return fallback;
  throw new Error("La configuración " + key + " no contiene un monto válido.");
}

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return sheet;
}

function seedProducts_(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, 2, 4).setValues([
    ["founder-tee-01", "Good Luck Tee 01", 21900, "SI"],
    ["cap-01", "Angels & Demons", 12900, "SI"],
  ]);
}

function seedInventory_(sheet) {
  if (sheet.getLastRow() > 1) return;
  const rows = [
    ["TEE-S", "founder-tee-01", "Good Luck Tee 01", "", "", "S", 0, "=G2", "SI"],
    ["TEE-M", "founder-tee-01", "Good Luck Tee 01", "", "", "M", 0, "=G3", "SI"],
    ["TEE-L", "founder-tee-01", "Good Luck Tee 01", "", "", "L", 0, "=G4", "SI"],
    ["TEE-XL", "founder-tee-01", "Good Luck Tee 01", "", "", "XL", 0, "=G5", "SI"],
    ["CAP-BROWN-BEIGE", "cap-01", "Angels & Demons", "brown-beige", "Brown / Beige", "Ajustable", 0, "=G6", "SI"],
    ["CAP-BLACK-WHITE", "cap-01", "Angels & Demons", "black-white", "Black / White", "Ajustable", 0, "=G7", "SI"],
    ["CAP-BLACK-RED", "cap-01", "Angels & Demons", "black-red", "Black / Red", "Ajustable", 0, "=G8", "SI"],
    ["CAP-WHITE-BLACK", "cap-01", "Angels & Demons", "white-black", "White / Black", "Ajustable", 0, "=G9", "SI"],
  ];
  sheet.getRange(2, 1, rows.length, 9).setValues(rows);
}

function seedSettings_(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.getRange(2, 1, 5, 3).setValues([
    ["WHATSAPP_DESTINO", "50685838140", "Número que recibe pedidos, con código de país y sin signos."],
    ["SINPE_TELEFONO", "", "Número SINPE que aparecerá únicamente en el mensaje final de WhatsApp."],
    ["SINPE_NOMBRE", "", "Nombre del titular que aparecerá únicamente en el mensaje final de WhatsApp."],
    ["ENVIO_GAM", 2500, "Costo de envío dentro del GAM."],
    ["ENVIO_FUERA", 3500, "Costo de envío fuera del GAM."],
  ]);
}

function formatSheets_(products, inventory, orders, settings) {
  [products, inventory, orders, settings].forEach(function (sheet) {
    const lastColumn = sheet.getLastColumn();
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, lastColumn)
      .setBackground("#5c1828")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.autoResizeColumns(1, lastColumn);
  });

  products.getRange("C2:C").setNumberFormat('₡#,##0');
  inventory.getRange("G2:H").setNumberFormat("0");
  inventory.getRange("G2:H9").setBackground("#fff2cc");
  orders.getRange("B2:B").setNumberFormat("dd/MM/yyyy HH:mm");
  orders.getRange("F2:I").setNumberFormat('₡#,##0');
  settings.getRange("B2:B6").setBackground("#fff2cc");

  products.hideColumns(1);
  inventory.hideColumns(1, 2);
  inventory.hideColumns(4);
  orders.hideColumns(5);
  products.setColumnWidth(2, 220);
  inventory.setColumnWidth(3, 220);
  inventory.setColumnWidth(5, 150);
  orders.setColumnWidth(4, 420);
  orders.setColumnWidth(12, 300);
  settings.setColumnWidth(1, 190);
  settings.setColumnWidth(2, 220);
  settings.setColumnWidth(3, 500);
}

function applyValidations_(products, inventory, orders) {
  const yesNo = SpreadsheetApp.newDataValidation()
    .requireValueInList(["SI", "NO"], true)
    .setAllowInvalid(false)
    .build();
  const nonNegative = SpreadsheetApp.newDataValidation()
    .requireNumberGreaterThanOrEqualTo(0)
    .setAllowInvalid(false)
    .build();
  const statuses = SpreadsheetApp.newDataValidation()
    .requireValueInList(DS.orderStatuses, true)
    .setAllowInvalid(false)
    .build();

  products.getRange("D2:D").setDataValidation(yesNo);
  products.getRange("C2:C").setDataValidation(nonNegative);
  inventory.getRange("G2:H").setDataValidation(nonNegative);
  inventory.getRange("I2:I").setDataValidation(yesNo);
  orders.getRange("C2:C").setDataValidation(statuses);
}

function getDataRows_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function normalizeYes_(value) {
  return ["SI", "SÍ", "TRUE", "1"].indexOf(String(value || "").trim().toUpperCase()) !== -1;
}

function makeSkuKey_(productId, size, variantId) {
  return [String(productId), String(size), String(variantId || "")].join("::");
}

function newOrderId_() {
  const datePart = Utilities.formatDate(new Date(), DS.timeZone, "yyyyMMdd");
  const randomPart = Utilities.getUuid().replace(/-/g, "").slice(0, 6).toUpperCase();
  return "DS-" + datePart + "-" + randomPart;
}

function currencyCRC_(amount) {
  return "₡" + String(Math.round(Number(amount) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function jsonpResponse_(payload, event) {
  const callback = String((event && event.parameter && event.parameter.callback) || "");
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]{0,80}$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(payload) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function whatsappPage_(whatsappUrl, orderId) {
  const safeUrl = escapeHtml_(whatsappUrl);
  const safeOrderId = escapeHtml_(orderId);
  const scriptUrl = JSON.stringify(whatsappUrl);
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><head><base target="_top"><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>Pedido ' + safeOrderId + '</title><style>' +
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;padding:24px;box-sizing:border-box}' +
      'main{max-width:520px;text-align:center}h1{font-family:Georgia,serif;letter-spacing:.12em;font-size:28px}p{line-height:1.6;color:#ddd}' +
      'a{display:inline-block;margin-top:18px;background:#25d366;color:#071b0e;text-decoration:none;padding:15px 24px;font-weight:700;letter-spacing:.06em}' +
      '</style></head><body><main><p>Pedido ' + safeOrderId + '</p><h1>DIABLO SANTO</h1>' +
      '<p>El precio y el inventario fueron validados. Continúa a WhatsApp para enviar el pedido.</p>' +
      '<a id="continue" href="' + safeUrl + '" target="_top">CONTINUAR A WHATSAPP</a>' +
      '</main><script>setTimeout(function(){try{window.top.location.href=' + scriptUrl + ';}catch(e){}},300);</script></body></html>'
  ).setTitle("Pedido " + orderId);
}

function errorPage_(message) {
  const safeMessage = escapeHtml_(message);
  return HtmlService.createHtmlOutput(
    '<!doctype html><html lang="es"><head><base target="_top"><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Revisar pedido</title><style>' +
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;padding:24px;box-sizing:border-box}' +
      'main{max-width:520px;text-align:center}h1{font-family:Georgia,serif;letter-spacing:.1em}p{line-height:1.6;color:#ddd}' +
      'button{margin-top:18px;background:#fff;border:0;padding:14px 22px;font-weight:700;cursor:pointer}' +
      '</style></head><body><main><h1>REVISAR PEDIDO</h1><p>' + safeMessage + '</p>' +
      '<button onclick="history.back()">VOLVER A LA TIENDA</button></main></body></html>'
  ).setTitle("Revisar pedido");
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
