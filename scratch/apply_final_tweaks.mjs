import fs from 'fs';
import path from 'path';

// --- 1. Modify ProductPage.tsx ---
const productPageFile = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/pages/ProductPage.tsx');
let ppContent = fs.readFileSync(productPageFile, 'utf-8');

// Breadcrumb
const breadcrumbRegex = /\{\/\*\s*Breadcrumb\s*\*\/\}\s*<div className="flex items-center gap-2 text-sm mb-8 text-gray-600">\s*<Link to="\/" className="hover:text-\[\#D4AF37\]">Home<\/Link>\s*<span>\/<\/span>\s*<Link to=\{`\/category\/\$\{product\.category\.toLowerCase\(\)\}`\} className="hover:text-\[\#D4AF37\]">\{product\.category\}<\/Link>\s*<span>\/<\/span>\s*<span className="text-\[\#D4AF37\] truncate">\{product\.name\}<\/span>\s*<\/div>/;

const breadcrumbReplacement = `{/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8 text-gray-600">
            <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
            <span>/</span>
            <Link to="/category/all" className="hover:text-[#D4AF37]">All Products</Link>
            <span>/</span>
            <Link to={\`/category/\${product.category.toLowerCase()}\`} className="hover:text-[#D4AF37]">{product.category}</Link>
            <span>/</span>
            <span className="text-[#D4AF37] truncate">{product.name}</span>
          </div>`;

ppContent = ppContent.replace(breadcrumbRegex, breadcrumbReplacement);

// Hide Sizes for Saree
const sizeRegex = /\{\/\*\s*Size Selector\s*\*\/\}\s*<div className="space-y-3 py-2">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\*\s*Quantity\s*\*\/\}/;

ppContent = ppContent.replace(sizeRegex, (match) => {
  return `{/* Size Selector */}
              {!product.category.toLowerCase().includes('saree') && (
                ${match.replace('{/* Size Selector */}\n              ', '').replace('           {/* Quantity */}', '            {/* Quantity */}').slice(0, -29)}
              )}
              {/* Quantity */}`;
});

// Change Add to Cart to My Wishlist
const cartRegex = /<motion\.button \n\s*onClick=\{handleAddToCart\} \n\s*whileHover=\{\{ scale: 1\.02 \}\} \n\s*whileTap=\{\{ scale: 0\.98 \}\} \n\s*className="flex-1 h-14 bg-\[\#FFF9E6\] hover:bg-\[\#F5E6BE\] text-\[\#800000\] border-2 border-\[\#F5E6BE\] rounded-2xl font-black text-xs tracking-\[0\.15em\] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"\n\s*>\n\s*<ShoppingBag className="w-4 h-4 text-\[\#800000\]" \/> Add to Cart\n\s*<\/motion\.button>/;

const cartReplacement = `<motion.button 
                  onClick={handleWishlistToggle} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 h-14 bg-[#FFF9E6] hover:bg-[#F5E6BE] text-[#800000] border-2 border-[#F5E6BE] rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-[#800000]" /> My Wishlist
                </motion.button>`;

ppContent = ppContent.replace(cartRegex, cartReplacement);

// Make sure Heart is imported in ProductPage.tsx if not already
if (!ppContent.includes('Heart,')) {
  ppContent = ppContent.replace('ShoppingBag, Truck, RotateCcw, ShieldCheck', 'ShoppingBag, Truck, RotateCcw, ShieldCheck, Heart');
}

fs.writeFileSync(productPageFile, ppContent, 'utf-8');


// --- 2. Modify MotionBanner.tsx ---
const bannerFile = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/components/MotionBanner.tsx');
let mbContent = fs.readFileSync(bannerFile, 'utf-8');

mbContent = mbContent.replace(
  /backgroundSize: 'cover',\s*backgroundPosition: 'center',/g,
  `backgroundSize: 'contain',\n        backgroundPosition: 'right center',\n        backgroundColor: '#F1CBD3',`
);

fs.writeFileSync(bannerFile, mbContent, 'utf-8');

console.log('Final tweaks applied successfully.');
