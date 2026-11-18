import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/nba-ranking/' : '/';
  const icon = Buffer.from(readFileSync(resolve(process.cwd(), 'assets/apple-touch-icon.base64'), 'utf8').trim(), 'base64');
  return {
    base,
    build: { target: 'es2022' },
    plugins: [{
      name: 'nba-home-screen-icon',
      configureServer(server) {
        server.middlewares.use('/app-icon-v1.png', (_req, res) => {
          res.setHeader('Content-Type', 'image/png');
          res.end(icon);
        });
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'app-icon-v1.png', source: icon });
      },
      transformIndexHtml() {
        return [
          { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}app-icon-v1.png` }, injectTo: 'head' },
          { tag: 'link', attrs: { rel: 'icon', type: 'image/png', href: `${base}app-icon-v1.png` }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'NBA Ranking' }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
          { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
        ];
      },
    }],
  };
});
