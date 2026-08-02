import fs from 'fs';
import path from 'path';

// 1. First run the restore script to get the UPI buttons and grid back
const file = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/pages/ProductPage.tsx');

// I will execute the logic from restore_all_ui.mjs first to ensure clean state
const upiTarget = `                      {/* Main Continue Button */}
                      <div className="pt-4 border-t border-gray-200">
                        <motion.button`;

const upiReplacement = `                      {/* Main Continue Button */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="mb-4">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Pay Directly with UPI</p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => {
                                const upiUrl = \`phonepe://pay?pa=aanyafashions@upi&pn=Aanya+Fashions&am=\${basePrice}&cu=INR\`;
                                window.location.href = upiUrl;
                                handleCreateOrder('PhonePe');
                                setTimeout(() => setBuyNowStep('success'), 1000);
                              }}
                              className="flex items-center justify-center py-2.5 bg-[#5f259f] hover:bg-[#4b1d7d] text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm"
                            >
                              PhonePe
                            </button>
                            <button
                              onClick={() => {
                                const upiUrl = \`tez://upi/pay?pa=aanyafashions@upi&pn=Aanya+Fashions&am=\${basePrice}&cu=INR\`;
                                window.location.href = upiUrl;
                                handleCreateOrder('GPay');
                                setTimeout(() => setBuyNowStep('success'), 1000);
                              }}
                              className="flex items-center justify-center py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm"
                            >
                              GPay
                            </button>
                            <button
                              onClick={() => {
                                const upiUrl = \`paytmmp://pay?pa=aanyafashions@upi&pn=Aanya+Fashions&am=\${basePrice}&cu=INR\`;
                                window.location.href = upiUrl;
                                handleCreateOrder('Paytm');
                                setTimeout(() => setBuyNowStep('success'), 1000);
                              }}
                              className="flex items-center justify-center py-2.5 bg-[#002970] hover:bg-[#001f54] text-white rounded-xl text-[11px] font-bold transition-colors shadow-sm"
                            >
                              Paytm
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OR</span>
                          <div className="h-px bg-gray-200 flex-1"></div>
                        </div>

                        <motion.button`;

let content = fs.readFileSync(file, 'utf-8');

if (content.includes(upiTarget)) {
  content = content.replace(upiTarget, upiReplacement);
}

// 2. Attributes interface
content = content.replace(
  /interface ProductDetailsData \{\s*detailedDescription: string;/g,
  `interface ProductDetailsData {\n  attributes: { label: string; value: string }[];`
);

// 3. getProductFullDetails replacements
content = content.replace(
  /detailedDescription: `This sophisticated two-piece ensemble.*?`,/s,
  `attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Premium Silk Feel Fabric' },
        { label: 'Design', value: 'Western Coordinates' },
        { label: 'Pattern', value: 'Solid Classic' },
        { label: 'Style', value: 'Modern Elegance' }
      ],`
);
content = content.replace(
  /detailedDescription: `Exquisitely woven, this luxurious saree.*?`,/s,
  `attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Pure Silk Blend / Georgette' },
        { label: 'Design', value: 'Heavy Border & Pallu' },
        { label: 'Pattern', value: 'Zari Woven & Traditional Motifs' },
        { label: 'Style', value: 'Classic Saree Drape' }
      ],`
);
content = content.replace(
  /detailedDescription: `Tailored with impeccable precision, this elegant kurti.*?`,/s,
  `attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Cotton Silk Blend' },
        { label: 'Design', value: 'Straight / Flared Cut' },
        { label: 'Pattern', value: 'Embroidered Yoke / Floral Print' },
        { label: 'Style', value: 'Casual & Festive Wear' }
      ],`
);
content = content.replace(
  /detailedDescription: `A regal bridal and festive ensemble, this designer lehenga.*?`,/s,
  `attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Silk Organza / Velvet' },
        { label: 'Design', value: 'Flared Skirt with Dupatta' },
        { label: 'Pattern', value: 'Heavy Hand Embroidery & Zari' },
        { label: 'Style', value: 'Bridal & Festive Lehenga' }
      ],`
);
content = content.replace(
  /detailedDescription: `This three-piece salwar suit set comprises.*?`,/s,
  `attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Silk Blend / Georgette' },
        { label: 'Design', value: '3-Piece Salwar Suit' },
        { label: 'Pattern', value: 'Embroidered Neckline & Dupatta' },
        { label: 'Style', value: 'Traditional Ethnic Wear' }
      ],`
);
content = content.replace(
  /detailedDescription: `Designed with a fluid, sweeping floor-length silhouette, this maxi gown.*?`,/s,
  `attributes: [
        { label: 'Color', value: 'As per selection' },
        { label: 'Material', value: 'Premium Chiffon / Georgette' },
        { label: 'Design', value: 'A-Line Maxi Silhouette' },
        { label: 'Pattern', value: 'Solid / Subtle Embellishments' },
        { label: 'Style', value: 'Western Evening Wear' }
      ],`
);
content = content.replace(
  /detailedDescription: `Handcrafted from fine quality premium fabric.*?`,/s,
  `attributes: [
      { label: 'Color', value: 'As per selection' },
      { label: 'Material', value: 'Premium Blended Fabric' },
      { label: 'Design', value: 'Elegant Modern Cut' },
      { label: 'Pattern', value: 'Classic Solid / Print' },
      { label: 'Style', value: 'Contemporary Luxury' }
    ],`
);

// 4. Details UI (Paragraph + Grid)
const uiRegex = /\{\/\*\s*Blockquote Quote\s*\*\/\}\s*<div className="border-l-2 border-\[\#D4AF37\] pl-4 italic text-gray-700 text-lg my-4">\s*"\{product\.description \|\| 'Premium quality traditional wear crafted with elegance\.'\}"\s*<\/div>\s*\{\/\*\s*100-150 Word Detailed Description Paragraph\s*\*\/\}\s*<p className="text-gray-600 leading-relaxed text-sm my-4 font-normal">\s*\{details\.detailedDescription\}\s*<\/p>/;

const uiReplacement = `{/* Detailed Image-Based Description Paragraph */}
                    {product.description && (
                      <p className="text-gray-600 leading-relaxed text-sm my-5 font-normal text-justify">
                        {product.description}
                      </p>
                    )}

                    {/* Dynamic Product Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 my-5 p-5 rounded-2xl bg-[#FFFDF9] border border-[#F5E6BE]/60 shadow-sm">
                      <div className="col-span-full mb-1">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Product Details
                        </h4>
                      </div>
                      {/* @ts-ignore */}
                      {details.attributes && details.attributes.map((attr, idx) => (
                        <div key={idx} className="flex flex-col border-b border-[#F5E6BE]/40 pb-2">
                          <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">{attr.label}</span>
                          <span className="text-sm font-medium text-gray-800">{attr.value}</span>
                        </div>
                      ))}
                    </div>`;

content = content.replace(uiRegex, uiReplacement);


// ---- NEW REQUESTS START HERE ---- //

// 5. Breadcrumb update
const bcTarget = `{/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8 text-gray-600">
            <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
            <span>/</span>
            <Link to={\`/category/\${product.category.toLowerCase()}\`} className="hover:text-[#D4AF37]">{product.category}</Link>`;
            
const bcReplacement = `{/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8 text-gray-600">
            <Link to="/" className="hover:text-[#D4AF37]">Home</Link>
            <span>/</span>
            <Link to="/category/all" className="hover:text-[#D4AF37]">All Products</Link>
            <span>/</span>
            <Link to={\`/category/\${product.category.toLowerCase()}\`} className="hover:text-[#D4AF37]">{product.category}</Link>`;

content = content.replace(bcTarget, bcReplacement);

// 6. Saree Size removal
const sizeTarget = `              {/* Size Selector */}
              <div className="space-y-3 py-2">`;
              
const sizeReplacement = `              {/* Size Selector */}
              {!product.category.toLowerCase().includes('saree') && (
              <div className="space-y-3 py-2">`;

const qtyTarget = `              {/* Quantity */}
              <div className="flex items-center gap-4 py-2">`;

const qtyReplacement = `              )}
              {/* Quantity */}
              <div className="flex items-center gap-4 py-2">`;

if (content.includes(sizeTarget) && content.includes(qtyTarget)) {
  // We have to be careful. The size selector div ends right before Quantity.
  content = content.replace(sizeTarget, sizeReplacement);
  // Also we need to add the closing brace before quantity
  content = content.replace(qtyTarget, qtyReplacement);
}

// 7. Add to Cart -> My Wishlist
const cartBtnTarget = `<motion.button 
                  onClick={handleAddToCart} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 h-14 bg-[#FFF9E6] hover:bg-[#F5E6BE] text-[#800000] border-2 border-[#F5E6BE] rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-[#800000]" /> Add to Cart
                </motion.button>`;

const cartBtnReplacement = `<motion.button 
                  onClick={handleWishlistToggle} 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  className="flex-1 h-14 bg-[#FFF9E6] hover:bg-[#F5E6BE] text-[#800000] border-2 border-[#F5E6BE] rounded-2xl font-black text-xs tracking-[0.15em] uppercase shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-[#800000]" /> My Wishlist
                </motion.button>`;
                
content = content.replace(cartBtnTarget, cartBtnReplacement);

// 8. Add Heart icon import if not present
if (!content.includes('Heart,')) {
  content = content.replace('ShoppingBag, Truck, RotateCcw, ShieldCheck', 'ShoppingBag, Truck, RotateCcw, ShieldCheck, Heart');
}

fs.writeFileSync(file, content, 'utf-8');
console.log('ProductPage completely restored and updated cleanly.');
