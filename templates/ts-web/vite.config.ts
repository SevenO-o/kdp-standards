import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { localGateway } from "./scripts/local-gateway.js";

export default defineConfig({
  root: "web",
  base: "./",
  plugins: [react(), tailwindcss(), { name: "kdp-tool-gateway", configureServer(server) { server.middlewares.use(localGateway({origin:"http://127.0.0.1:3000"})); } }],
  resolve: { alias: { "@": fileURLToPath(new URL("./web", import.meta.url)) } },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: { outDir: "../dist/web", emptyOutDir: true },
});
