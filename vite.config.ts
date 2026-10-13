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

function bannersPlugin() {
  return {
    name: 'banners-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith('/api/banners')) {
          const urlObj = new URL(req.url, 'http://localhost');
          res.setHeader('Content-Type', 'application/json');

          const getBody = () => new Promise<any>((resolve) => {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try { resolve(JSON.parse(body)); } catch { resolve({}); }
            });
          });

          try {
            const { getBanners, saveBannerRecord, deleteBannerRecord, resetBanners } = await import('./scripts/bannersApi.js');

            if (req.method === 'GET') {
              const activeOnly = urlObj.searchParams.get('active') === 'true';
              const banners = await getBanners(activeOnly);
              res.end(JSON.stringify({ success: true, data: banners }));
              return;
            }

            if (req.method === 'POST') {
              if (urlObj.pathname === '/api/banners/reset') {
                const banners = await resetBanners();
                res.end(JSON.stringify({ success: true, data: banners }));
                return;
              }
              const body = await getBody();
              const saved = await saveBannerRecord(body);
              res.end(JSON.stringify({ success: true, data: saved }));
              return;
            }

            if (req.method === 'DELETE') {
              const id = urlObj.searchParams.get('id') || urlObj.pathname.split('/').filter(Boolean).pop();
              const imageUrl = urlObj.searchParams.get('image_url') || '';
              const title = urlObj.searchParams.get('title') || '';
              if (id && id !== 'banners') {
                await deleteBannerRecord(id, { image_url: imageUrl, title });
                res.end(JSON.stringify({ success: true, id }));
                return;
              }
            }
          } catch (e: any) {
            console.error('[bannersPlugin error]:', e);
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: e?.message || 'Failed operation' }));
            return;
          }
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
    bannersPlugin(),
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
