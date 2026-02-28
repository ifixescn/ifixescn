import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

import { miaodaDevPlugin } from "miaoda-sc-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), svgr({
      svgrOptions: {
        icon: true, exportType: 'named', namedExport: 'ReactComponent', }, }), miaodaDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
        // 代理微信验证文件请求到Edge Function
        '^/MP_verify_.*\\.txt$': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          rewrite: (path) => `/functions/v1/verification-file${path}`,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // 添加API Key
              proxyReq.setHeader(
                'apikey',
                env.VITE_SUPABASE_ANON_KEY || '',
              );
            });
          },
        },
      },
    },
  };
});
