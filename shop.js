document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-add-cart]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const block = btn.closest("[data-product]");
      if (!block) return;

      const productId = block.getAttribute("data-product");
      const sizeBtn = block.querySelector(".size.active");
      const size = sizeBtn?.getAttribute("data-size") || "Ajustable";
      const qty = Number(block.querySelector("[data-qty]")?.textContent || 1);

      window.DS.addToCart(productId, size, qty);
    });
  });

  document.querySelectorAll("[data-product]").forEach((block) => {
    const sizes = block.querySelector(".size-options");
    if (!sizes) return;

    sizes.addEventListener("click", (e) => {
      const sizeBtn = e.target.closest(".size");
      if (!sizeBtn) return;
      sizes.querySelectorAll(".size").forEach((b) => b.classList.remove("active"));
      sizeBtn.classList.add("active");
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
});
