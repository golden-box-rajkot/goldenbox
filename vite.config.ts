import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Sanitize VITE_API_BASE_URL to strip whitespace/newlines/trailing quotes or slashes
  const rawApiUrl = process.env.VITE_API_BASE_URL;
  let sanitizedApiUrl = rawApiUrl
    ? rawApiUrl
        .trim()
        .replace(/[\r\n\t]/g, '')
        .replace(/^["']|["']$/g, '')
        .trim()
        .replace(/\/+$/, '')
    : '';

  // In GitHub Pages builds (or when --base=./ is used), default to production Render URL
  const isPagesBuild =
    process.env.npm_lifecycle_event === 'build:pages' ||
    process.argv.includes('--base=./');
  if (!sanitizedApiUrl && isPagesBuild) {
    sanitizedApiUrl = 'https://goldenboxapi.onrender.com';
  }

  return {
    plugins: [react(), tailwindcss()],
    define: sanitizedApiUrl
      ? {
          'import.meta.env.VITE_API_BASE_URL': JSON.stringify(sanitizedApiUrl),
        }
      : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          admin: path.resolve(__dirname, 'admin/index.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
