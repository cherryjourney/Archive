import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 路径别名
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // 防止 Vite 清屏（保留 Tauri 的 Rust 编译输出）
  clearScreen: false,

  // 开发服务器
  server: {
    port: 1420,
    strictPort: true,
    host: host || '127.0.0.1',
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },

  // 环境变量前缀
  envPrefix: ["VITE_", "TAURI_"],

  // 构建配置
  build: {
    // Tauri 使用 Chromium 引擎（Windows），生产环境不需要 Safari 兼容
    target: "es2021",
    // 生产构建使用 esbuild 压缩
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // 调试模式开启 sourcemap
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
