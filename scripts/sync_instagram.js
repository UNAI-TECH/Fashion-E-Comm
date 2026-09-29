import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const instagramDir = path.join(rootDir, 'public/instagram');

function pkToShortcode(pkStr) {
  let pk = BigInt(pkStr);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let shortcode = '';
  while (pk > 0n) {
    const rem = Number(pk % 64n);
    pk = pk / 64n;
    shortcode = alphabet[rem] + shortcode;
  }
  return shortcode;
}

export async function fetchInstagramPosts() {
  if (!fs.existsSync(instagramDir)) {
    fs.mkdirSync(instagramDir, { recursive: true });
  }

  const postsJsonPath = path.join(instagramDir, 'posts.json');

  return new Promise((resolve) => {
    const req = https.get('https://www.instagram.com/aanya.style/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const scripts = [...data.matchAll(/<script type=\"application\/json\"[^>]*>(.*?)<\/script>/gs)];
          let posts = [];

          for (const s of scripts) {
            if (s[1].includes('image_versions2')) {
              try {
                const json = JSON.parse(s[1]);
                function findNodes(obj) {
                  if (!obj || typeof obj !== 'object') return [];
                  let results = [];
                  if (Array.isArray(obj)) {
                    for (const item of obj) results = results.concat(findNodes(item));
                  } else {
                    if (obj.pk && obj.image_versions2) {
                      results.push(obj);
                    }
                    for (const k of Object.keys(obj)) {
                      results = results.concat(findNodes(obj[k]));
                    }
                  }
                  return results;
                }

                const nodes = findNodes(json);
                for (const node of nodes) {
                  const pk = node.pk;
                  const shortcode = pkToShortcode(pk);
                  const candidates = node.image_versions2?.candidates || [];
                  const bestImage = candidates[0]?.url || '';
                  const caption = node.caption?.text || node.caption || 'Aanya Fashions';
                  posts.push({
                    id: String(pk),
                    shortcode,
                    url: `https://www.instagram.com/p/${shortcode}/`,
                    caption: typeof caption === 'string' ? caption : '',
                    remoteImage: bestImage,
                    localImage: `/instagram/post_${shortcode}.jpg`,
                    likes: node.like_count || 32,
                  });
                }
              } catch (e) {
                // Ignore parse errors on other scripts
              }
            }
          }

          if (posts.length > 0) {
            for (const p of posts) {
              if (p.remoteImage) {
                const localFilePath = path.join(instagramDir, `post_${p.shortcode}.jpg`);
                if (!fs.existsSync(localFilePath) || fs.statSync(localFilePath).size < 1000) {
                  await new Promise((imgDone) => {
                    https.get(p.remoteImage, (imgRes) => {
                      const fileStream = fs.createWriteStream(localFilePath);
                      imgRes.pipe(fileStream);
                      fileStream.on('finish', () => {
                        fileStream.close();
                        imgDone();
                      });
                    }).on('error', imgDone);
                  });
                }
              }
            }

            const newContent = JSON.stringify(posts, null, 2);
            let shouldWrite = true;
            if (fs.existsSync(postsJsonPath)) {
              try {
                const oldPosts = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
                if (Array.isArray(oldPosts) && oldPosts.length === posts.length && oldPosts[0]?.id === posts[0]?.id) {
                  shouldWrite = false;
                }
              } catch (_) {}
            }

            if (shouldWrite) {
              fs.writeFileSync(postsJsonPath, newContent);
              console.log(`[Instagram Sync] Successfully updated ${posts.length} posts from @aanya.style`);
            } else {
              console.log(`[Instagram Sync] Posts already up to date (${posts.length} posts).`);
            }
            return resolve({ success: true, posts });
          } else {
            // Read existing if any
            if (fs.existsSync(postsJsonPath)) {
              const existing = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
              return resolve({ success: true, posts: existing, notice: 'Used cached posts' });
            }
            resolve({ success: false, posts: [] });
          }
        } catch (err) {
          console.error('[Instagram Sync Error]', err);
          if (fs.existsSync(postsJsonPath)) {
            const existing = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
            return resolve({ success: true, posts: existing, fallback: true });
          }
          resolve({ success: false, posts: [] });
        }
      });
    });

    req.on('error', (err) => {
      console.warn('[Instagram Network Warning]', err.message);
      if (fs.existsSync(postsJsonPath)) {
        const existing = JSON.parse(fs.readFileSync(postsJsonPath, 'utf-8'));
        return resolve({ success: true, posts: existing, fallback: true });
      }
      resolve({ success: false, posts: [] });
    });
  });
}

// If executed directly from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchInstagramPosts().then(res => {
    console.log('Sync result:', res);
  });
}
