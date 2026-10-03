import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // the felt engine lives outside this app (felt-atelier/src) and imports three by name:
      // point those specifiers at this app's copies so the build works from a clean checkout.
      { find: /^three$/, replacement: path.resolve(__dirname, "node_modules/three/build/three.module.js") },
      { find: /^three\/addons\/(.*)$/, replacement: path.resolve(__dirname, "node_modules/three/examples/jsm/$1") },
      { find: /^delaunator$/, replacement: path.resolve(__dirname, "node_modules/delaunator/index.js") },
    ],
  },
});
