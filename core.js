/* DIABLO SANTO — shared core */
const DS_WHATSAPP = "50685838140";
const DS_CART_KEY = "ds-cart";

const DS_IMAGES = {
  teeFront: "/images/frente.png",
  teeFrontFit: "/images/frente-humano.png",
  teeBack: "/images/espalda.png",
  teeBackFit: "/images/espalda-humano.png",
  capBrownBeige: "/images/1.png",
  capBlackWhite: "/images/2.png",
  capBlackRed: "/images/3.png",
  capWhiteBlack: "/images/4.png",
};

const LEGACY_IMAGE_ALIASES = {
  "frente.png": DS_IMAGES.teeFront,
  "frente-humano.png": DS_IMAGES.teeFrontFit,
  "frente humano.png": DS_IMAGES.teeFrontFit,
  "espalda.png": DS_IMAGES.teeBack,
  "espalda-humano.png": DS_IMAGES.teeBackFit,
  "espalda.humano.png": DS_IMAGES.teeBackFit,
  "1.png": DS_IMAGES.capBrownBeige,
  "2.png": DS_IMAGES.capBlackWhite,
  "3.png": DS_IMAGES.capBlackRed,
  "4.png": DS_IMAGES.capWhiteBlack,
};

const normalizeImagePath = (src) => {
  if (!src) return "";
  let filename = src;
  if (/^https?:\/\//i.test(src)) {
    try {
      filename = new URL(src).pathname;
    } catch {
      return src;
    }
  }
  filename = filename.split(/[/\\]/).pop() || filename;
  filename = filename.toLowerCase().replace(/\s+/g, "-");
  return LEGACY_IMAGE_ALIASES[filename] || `/images/${filename}`;
};

const DS_PRODUCTS = {
  "founder-tee-01": {
    id: "founder-tee-01",
    name: "Good Luck Tee 01",
    price: 21900,
    image: DS_IMAGES.teeFront,
    sizes: ["S", "M", "L", "XL"],
  },
  "cap-01": {
    id: "cap-01",
    name: "Cap 01 — Barrio",
    price: 12900,
    image: DS_IMAGES.capBrownBeige,
    sizes: ["Ajustable"],
    variants: [
      { id: "brown-beige", label: "Brown / Beige", image: DS_IMAGES.capBrownBeige },
      { id: "black-white", label: "Black / White", image: DS_IMAGES.capBlackWhite },
      { id: "black-red", label: "Black / Red", image: DS_IMAGES.capBlackRed },
      { id: "white-black", label: "White / Black", image: DS_IMAGES.capWhiteBlack },
    ],
  },
};

const getCapVariant = (product, variantId) =>
  product?.variants?.find((v) => v.id === variantId) || product?.variants?.[0];

const resolveCartImage = (src) => normalizeImagePath(src);

const normalizeCartItem = (item) => {
  if (!item?.image) return item;
  return { ...item, image: normalizeImagePath(item.image) };
};

const currencyCRC = (amount) => `₡${amount.toLocaleString("es-CR")}`;

const loadCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(DS_CART_KEY)) || [];
    return items.map(normalizeCartItem);
  } catch {
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem(DS_CART_KEY, JSON.stringify(cart));
};

let cart = loadCart();
saveCart(cart);

const getCartTotal = () =>
  cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

const getCartCount = () =>
  cart.reduce((sum, item) => sum + item.quantity, 0);

const updateCartUI = () => {
  const countEl = document.getElementById("cartCount");
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const waBtn = document.getElementById("cartWhatsappBtn");

  if (countEl) countEl.textContent = String(getCartCount());

  if (!itemsEl) return;

  itemsEl.innerHTML = "";

  if (!cart.length) {
    itemsEl.innerHTML = '<p class="cart-empty">Tu carrito esta vacio.</p>';
    if (totalEl) totalEl.textContent = "₡0";
    if (waBtn) waBtn.disabled = true;
    document.getElementById("whatsappCheckout")?.setAttribute("disabled", "");
    return;
  }

  document.getElementById("whatsappCheckout")?.removeAttribute("disabled");

  cart.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "cart-item";

    const thumb = document.createElement("div");
    thumb.className = "cart-item-thumb";
    const img = document.createElement("img");
    img.src = resolveCartImage(item.image);
    img.alt = item.name || "Producto";
    img.loading = "lazy";
    img.decoding = "async";
    thumb.appendChild(img);

    const meta = document.createElement("div");
    meta.className = "cart-meta";
    const name = document.createElement("p");
    name.className = "name";
    name.textContent = item.name;
    meta.appendChild(name);

    const details = document.createElement("p");
    details.innerHTML = item.variant
      ? `Color: ${item.variant}<br />Talla: ${item.size}`
      : `Talla: ${item.size}`;
    meta.appendChild(details);

    const qty = document.createElement("p");
    qty.textContent = `Cantidad: ${item.quantity}`;
    meta.appendChild(qty);

    const aside = document.createElement("div");
    const price = document.createElement("p");
    price.textContent = currencyCRC(item.price * item.quantity);
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-remove";
    removeBtn.dataset.remove = String(index);
    removeBtn.textContent = "Quitar";
    aside.append(price, removeBtn);

    row.append(thumb, meta, aside);
    itemsEl.appendChild(row);
  });

  if (totalEl) totalEl.textContent = currencyCRC(getCartTotal());
  if (waBtn) waBtn.disabled = false;
};

const openCart = () => {
  document.getElementById("cartOverlay")?.classList.add("active");
  document.getElementById("cartDrawer")?.classList.add("active");
  document.body.classList.add("no-scroll");
};

const closeCart = () => {
  document.getElementById("cartOverlay")?.classList.remove("active");
  document.getElementById("cartDrawer")?.classList.remove("active");
  if (!document.getElementById("navDrawer")?.classList.contains("active")) {
    document.body.classList.remove("no-scroll");
  }
};

const addToCart = (productId, size, quantity = 1, variantId = null) => {
  const product = DS_PRODUCTS[productId];
  if (!product) return;

  const variant = variantId ? getCapVariant(product, variantId) : null;
  const lineVariant = variant?.label || null;
  const lineImage = normalizeImagePath(variant?.image || product.image || "");

  const existing = cart.find(
    (item) =>
      item.id === productId &&
      item.size === size &&
      (item.variant || null) === lineVariant
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: lineImage,
      size,
      variant: lineVariant,
      quantity,
    });
  }

  saveCart(cart);
  updateCartUI();
  openCart();
};

const removeFromCart = (index) => {
  cart.splice(index, 1);
  saveCart(cart);
  updateCartUI();
};

const buildWhatsAppMessage = () => {
  if (!cart.length) return "";

  const lines = [
    "🔥 DIABLO SANTO ORDER",
    "",
    ...cart.map(
      (item) =>
        `• ${item.name}${item.variant ? `\n  Color: ${item.variant}` : ""}\n  Talla: ${item.size}\n  Cantidad: ${item.quantity}\n  Subtotal: ${currencyCRC(item.price * item.quantity)}`
    ),
    "",
    `Total: ${currencyCRC(getCartTotal())}`,
    "",
    "Nombre:",
    "Ciudad / envio:",
  ];

  return lines.join("\n");
};

const checkoutWhatsApp = () => {
  if (!cart.length) {
    const shop = document.querySelector('a[href="shop.html"]');
    if (shop && confirm("Tu carrito esta vacio. Ir al shop?")) {
      window.location.href = "shop.html";
    }
    return;
  }

  const message = buildWhatsAppMessage();
  window.open(
    `https://wa.me/${DS_WHATSAPP}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
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
    if (forceLight || window.scrollY > 24) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  const openMenu = () => {
    navDrawer?.classList.add("active");
    navOverlay?.classList.add("active");
    menuBtn?.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  };

  const closeMenu = () => {
    navDrawer?.classList.remove("active");
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

  navDrawer?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("scroll", setScrolled);
  setScrolled();
};

const initCart = () => {
  document.getElementById("openCartTop")?.addEventListener("click", openCart);
  document.getElementById("closeCart")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("cartWhatsappBtn")?.addEventListener("click", checkoutWhatsApp);
  document.getElementById("whatsappCheckout")?.addEventListener("click", checkoutWhatsApp);

  document.getElementById("cartItems")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    removeFromCart(Number(btn.getAttribute("data-remove")));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeCart();
    document.getElementById("navDrawer")?.classList.remove("active");
    document.getElementById("navOverlay")?.classList.remove("active");
    document.getElementById("menuBtn")?.setAttribute("aria-expanded", "false");
    if (!document.getElementById("cartDrawer")?.classList.contains("active")) {
      document.body.classList.remove("no-scroll");
    }
  });

  updateCartUI();
};

const initReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal, .chapter").forEach((el) => observer.observe(el));
};

const initParallax = () => {
  const els = document.querySelectorAll("[data-parallax]");
  if (!els.length) return;

  const onScroll = () => {
    const y = window.scrollY;
    els.forEach((el) => {
      const speed = Number(el.getAttribute("data-parallax")) || 0.1;
      el.style.transform = `translate3d(0, ${y * speed}px, 0)`;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
};

const initStock = () => {
  const label = document.getElementById("stockLabel");
  const bar = document.getElementById("stockProgress");
  if (!label || !bar) return;
  const available = 8;
  const total = 15;
  label.textContent = `${available} / ${total} DISPONIBLES`;
  bar.style.width = `${(available / total) * 100}%`;
};

const initProductCarousels = () => {
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector(".carousel-track");
    const slides = root.querySelectorAll(".carousel-slide");
    const prevBtn = root.querySelector(".carousel-nav--prev");
    const nextBtn = root.querySelector(".carousel-nav--next");
    const dotsWrap = root.querySelector(".carousel-dots");
    const isCapCarousel = root.hasAttribute("data-cap-carousel");

    if (!track || !slides.length) return;

    const viewport = root.querySelector(".carousel-viewport");
    const imgs = [...root.querySelectorAll(".carousel-slide img")];

    const syncFrameRatio = (slideIndex = 0) => {
      if (!viewport) return;
      if (isCapCarousel) {
        const activeImg = imgs[slideIndex] || imgs[0];
        if (activeImg?.naturalWidth > 0) {
          viewport.style.aspectRatio = `${activeImg.naturalWidth} / ${activeImg.naturalHeight}`;
        } else {
          viewport.style.aspectRatio = "4 / 5";
        }
        return;
      }
      const loaded = imgs.filter((img) => img.naturalWidth > 0);
      if (!loaded.length) return;
      const ref =
        loaded.find((img) => /frente\.png/i.test(img.getAttribute("src") || "")) ||
        loaded.find((img) => img.naturalHeight >= img.naturalWidth) ||
        loaded[0];
      viewport.style.aspectRatio = `${ref.naturalWidth} / ${ref.naturalHeight}`;
    };

    const resetSlideStyles = () => {
      imgs.forEach((img) => {
        img.style.transform = "";
        img.style.width = "";
        img.style.height = "";
        img.closest(".carousel-slide")?.classList.remove("carousel-slide--landscape");
      });
    };

    const syncCarouselLayout = () => {
      resetSlideStyles();
      syncFrameRatio();
    };

    imgs.forEach((img) => {
      const onReady = () => syncCarouselLayout();
      if (img.complete) onReady();
      else img.addEventListener("load", onReady, { once: true });
    });

    let index = 0;
    let touchStartX = 0;
    let touchDelta = 0;

    const goTo = (i) => {
      index = (i + slides.length) % slides.length;
      track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      dotsWrap?.querySelectorAll("button").forEach((dot, di) => {
        dot.classList.toggle("is-active", di === index);
        dot.setAttribute("aria-selected", di === index ? "true" : "false");
      });
      if (isCapCarousel) syncFrameRatio(index);
      root.dispatchEvent(
        new CustomEvent("ds-carousel-change", { detail: { index } })
      );
    };

    root.carouselGoTo = goTo;
    root.carouselIndex = () => index;

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Imagen ${i + 1}`);
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    prevBtn?.addEventListener("click", () => goTo(index - 1));
    nextBtn?.addEventListener("click", () => goTo(index + 1));

    viewport?.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].clientX;
        touchDelta = 0;
        track.style.transition = "none";
      },
      { passive: true }
    );

    viewport?.addEventListener(
      "touchmove",
      (e) => {
        touchDelta = e.changedTouches[0].clientX - touchStartX;
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
    requestAnimationFrame(() => {
      requestAnimationFrame(syncCarouselLayout);
    });
  });
};

const initCapProduct = () => {
  const capBlock = document.querySelector("[data-product='cap-01']");
  const variantGroup = capBlock?.querySelector("[data-cap-variants]");
  const capCarousel = capBlock?.querySelector("[data-cap-carousel]");
  if (!variantGroup || !capCarousel) return;

  DS_PRODUCTS["cap-01"]?.variants?.forEach((v) => {
    const img = new Image();
    img.src = v.image;
  });

  const variantButtons = [...variantGroup.querySelectorAll("[data-cap-slide]")];

  const setActiveVariant = (slideIndex) => {
    variantButtons.forEach((btn) => {
      const match = Number(btn.getAttribute("data-cap-slide")) === slideIndex;
      btn.classList.toggle("active", match);
    });
  };

  const goToVariant = (slideIndex) => {
    if (typeof capCarousel.carouselGoTo === "function") {
      capCarousel.carouselGoTo(slideIndex);
      return;
    }
    const track = capCarousel.querySelector(".carousel-track");
    if (!track) return;
    track.style.transform = `translate3d(-${slideIndex * 100}%, 0, 0)`;
    setActiveVariant(slideIndex);
  };

  variantButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const slideIndex = Number(btn.getAttribute("data-cap-slide"));
      if (Number.isNaN(slideIndex)) return;
      variantButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      goToVariant(slideIndex);
    });
  });

  capCarousel.addEventListener("ds-carousel-change", (e) => {
    setActiveVariant(e.detail.index);
  });
};

const initShopProducts = () => {
  document.querySelectorAll("[data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const block = btn.closest("[data-product]");
      if (!block) return;

      const productId = block.getAttribute("data-product");
      const sizeBtn = block.querySelector(
        ".size-options:not([data-cap-variants]) .size.active"
      );
      const size = sizeBtn?.getAttribute("data-size") || "Ajustable";
      const qty = Number(block.querySelector("[data-qty]")?.textContent || 1);
      const variantBtn = block.querySelector("[data-cap-variants] .size.active");
      const variantId = variantBtn?.getAttribute("data-cap-variant") || null;

      addToCart(productId, size, qty, variantId);
    });
  });

  document.querySelectorAll("[data-product]").forEach((block) => {
    block.querySelectorAll(".size-options:not([data-cap-variants])").forEach((group) => {
      group.addEventListener("click", (e) => {
        const sizeBtn = e.target.closest(".size");
        if (!sizeBtn) return;
        group.querySelectorAll(".size").forEach((b) => b.classList.remove("active"));
        sizeBtn.classList.add("active");
      });
    });

    const minus = block.querySelector("[data-qty-minus]");
    const plus = block.querySelector("[data-qty-plus]");
    const qtyEl = block.querySelector("[data-qty]");

    minus?.addEventListener("click", () => {
      const v = Math.max(1, Number(qtyEl.textContent) - 1);
      qtyEl.textContent = String(v);
    });

    plus?.addEventListener("click", () => {
      const v = Math.min(5, Number(qtyEl.textContent) + 1);
      qtyEl.textContent = String(v);
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initNavbar();
  initCart();
  initReveal();
  initParallax();
  initStock();
  initProductCarousels();
  initCapProduct();
  initShopProducts();
});

window.DS = {
  addToCart,
  openCart,
  checkoutWhatsApp,
  DS_PRODUCTS,
  currencyCRC,
};
