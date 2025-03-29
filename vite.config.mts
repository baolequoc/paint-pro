import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite';
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  base: "./",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  css: {
  },
  server: {
    host: "0.0.0.0"
  }
});
