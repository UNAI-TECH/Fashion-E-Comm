import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function instagramPlugin() {
  return {
    name: 'instagram-sync-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/instagram/sync' || req.url === '/api/instagram/posts') {
          try {
            const { fetchInstagramPosts } = await import('./scripts/sync_instagram.js');
            const result = await fetchInstagramPosts();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e?.message || 'Failed to sync' }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    instagramPlugin(),
  ],
  server: {
    watch: {
      ignored: ['**/public/instagram/**', '**/scripts/**'],
    },
  },
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
