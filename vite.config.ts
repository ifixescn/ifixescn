import { defineConfig, loadEnv } from "vite";
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
      miaodaDevPlugin(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2017",
      },
    },
    build: {
      target: "es2017",
    },
    esbuild: {
      target: "es2017",
    },
    server: {
      proxy: {
        '^/MP_verify_.*\\.txt$': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          rewrite: (path) => `/functions/v1/verification-file${path}`,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("apikey", env.VITE_SUPABASE_ANON_KEY || "");
            });
          },
        },
      },
    },
  };
});
