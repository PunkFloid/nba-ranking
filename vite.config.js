import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/nba-ranking/' : '/',
  build: {
    target: 'es2022',
  },
}));
