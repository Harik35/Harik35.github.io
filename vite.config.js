import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig({
  build: { rollupOptions: { input: { portfolio: resolve('index.html'), world: resolve('world/index.html') } } },
  plugins: [{
    name: 'preserve-static-portfolio-assets',
    closeBundle() {
      for (const file of ['main.js', 'profile.png', 'Harikrishnan_PM_EY_GDS (1).pdf']) {
        copyFileSync(resolve(file), resolve('dist', file));
      }
    }
  }]
});
