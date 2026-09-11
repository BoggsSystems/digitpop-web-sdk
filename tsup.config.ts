import { defineConfig } from 'tsup';

export default defineConfig([
  // Core ESM & CJS + React export
  {
    entry: {
      index: 'src/index.ts',
      'react/index': 'src/react/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    external: ['react', 'react-dom'],
  },
  // Global Browser CDN Bundle (IIFE)
  {
    entry: {
      'digitpop-sdk.global': 'src/index.ts',
    },
    format: ['iife'],
    globalName: 'DigitPopSDK',
    dts: false,
    clean: false,
    sourcemap: true,
    minify: true,
  },
]);
