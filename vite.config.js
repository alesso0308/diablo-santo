import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

const htmlEntries = {
  main: resolve(root, "index.html"),
  shop: resolve(root, "shop.html"),
  purpose: resolve(root, "purpose.html"),
  contacto: resolve(root, "contacto.html"),
  politicas: resolve(root, "politicas.html"),
};

export default defineConfig({
  root,
  publicDir: resolve(root, "public"),
  appType: "mpa",
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: htmlEntries,
    },
  },
});
