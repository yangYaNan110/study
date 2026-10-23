import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    strictPort: true,
  },
  build: {
    outDir: "my-dist",
    sourcemap: true,

    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },

    rolldownOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});
