import { defineConfig } from 'vite';
import { resolve, extname, dirname } from 'path';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamically discover all HTML files in the root folder as entry points
const getHtmlInputs = () => {
  const files = readdirSync(__dirname);
  const inputs = {};
  for (const file of files) {
    if (file.endsWith('.html')) {
      const name = file.substring(0, file.length - 5);
      inputs[name] = resolve(__dirname, file);
    }
  }
  return inputs;
};

export default defineConfig({
  build: {
    rollupOptions: {
      input: getHtmlInputs(),
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4242',
        changeOrigin: true,
      },
    },
  },
});