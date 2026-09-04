import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

class RangeMock {
  constructor(sheet, row, column, rows = 1, columns = 1) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rows = rows;
    this.columns = columns;
  }

  getValues() {
    return Array.from({ length: this.rows }, (_, rowOffset) =>
      Array.from(
        { length: this.columns },
        (_, columnOffset) => this.sheet.valueAt(this.row + rowOffset, this.column + columnOffset)
      )
    );
  }

  getValue() {
    return this.sheet.valueAt(this.row, this.column);
  }

  setValue(value) {
    this.sheet.setValueAt(this.row, this.column, value);
    return this;
  }

  setValues(values) {
    values.forEach((row, rowOffset) =>
      row.forEach((value, columnOffset) =>
        this.sheet.setValueAt(this.row + rowOffset, this.column + columnOffset, value)
      )
    );
    return this;
  }

  setNumberFormat() { return this; }
  setDataValidation() { return this; }
  getSheet() { return this.sheet; }
  getRow() { return this.row; }
  getColumn() { return this.column; }
  getNumRows() { return this.rows; }
  getNumColumns() { return this.columns; }
}

class SheetMock {
  constructor(name, rows) {
    this.name = name;
    this.rows = rows.map((row) => [...row]);
  }

  getName() { return this.name; }
  getParent() { return this.parent; }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(...this.rows.map((row) => row.length)); }
  getRange(row, column, rows = 1, columns = 1) { return new RangeMock(this, row, column, rows, columns); }
  appendRow(row) { this.rows.push([...row]); }
  valueAt(row, column) { return this.rows[row - 1]?.[column - 1] ?? ""; }
  setValueAt(row, column, value) {
    while (this.rows.length < row) this.rows.push([]);
    while (this.rows[row - 1].length < column) this.rows[row - 1].push("");
    this.rows[row - 1][column - 1] = value;
  }
}

const products = new SheetMock("Productos", [
  ["ID producto", "Producto", "Precio oficial (CRC)", "Activo"],
  ["founder-tee-01", "Good Luck Tee 01", 21900, "SI"],
  ["cap-01", "Angels & Demons", 12900, "SI"],
]);
const inventory = new SheetMock("Inventario", [
  ["SKU", "ID producto", "Producto", "ID variante", "Color", "Talla", "Stock inicial", "Stock disponible", "Activo"],
  ["TEE-S", "founder-tee-01", "Good Luck Tee 01", "", "", "S", 2, 2, "SI"],
  ["CAP-BLACK-RED", "cap-01", "Angels & Demons", "black-red", "Black / Red", "Ajustable", 1, 1, "SI"],
]);
const orders = new SheetMock("Pedidos", [[
  "Pedido", "Fecha", "Estado", "Detalle", "Items JSON", "Subtotal", "Zona de envío", "Envío", "Total",
  "Inventario descontado", "Fecha de confirmación", "Observaciones",
]]);
const settings = new SheetMock("Configuración", [
  ["Configuración", "Valor", "Descripción"],
  ["WHATSAPP_DESTINO", "50680000000", ""],
  ["SINPE_TELEFONO", "8000-0000", ""],
  ["SINPE_NOMBRE", "Titular de prueba", ""],
  ["ENVIO_GAM", 2500, ""],
  ["ENVIO_FUERA", 3500, ""],
]);

const sheets = new Map([products, inventory, orders, settings].map((sheet) => [sheet.name, sheet]));
const spreadsheet = {
  getSheetByName: (name) => sheets.get(name),
  toast: () => {},
};
[...sheets.values()].forEach((sheet) => { sheet.parent = spreadsheet; });
const validation = { requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return {}; } };

const context = vm.createContext({
  console,
  Date,
  JSON,
  Map,
  Math,
  Number,
  Object,
  RegExp,
  String,
  encodeURIComponent,
  SpreadsheetApp: {
    getActiveSpreadsheet: () => spreadsheet,
    openById: () => spreadsheet,
    newDataValidation: () => Object.create(validation),
  },
  PropertiesService: {
    getScriptProperties: () => ({ getProperty: () => "spreadsheet-test-id" }),
  },
  Utilities: {
    formatDate: () => "20260904",
    getUuid: () => "abc12300-0000-0000-0000-000000000000",
  },
});

const source = readFileSync(new URL("../control-inventario-google-sheets/Code.gs", import.meta.url), "utf8");
vm.runInContext(
  `${source}\nglobalThis.backend = { buildCatalog_, createPendingOrder_, confirmOrder_, cancelOrder_ };`,
  context
);

const catalog = context.backend.buildCatalog_();
assert.equal(catalog.items.length, 2);
assert.equal(catalog.items[0].price, 21900);
assert.equal(catalog.shipping.gam, 2500);

const created = context.backend.createPendingOrder_({
  items: [{ id: "founder-tee-01", size: "S", variantId: "", quantity: 1, price: 1 }],
  shippingZone: "gam",
});
assert.equal(orders.rows[1][5], 21900, "El subtotal debe ignorar cualquier precio del navegador");
assert.equal(orders.rows[1][8], 24400);
assert.match(decodeURIComponent(created.whatsappUrl), /Total a pagar: ₡24\.400/);

context.backend.confirmOrder_(orders, 2);
assert.equal(inventory.rows[1][7], 1, "Confirmar debe rebajar una unidad");
assert.equal(orders.rows[1][9], "SI");

context.backend.cancelOrder_(orders, 2);
assert.equal(inventory.rows[1][7], 2, "Cancelar debe devolver la unidad");
assert.equal(orders.rows[1][9], "RESTAURADO");

assert.throws(
  () => context.backend.createPendingOrder_({
    items: [{ id: "founder-tee-01", size: "S", variantId: "", quantity: 3 }],
    shippingZone: "gam",
  }),
  /suficientes unidades/
);

console.log("Backend correcto: precio oficial, pedido pendiente, confirmación, cancelación y límite de stock.");
