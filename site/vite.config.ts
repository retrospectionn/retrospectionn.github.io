import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * `vite preview` falls back to dist/index.html for /research (no trailing slash), which would
 * serve the Ads meta tags. Rewrite the three mode paths to their postbuild copies so preview
 * matches GitHub Pages (which redirects /research to /research/).
 */
function modePathsInPreview(): Plugin {
  return {
    name: 'mode-paths-in-preview',
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const m = req.url?.match(/^\/(ads|research|maps)\/?(\?.*)?$/);
        if (m) req.url = `/${m[1]}/index.html${m[2] ?? ''}`;
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), modePathsInPreview()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
