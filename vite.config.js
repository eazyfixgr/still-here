import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH || '/still-here/',
  build: {
    target: 'es2022',
  },
});
