import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Instagram, ExternalLink } from 'lucide-react';

interface InstagramPost {
  id: string;
  shortcode: string;
  url: string;
  caption?: string;
  localImage?: string;
  remoteImage?: string;
  likes?: number;
}

const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/aanya.style?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==';

const DEFAULT_POSTS: InstagramPost[] = [
  {
    id: '3872854740112056838',
    shortcode: 'DW_JN3rESIG',
    url: 'https://www.instagram.com/p/DW_JN3rESIG/',
    localImage: '/instagram/post_DW_JN3rESIG.jpg',
  }
];

export function InstagramGallery() {
  const [posts, setPosts] = useState<InstagramPost[]>(DEFAULT_POSTS);

  useEffect(() => {
    async function loadCachedPosts() {
      try {
        const res = await fetch('/instagram/posts.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setPosts(data);
          }
        }
      } catch (err) {
        console.warn('Could not read cached instagram posts:', err);
      }
    }

    loadCachedPosts();
  }, []);

  return (
    <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-white to-[#FFF0F5] relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <div className="inline-block mb-3">
            <Instagram className="w-10 h-10 text-[#D4AF37]" />
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2.5 text-[#1A1A1A] tracking-tight font-medium">
            Follow Our Style
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base mb-5">
            Join our community and get daily inspiration
          </p>

          {/* Social Handle */}
          <motion.a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#800000] text-white rounded-full shadow-md font-bold text-sm hover:shadow-lg transition-all"
          >
            <span>@aanya.style</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </motion.a>
        </motion.div>

        {/* Small Image Display */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 max-w-4xl mx-auto">
          {posts.map((post, index) => (
            <motion.a
              key={post.id || post.shortcode || index}
              href={post.url || INSTAGRAM_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer border border-[#FFD6E8]/60 bg-white flex-shrink-0"
            >
              <img
                src={post.localImage || post.remoteImage || '/instagram/post_1.jpg'}
                alt="Instagram post"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
              />

              {/* Subtle hover overlay with Instagram icon */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#800000] shadow-md group-hover:scale-110 transition-transform">
                  <Instagram className="w-5 h-5 text-[#E1306C]" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>

      </div>
    </section>
  );
}
