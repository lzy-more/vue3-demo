import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 这里使用 `additionalData` 来全局引入 SCSS 文件
        additionalData: `@import "@/assets/reset.scss";`,
        javascriptEnabled: true,
      },
    },
  },
});
