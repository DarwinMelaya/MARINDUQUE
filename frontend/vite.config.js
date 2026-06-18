import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  /**
   * Dev-only proxy target for `/api/*`.
   * - Default: local backend
   * - Override: set `VITE_API_PROXY_TARGET` in `frontend/.env`
   */
  const apiTarget = (env.VITE_API_PROXY_TARGET || "http://127.0.0.1:5000").replace(
    /\/+$/,
    ""
  );

  const apiProxy = {
    "/api": {
      target: apiTarget,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // `vite`: browser uses `/api/*` → forwarded to Express (avoids CORS in dev).
      proxy: apiProxy,
    },
    preview: {
      // `vite preview`: same proxy so `/api` works after `npm run build` without a separate reverse proxy.
      proxy: apiProxy,
    },
  };
});
