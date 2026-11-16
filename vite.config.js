import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {

        additionalData: `@use "@/assets/scss/index" as *;`
      }
    }
  },
  // 0.0.0.0 = dev server dostupan i drugim računarima na lokalnoj mreži (ne samo localhost)
  server: {
    host: "0.0.0.0",
    port: 5173
  },
  build: {
    chunkSizeWarningLimit: 600
  }
});
