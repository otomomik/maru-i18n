import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'maruI18n',
      formats: ['umd'],
      fileName: () => 'maru-i18n.umd.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});
