import fs from 'fs';
import path from 'path';

const file = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/pages/ProductPage.tsx');
let content = fs.readFileSync(file, 'utf-8');

// 1. Update ProductDetailsData interface
content = content.replace(
  /interface ProductDetailsData \{\s*detailedDescription: string;/g,
  `interface ProductDetailsData {\n  attributes: { label: string; value: string }[];`
);

// 2. Replace the detailedDescription fields in getProductFullDetails with attributes
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

// 3. Replace the paragraph rendering with a details grid
const renderTarget = `{/* 100-150 Word Detailed Description Paragraph */}
                    <p className="text-gray-600 leading-relaxed text-sm my-4 font-normal">
                      {details.detailedDescription}
                    </p>`;

const renderReplacement = `{/* Dynamic Product Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 my-5 p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                      <div className="col-span-full mb-1">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#800000] flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Product Details
                        </h4>
                      </div>
                      {details.attributes.map((attr, idx) => (
                        <div key={idx} className="flex flex-col border-b border-gray-200 pb-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{attr.label}</span>
                          <span className="text-sm font-semibold text-gray-800">{attr.value}</span>
                        </div>
                      ))}
                    </div>`;

content = content.replace(renderTarget, renderReplacement);

fs.writeFileSync(file, content, 'utf-8');
console.log('ProductPage details updated successfully');
