import { DS_CONFIG } from "./config.js";

/* DIABLO SANTO — catalogo, carrito e inventario */
const DS_CART_KEY = "ds-cart";
const DS_SHIPPING_KEY = "ds-shipping-zone";

const DS_IMAGES = Object.freeze({
  teeFront: "/images/frente-800.webp",
  teeFrontFit: "/images/frente-humano-800.webp",
  teeBack: "/images/espalda-800.webp",
  teeBackFit: "/images/espalda-humano-800.webp",
  capBrownBeige: "/images/1-800.webp",
  capBlackWhite: "/images/2-800.webp",
  capBlackRed: "/images/3-800.webp",
  capWhiteBlack: "/images/4-800.webp",
});

/*
 * Estos datos permiten dibujar el catalogo mientras carga Google Sheets.
 * El precio que llega a WhatsApp nunca sale de aqui: lo calcula el backend.
 */
const DS_PRODUCTS = Object.freeze({
  "founder-tee-01": {
    id: "founder-tee-01",
    name: "Good Luck Tee 01",
    fallbackPrice: 21900,
    image: DS_IMAGES.teeFront,
    sizes: ["S", "M", "L", "XL"],
    variants: [],
  },
  "cap-01": {
    id: "cap-01",
    name: "Angels & Demons",
    fallbackPrice: 12900,
    image: DS_IMAGES.capBrownBeige,
    sizes: ["Ajustable"],
    variants: [
      { id: "brown-beige", label: "Brown / Beige", image: DS_IMAGES.capBrownBeige },
      { id: "black-white", label: "Black / White", image: DS_IMAGES.capBlackWhite },
      { id: "black-red", label: "Black / Red", image: DS_IMAGES.capBlackRed },
      { id: "white-black", label: "White / Black", image: DS_IMAGES.capWhiteBlack },
    ],
  },
});

const LEGACY_IMAGE_ALIASES = Object.freeze({
  "frente.png": DS_IMAGES.teeFront,
  "frente-800.webp": DS_IMAGES.teeFront,
  "frente-humano.png": DS_IMAGES.teeFrontFit,
  "frente humano.png": DS_IMAGES.teeFrontFit,
  "frente-humano-800.webp": DS_IMAGES.teeFrontFit,
  "espalda.png": DS_IMAGES.teeBack,
  "espalda-800.webp": DS_IMAGES.teeBack,
  "espalda-humano.png": DS_IMAGES.teeBackFit,
  "espalda.humano.png": DS_IMAGES.teeBackFit,
  "espalda-humano-800.webp": DS_IMAGES.teeBackFit,
  "1.png": DS_IMAGES.capBrownBeige,
  "1-800.webp": DS_IMAGES.capBrownBeige,
  "2.png": DS_IMAGES.capBlackWhite,
  "2-800.webp": DS_IMAGES.capBlackWhite,
  "3.png": DS_IMAGES.capBlackRed,
  "3-800.webp": DS_IMAGES.capBlackRed,
  "4.png": DS_IMAGES.capWhiteBlack,
  "4-800.webp": DS_IMAGES.capWhiteBlack,
});

const REMOTE_SKUS = new Map();
const REMOTE_PRICES = new Map();
const SHIPPING_COSTS = { gam: 2500, fuera: 3500 };
let catalogConnected = false;
let catalogUpdatedAt = null;
let shippingZone = "gam";

try {
  shippingZone = localStorage.getItem(DS_SHIPPING_KEY) === "fuera" ? "fuera" : "gam";
} catch {
  shippingZone = "gam";
}

const apiIsConfigured = () => {
  try {
    const url = new URL(String(DS_CONFIG.inventoryApiUrl || "").trim());
    return url.origin === "https://script.google.com" && /\/exec\/?$/.test(url.pathname);
  } catch {
    return false;
  }
};

const currencyCRC = (amount) =>
  `₡${Math.round(Number(amount) || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const normalizeImagePath = (src) => {
  if (!src) return "";
  let filename = String(src);
  if (/^https?:\/\//i.test(filename)) {
    try {
      filename = new URL(filename).pathname;
    } catch {
      return filename;
    }
  }
  filename = filename.split(/[/\\]/).pop()?.toLowerCase().replace(/\s+/g, "-") || "";
  return LEGACY_IMAGE_ALIASES[filename] || `/images/${filename}`;
};

const getProduct = (productId) => DS_PRODUCTS[productId] || null;

const getVariant = (product, variantId) => {
  if (!product?.variants?.length) return null;
  return product.variants.find((variant) => variant.id === variantId) || product.variants[0];
};

const makeSkuKey = (productId, size, variantId = "") =>
  [String(productId), String(size), String(variantId || "")].join("::");

const getProductPrice = (productId) => {
  const product = getProduct(productId);
  return REMOTE_PRICES.get(productId) ?? product?.fallbackPrice ?? 0;
};

const getStock = (productId, size, variantId = "") => {
  if (!catalogConnected) return null;
  return REMOTE_SKUS.get(makeSkuKey(productId, size, variantId))?.stock ?? 0;
};

const normalizeCartItem = (item) => {
  const product = getProduct(item?.id);
  if (!product) return null;

  const size = product.sizes.includes(item.size) ? item.size : product.sizes[0];
  let variantId = item.variantId || "";

  if (!variantId && item.variant && product.variants.length) {
    variantId =
      product.variants.find((variant) => variant.label === item.variant)?.id ||
      product.variants[0].id;
  }

  if (product.variants.length && !product.variants.some((variant) => variant.id === variantId)) {
    variantId = product.variants[0].id;
  }

  const quantity = Math.min(5, Math.max(1, Number.parseInt(item.quantity, 10) || 1));
  return { id: product.id, size, variantId, quantity };
};

const loadCart = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DS_CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeCartItem).filter(Boolean);
  } catch {
    return [];
  }
};

const saveCart = () => {
  const safeCart = cart.map(({ id, size, variantId, quantity }) => ({
    id,
    size,
    variantId,
    quantity,
  }));
  try {
    localStorage.setItem(DS_CART_KEY, JSON.stringify(safeCart));
  } catch {
    /* El carrito continúa funcionando durante la sesión actual. */
  }
};

let cart = loadCart();
saveCart();

const getCartCount = () => cart.reduce((sum, item) => sum + item.quantity, 0);

const getCartTotal = () =>
  cart.reduce((sum, item) => sum + getProductPrice(item.id) * item.quantity, 0);

const getShippingCost = () => {
  if (!cart.length) return 0;
  return SHIPPING_COSTS[shippingZone] ?? SHIPPING_COSTS.gam;
};

const getOrderTotal = () => getCartTotal() + getShippingCost();

const getCartQuantityForSku = (productId, size, variantId = "") =>
  cart
    .filter(
      (item) =>
        item.id === productId &&
        item.size === size &&
        (item.variantId || "") === (variantId || "")
    )
    .reduce((sum, item) => sum + item.quantity, 0);

const hasStockConflict = () =>
  cart.some((item) => {
    const stock = getStock(item.id, item.size, item.variantId);
    return stock !== null && item.quantity > stock;
  });

const showNotice = (message, type = "info") => {
  let notice = document.getElementById("siteNotice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "siteNotice";
    notice.className = "site-notice";
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    document.body.appendChild(notice);
  }
  notice.textContent = message;
  notice.dataset.type = type;
  notice.classList.add("is-visible");
  window.clearTimeout(showNotice.timer);
  showNotice.timer = window.setTimeout(() => notice.classList.remove("is-visible"), 4200);
};

const createDetailsText = (item, variant) => {
  const fragment = document.createDocumentFragment();
  if (variant) {
    fragment.append(`Color: ${variant.label}`, document.createElement("br"));
  }
  fragment.append(`Talla: ${item.size}`);
  return fragment;
};

const updateCartUI = () => {
  const countEl = document.getElementById("cartCount");
  const itemsEl = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("cartSubtotal");
  const shippingEl = document.getElementById("cartShipping");
  const totalEl = document.getElementById("cartTotal");
  const checkoutButtons = [
    document.getElementById("cartWhatsappBtn"),
    document.getElementById("whatsappCheckout"),
  ].filter(Boolean);
  const cartStatus = document.getElementById("cartStatus");

  if (countEl) countEl.textContent = String(getCartCount());
  if (subtotalEl) subtotalEl.textContent = currencyCRC(getCartTotal());
  if (shippingEl) shippingEl.textContent = currencyCRC(getShippingCost());
  if (totalEl) totalEl.textContent = currencyCRC(getOrderTotal());

  const stockConflict = hasStockConflict();
  const canCheckout = cart.length > 0 && apiIsConfigured() && !stockConflict;
  checkoutButtons.forEach((button) => {
    button.disabled = !canCheckout;
    button.setAttribute("aria-disabled", String(!canCheckout));
  });

  if (cartStatus) {
    if (!apiIsConfigured()) {
      cartStatus.textContent = "El control de pedidos debe conectarse antes de publicar.";
    } else if (stockConflict) {
      cartStatus.textContent = "Revisa el carrito: una talla o color ya no tiene suficiente stock.";
    } else {
      cartStatus.textContent = "El precio y la disponibilidad se validan antes de abrir WhatsApp.";
    }
  }

  if (!itemsEl) return;
  itemsEl.replaceChildren();

  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "cart-empty";
    empty.textContent = "Tu carrito está vacío.";
    itemsEl.appendChild(empty);
    return;
  }

  cart.forEach((item, index) => {
    const product = getProduct(item.id);
    const variant = getVariant(product, item.variantId);
    const lineStock = getStock(item.id, item.size, item.variantId);
    const row = document.createElement("article");
    row.className = "cart-item";
    if (lineStock !== null && item.quantity > lineStock) row.classList.add("has-stock-error");

    const thumb = document.createElement("div");
    thumb.className = "cart-item-thumb";
    const img = document.createElement("img");
    img.src = normalizeImagePath(variant?.image || product.image);
    img.alt = product.name;
    img.loading = "lazy";
    img.decoding = "async";
    img.width = 160;
    img.height = 200;
    thumb.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "cart-meta";
    const name = document.createElement("p");
    name.className = "name";
    name.textContent = product.name;
    const details = document.createElement("p");
    details.appendChild(createDetailsText(item, variant));
    const qty = document.createElement("p");
    qty.textContent = `Cantidad: ${item.quantity}`;
    meta.append(name, details, qty);

    if (lineStock !== null && item.quantity > lineStock) {
      const warning = document.createElement("p");
      warning.className = "cart-stock-warning";
      warning.textContent = lineStock > 0 ? `Solo quedan ${lineStock}.` : "Agotado.";
      meta.appendChild(warning);
    }

    const aside = document.createElement("div");
    const price = document.createElement("p");
    price.textContent = currencyCRC(getProductPrice(item.id) * item.quantity);
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-remove";
    removeBtn.dataset.remove = String(index);
    removeBtn.textContent = "Quitar";
    aside.append(price, removeBtn);

    row.append(thumb, meta, aside);
    itemsEl.appendChild(row);
  });
};

const openCart = () => {
  const drawer = document.getElementById("cartDrawer");
  document.getElementById("cartOverlay")?.classList.add("active");
  drawer?.classList.add("active");
  drawer?.setAttribute("aria-hidden", "false");
  drawer?.removeAttribute("inert");
  document.body.classList.add("no-scroll");
  document.getElementById("closeCart")?.focus();
};

const closeCart = () => {
  const drawer = document.getElementById("cartDrawer");
  document.getElementById("cartOverlay")?.classList.remove("active");
  drawer?.classList.remove("active");
  drawer?.setAttribute("aria-hidden", "true");
  drawer?.setAttribute("inert", "");
  if (!document.getElementById("navDrawer")?.classList.contains("active")) {
    document.body.classList.remove("no-scroll");
  }
};

const addToCart = (productId, size, quantity = 1, variantId = "") => {
  const product = getProduct(productId);
  if (!product || !product.sizes.includes(size)) return;

  const variant = getVariant(product, variantId);
  const safeVariantId = variant?.id || "";
  const requestedQuantity = Math.min(5, Math.max(1, Number(quantity) || 1));
  const currentQuantity = getCartQuantityForSku(productId, size, safeVariantId);
  const stock = getStock(productId, size, safeVariantId);

  if (stock !== null && currentQuantity + requestedQuantity > stock) {
    showNotice(
      stock > 0 ? `Solo quedan ${stock} unidades de esta opción.` : "Esta opción está agotada.",
      "error"
    );
    return;
  }

  const existing = cart.find(
    (item) =>
      item.id === productId && item.size === size && (item.variantId || "") === safeVariantId
  );

  if (existing) existing.quantity += requestedQuantity;
  else cart.push({ id: productId, size, variantId: safeVariantId, quantity: requestedQuantity });

  saveCart();
  updateCartUI();
  updateShopAvailability();
  openCart();
};

const removeFromCart = (index) => {
  if (!Number.isInteger(index) || index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  saveCart();
  updateCartUI();
  updateShopAvailability();
};

const submitCheckoutForm = () => {
  const endpoint = String(DS_CONFIG.inventoryApiUrl || "").trim();
  const targetName = `ds_checkout_${Date.now()}`;
  const checkoutWindow = window.open("about:blank", targetName);

  if (checkoutWindow) {
    try {
      checkoutWindow.opener = null;
      checkoutWindow.document.title = "Preparando pedido | Diablo Santo";
      checkoutWindow.document.body.textContent = "Validando precio y disponibilidad…";
    } catch {
      /* La navegacion del formulario continuara normalmente. */
    }
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = endpoint;
  form.target = checkoutWindow ? targetName : "_self";
  form.hidden = true;

  const payload = document.createElement("input");
  payload.type = "hidden";
  payload.name = "payload";
  payload.value = JSON.stringify({
    version: 1,
    items: cart.map(({ id, size, variantId, quantity }) => ({
      id,
      size,
      variantId,
      quantity,
    })),
    shippingZone,
    sourceUrl: window.location.origin,
  });

  const honeypot = document.createElement("input");
  honeypot.type = "hidden";
  honeypot.name = "company";
  honeypot.value = "";
  form.append(payload, honeypot);
  document.body.appendChild(form);
  form.submit();
  form.remove();
};

const checkoutWhatsApp = () => {
  if (!cart.length) {
    if (document.querySelector('a[href="shop.html"]') && window.confirm("Tu carrito está vacío. ¿Ir al shop?")) {
      window.location.href = "shop.html";
    }
    return;
  }

  if (!apiIsConfigured()) {
    showNotice("El control de inventario todavía no está conectado.", "error");
    return;
  }

  if (hasStockConflict()) {
    showNotice("Hay una opción sin stock suficiente. Revísala antes de continuar.", "error");
    openCart();
    return;
  }

  submitCheckoutForm();
  showNotice("Estamos validando tu pedido. WhatsApp se abrirá en otra pestaña.");
};

const applyRemoteCatalog = (payload) => {
  if (!payload?.ok || !Array.isArray(payload.items)) {
    throw new Error("Respuesta de inventario inválida");
  }

  const nextSkus = new Map();
  const nextPrices = new Map();

  payload.items.forEach((item) => {
    const product = getProduct(item.productId);
    const price = Number(item.price);
    const stock = Number(item.stock);
    const initialStock = Number(item.initialStock);
    if (!product || !product.sizes.includes(item.size)) return;
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) return;

    const variantId = item.variantId || "";
    if (product.variants.length && !product.variants.some((variant) => variant.id === variantId)) {
      return;
    }

    const safeItem = {
      productId: product.id,
      size: item.size,
      variantId,
      price: Math.round(price),
      stock: Math.max(0, Math.floor(stock)),
      initialStock: Number.isFinite(initialStock)
        ? Math.max(Math.floor(initialStock), Math.floor(stock), 0)
        : Math.max(Math.floor(stock), 0),
    };
    nextSkus.set(makeSkuKey(product.id, item.size, variantId), safeItem);
    if (!nextPrices.has(product.id)) nextPrices.set(product.id, safeItem.price);
  });

  if (!nextSkus.size) throw new Error("El inventario está vacío");

  REMOTE_SKUS.clear();
  REMOTE_PRICES.clear();
  nextSkus.forEach((value, key) => REMOTE_SKUS.set(key, value));
  nextPrices.forEach((value, key) => REMOTE_PRICES.set(key, value));

  if (Number.isFinite(Number(payload.shipping?.gam))) {
    SHIPPING_COSTS.gam = Math.max(0, Math.round(Number(payload.shipping.gam)));
  }
  if (Number.isFinite(Number(payload.shipping?.fuera))) {
    SHIPPING_COSTS.fuera = Math.max(0, Math.round(Number(payload.shipping.fuera)));
  }

  catalogConnected = true;
  catalogUpdatedAt = payload.updatedAt || null;
  document.documentElement.dataset.inventory = "connected";
  updateDynamicCatalogUI();
};

const loadCatalog = () =>
  new Promise((resolve, reject) => {
    if (!apiIsConfigured()) {
      reject(new Error("API sin configurar"));
      return;
    }

    const callbackName = `__dsCatalog_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeoutMs = Math.max(3000, Number(DS_CONFIG.catalogTimeoutMs) || 9000);
    const timeout = window.setTimeout(() => cleanup(new Error("Tiempo de espera agotado")), timeoutMs);

    const cleanup = (error, data) => {
      window.clearTimeout(timeout);
      script.remove();
      try {
        delete window[callbackName];
      } catch {
        window[callbackName] = undefined;
      }
      if (error) reject(error);
      else resolve(data);
    };

    window[callbackName] = (data) => cleanup(null, data);
    script.onerror = () => cleanup(new Error("No fue posible cargar el inventario"));

    const url = new URL(DS_CONFIG.inventoryApiUrl);
    url.searchParams.set("action", "catalog");
    url.searchParams.set("callback", callbackName);
    url.searchParams.set("_", String(Date.now()));
    script.src = url.toString();
    script.async = true;
    document.head.appendChild(script);
  });

const updatePriceLabels = () => {
  document.querySelectorAll("[data-product-price]").forEach((element) => {
    const productId = element.getAttribute("data-product-price");
    if (getProduct(productId)) element.textContent = currencyCRC(getProductPrice(productId));
  });
};

const updateShippingLabels = () => {
  document.querySelectorAll("[data-shipping-price]").forEach((element) => {
    const zone = element.getAttribute("data-shipping-price");
    if (zone in SHIPPING_COSTS) element.textContent = currencyCRC(SHIPPING_COSTS[zone]);
  });
};

const updateStockSummary = () => {
  const productItems = [...REMOTE_SKUS.values()].filter(
    (item) => item.productId === "founder-tee-01"
  );
  const current = productItems.reduce((sum, item) => sum + item.stock, 0);
  const initial = productItems.reduce((sum, item) => sum + item.initialStock, 0);

  document.querySelectorAll("[data-stock-heading]").forEach((element) => {
    element.textContent = initial > 0 ? `SOLO EXISTEN ${initial}.` : "EDICIÓN LIMITADA.";
  });
  document.querySelectorAll("[data-stock-label]").forEach((element) => {
    element.textContent = catalogConnected
      ? `${current} / ${initial || current} DISPONIBLES`
      : "DISPONIBILIDAD AL FINALIZAR";
  });
  document.querySelectorAll("[data-stock-progress]").forEach((element) => {
    const percentage = initial > 0 ? Math.min(100, Math.max(0, (current / initial) * 100)) : 0;
    element.style.width = `${percentage}%`;
  });
};

const getSelectedOption = (block) => {
  const productId = block.getAttribute("data-product");
  const sizeButton = block.querySelector(".size-options:not([data-cap-variants]) .size.active");
  const variantButton = block.querySelector("[data-cap-variants] .size.active");
  return {
    productId,
    size: sizeButton?.getAttribute("data-size") || "Ajustable",
    variantId: variantButton?.getAttribute("data-cap-variant") || "",
  };
};

const updateBlockAvailability = (block) => {
  const productId = block.getAttribute("data-product");
  const product = getProduct(productId);
  if (!product) return;

  const standardSizeButtons = [
    ...block.querySelectorAll(".size-options:not([data-cap-variants]) .size"),
  ];
  standardSizeButtons.forEach((button) => {
    const size = button.getAttribute("data-size");
    const stock = getStock(productId, size, "");
    if (!product.variants.length) {
      button.disabled = stock === 0;
      button.classList.toggle("is-sold-out", stock === 0);
      button.setAttribute("aria-label", stock === 0 ? `${size}, agotada` : size);
    }
  });

  const variantButtons = [...block.querySelectorAll("[data-cap-variants] .size")];
  variantButtons.forEach((button) => {
    const variantId = button.getAttribute("data-cap-variant") || "";
    const stock = getStock(productId, "Ajustable", variantId);
    button.disabled = stock === 0;
    button.classList.toggle("is-sold-out", stock === 0);
    const label = button.textContent.trim();
    button.setAttribute("aria-label", stock === 0 ? `${label}, agotado` : label);
  });

  const activeSize = standardSizeButtons.find((button) => button.classList.contains("active"));
  if (activeSize?.disabled) {
    activeSize.classList.remove("active");
    standardSizeButtons.find((button) => !button.disabled)?.classList.add("active");
  }

  const activeVariant = variantButtons.find((button) => button.classList.contains("active"));
  if (activeVariant?.disabled) {
    activeVariant.classList.remove("active");
    const firstAvailable = variantButtons.find((button) => !button.disabled);
    firstAvailable?.classList.add("active");
    const slideIndex = Number(firstAvailable?.getAttribute("data-cap-slide"));
    const carousel = block.querySelector("[data-cap-carousel]");
    if (firstAvailable && Number.isFinite(slideIndex) && typeof carousel?.carouselGoTo === "function") {
      carousel.carouselGoTo(slideIndex);
    }
  }

  const selection = getSelectedOption(block);
  const selectedStock = getStock(selection.productId, selection.size, selection.variantId);
  const inCart = getCartQuantityForSku(
    selection.productId,
    selection.size,
    selection.variantId
  );
  const remaining = selectedStock === null ? null : Math.max(0, selectedStock - inCart);
  const status = block.querySelector("[data-stock-status]");
  const addButton = block.querySelector("[data-add-cart]");
  const qtyElement = block.querySelector("[data-qty]");
  const plusButton = block.querySelector("[data-qty-plus]");

  if (status) {
    if (remaining === null) status.textContent = "Disponibilidad confirmada al finalizar";
    else if (remaining === 0) status.textContent = "Agotado";
    else if (remaining === 1) status.textContent = "Última unidad disponible";
    else status.textContent = `${remaining} disponibles`;
  }

  if (addButton) {
    addButton.disabled = remaining === 0 || (!selection.size && product.sizes.length > 0);
    addButton.textContent = remaining === 0 ? "AGOTADO" : "RECLAMAR TU PIEZA";
  }

  if (qtyElement) {
    const max = remaining === null ? 5 : Math.max(1, Math.min(5, remaining));
    qtyElement.textContent = String(Math.min(max, Number(qtyElement.textContent) || 1));
    qtyElement.dataset.max = String(max);
    if (plusButton) plusButton.disabled = remaining === 0 || Number(qtyElement.textContent) >= max;
  }
};

const updateShopAvailability = () => {
  document.querySelectorAll("[data-product]").forEach(updateBlockAvailability);
};

const updateDynamicCatalogUI = () => {
  updatePriceLabels();
  updateShippingLabels();
  updateStockSummary();
  updateCartUI();
  updateShopAvailability();
};

const initCatalog = async () => {
  updateDynamicCatalogUI();
  if (!apiIsConfigured()) {
    document.documentElement.dataset.inventory = "setup-required";
    return;
  }

  try {
    applyRemoteCatalog(await loadCatalog());
  } catch (error) {
    document.documentElement.dataset.inventory = "offline";
    console.warn("Inventario no disponible:", error.message);
    updateDynamicCatalogUI();
  }
};

const initNavbar = () => {
  const navbar = document.getElementById("navbar");
  const menuBtn = document.getElementById("menuBtn");
  const menuClose = document.getElementById("menuClose");
  const navDrawer = document.getElementById("navDrawer");
  const navOverlay = document.getElementById("navOverlay");

  const setScrolled = () => {
    if (!navbar) return;
    const forceLight = document.body.classList.contains("page-inner");
    navbar.classList.toggle("scrolled", forceLight || window.scrollY > 24);
  };

  const openMenu = () => {
    navDrawer?.classList.add("active");
    navDrawer?.setAttribute("aria-hidden", "false");
    navDrawer?.removeAttribute("inert");
    navOverlay?.classList.add("active");
    menuBtn?.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    menuClose?.focus();
  };

  const closeMenu = () => {
    navDrawer?.classList.remove("active");
    navDrawer?.setAttribute("aria-hidden", "true");
    navDrawer?.setAttribute("inert", "");
    navOverlay?.classList.remove("active");
    menuBtn?.setAttribute("aria-expanded", "false");
    if (!document.getElementById("cartDrawer")?.classList.contains("active")) {
      document.body.classList.remove("no-scroll");
    }
  };

  menuBtn?.addEventListener("click", () => {
    if (navDrawer?.classList.contains("active")) closeMenu();
    else openMenu();
  });
  menuClose?.addEventListener("click", closeMenu);
  navOverlay?.addEventListener("click", closeMenu);
  navDrawer?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("scroll", setScrolled, { passive: true });
  setScrolled();
};

const initCart = () => {
  document.getElementById("openCartTop")?.addEventListener("click", openCart);
  document.getElementById("closeCart")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("cartWhatsappBtn")?.addEventListener("click", checkoutWhatsApp);
  document.getElementById("whatsappCheckout")?.addEventListener("click", checkoutWhatsApp);

  document.querySelectorAll('input[name="shippingZone"]').forEach((input) => {
    input.checked = input.value === shippingZone;
    input.addEventListener("change", () => {
      if (input.checked) {
        shippingZone = input.value;
        try {
          localStorage.setItem(DS_SHIPPING_KEY, shippingZone);
        } catch {
          /* El envio sigue seleccionado durante la sesion actual. */
        }
        updateCartUI();
      }
    });
  });

  document.getElementById("cartItems")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (button) removeFromCart(Number(button.getAttribute("data-remove")));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeCart();
    const navDrawer = document.getElementById("navDrawer");
    navDrawer?.classList.remove("active");
    navDrawer?.setAttribute("aria-hidden", "true");
    navDrawer?.setAttribute("inert", "");
    document.getElementById("navOverlay")?.classList.remove("active");
    document.getElementById("menuBtn")?.setAttribute("aria-expanded", "false");
  });

  updateCartUI();
};

const initReveal = () => {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal, .chapter").forEach((element) => element.classList.add("show"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal, .chapter").forEach((element) => observer.observe(element));
};

const initParallax = () => {
  const elements = document.querySelectorAll("[data-parallax]");
  if (!elements.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const onScroll = () => {
    const y = window.scrollY;
    elements.forEach((element) => {
      const speed = Number(element.getAttribute("data-parallax")) || 0.1;
      element.style.transform = `translate3d(0, ${y * speed}px, 0)`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
};

const initProductCarousels = () => {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector(".carousel-track");
    const slides = [...root.querySelectorAll(".carousel-slide")];
    const viewport = root.querySelector(".carousel-viewport");
    const prevButton = root.querySelector(".carousel-nav--prev");
    const nextButton = root.querySelector(".carousel-nav--next");
    const dotsWrap = root.querySelector(".carousel-dots");
    const images = [...root.querySelectorAll(".carousel-slide img")];
    const isCapCarousel = root.hasAttribute("data-cap-carousel");
    if (!track || !slides.length) return;

    let index = 0;
    let touchStartX = 0;
    let touchDelta = 0;

    const syncFrameRatio = (slideIndex = 0) => {
      if (!viewport) return;
      const activeImage = isCapCarousel
        ? images[slideIndex] || images[0]
        : images.find((image) => image.naturalWidth > 0) || images[0];
      if (activeImage?.naturalWidth > 0) {
        viewport.style.aspectRatio = `${activeImage.naturalWidth} / ${activeImage.naturalHeight}`;
      }
    };

    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      dotsWrap?.querySelectorAll("button").forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
        dot.tabIndex = active ? 0 : -1;
      });
      syncFrameRatio(index);
      root.dispatchEvent(new CustomEvent("ds-carousel-change", { detail: { index } }));
    };

    root.carouselGoTo = goTo;
    root.carouselIndex = () => index;

    if (dotsWrap) {
      dotsWrap.replaceChildren();
      slides.forEach((_, slideIndex) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Imagen ${slideIndex + 1}`);
        dot.addEventListener("click", () => goTo(slideIndex));
        dotsWrap.appendChild(dot);
      });
    }

    images.forEach((image) => {
      if (image.complete) syncFrameRatio(index);
      else image.addEventListener("load", () => syncFrameRatio(index), { once: true });
    });

    prevButton?.addEventListener("click", () => goTo(index - 1));
    nextButton?.addEventListener("click", () => goTo(index + 1));
    viewport?.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") goTo(index - 1);
      if (event.key === "ArrowRight") goTo(index + 1);
    });

    viewport?.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
        touchDelta = 0;
        track.style.transition = "none";
      },
      { passive: true }
    );

    viewport?.addEventListener(
      "touchmove",
      (event) => {
        touchDelta = event.changedTouches[0].clientX - touchStartX;
        const offset = -index * 100 + (touchDelta / viewport.offsetWidth) * 100;
        track.style.transform = `translate3d(${offset}%, 0, 0)`;
      },
      { passive: true }
    );

    viewport?.addEventListener("touchend", () => {
      track.style.transition = "";
      if (touchDelta < -40) goTo(index + 1);
      else if (touchDelta > 40) goTo(index - 1);
      else goTo(index);
    });

    goTo(0);
  });
};

const initCapProduct = () => {
  const capBlock = document.querySelector("[data-product='cap-01']");
  const variantGroup = capBlock?.querySelector("[data-cap-variants]");
  const carousel = capBlock?.querySelector("[data-cap-carousel]");
  if (!variantGroup || !carousel) return;

  const buttons = [...variantGroup.querySelectorAll("[data-cap-slide]")];
  const setActiveVariant = (slideIndex) => {
    buttons.forEach((button) => {
      button.classList.toggle(
        "active",
        Number(button.getAttribute("data-cap-slide")) === slideIndex
      );
    });
    updateBlockAvailability(capBlock);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const slideIndex = Number(button.getAttribute("data-cap-slide"));
      if (!button.disabled && Number.isFinite(slideIndex)) carousel.carouselGoTo?.(slideIndex);
    });
  });
  carousel.addEventListener("ds-carousel-change", (event) => setActiveVariant(event.detail.index));
};

const initShopProducts = () => {
  document.querySelectorAll("[data-product]").forEach((block) => {
    block.querySelectorAll(".size-options:not([data-cap-variants])").forEach((group) => {
      group.addEventListener("click", (event) => {
        const sizeButton = event.target.closest(".size");
        if (!sizeButton || sizeButton.disabled) return;
        group.querySelectorAll(".size").forEach((button) => button.classList.remove("active"));
        sizeButton.classList.add("active");
        const qtyElement = block.querySelector("[data-qty]");
        if (qtyElement) qtyElement.textContent = "1";
        updateBlockAvailability(block);
      });
    });

    const minusButton = block.querySelector("[data-qty-minus]");
    const plusButton = block.querySelector("[data-qty-plus]");
    const qtyElement = block.querySelector("[data-qty]");

    minusButton?.addEventListener("click", () => {
      qtyElement.textContent = String(Math.max(1, Number(qtyElement.textContent) - 1));
      updateBlockAvailability(block);
    });

    plusButton?.addEventListener("click", () => {
      const max = Number(qtyElement.dataset.max) || 5;
      qtyElement.textContent = String(Math.min(max, Number(qtyElement.textContent) + 1));
      updateBlockAvailability(block);
    });

    block.querySelector("[data-add-cart]")?.addEventListener("click", () => {
      const selection = getSelectedOption(block);
      addToCart(
        selection.productId,
        selection.size,
        Number(qtyElement?.textContent) || 1,
        selection.variantId
      );
    });
  });

  updateShopAvailability();
};

const initServiceWorker = () => {
  if (!("serviceWorker" in navigator) || window.location.protocol !== "https:") return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    /* El sitio sigue funcionando sin instalacion PWA. */
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initCart();
  initReveal();
  initParallax();
  initProductCarousels();
  initCapProduct();
  initShopProducts();
  initServiceWorker();
  initCatalog();
});

window.DS = Object.freeze({
  addToCart,
  openCart,
  checkoutWhatsApp,
  currencyCRC,
  get catalogUpdatedAt() {
    return catalogUpdatedAt;
  },
});
