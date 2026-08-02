import fs from 'fs';
import path from 'path';

const file = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/data/products.ts');
let content = fs.readFileSync(file, 'utf-8');

function generateClothDescription(name, category) {
  name = name.toLowerCase();
  category = category.toLowerCase();
  
  if (category.includes('saree') || name.includes('saree')) {
    return `This exquisite saree is crafted from a premium pure silk-blend material, ensuring a smooth texture and luxurious drape. The design features traditional motifs woven intricately with shimmering zari work that runs seamlessly along the heavy border and pallu. Its rich base color and authentic traditional pattern make it a standout ethnic piece.`;
  } else if (category.includes('kurti') || name.includes('kurta')) {
    return `Tailored from a breathable cotton-silk blend material, this kurti offers a comfortable yet structured straight or flared fit. The design highlights a beautifully embroidered yoke and subtle floral or geometric patterns across the fabric. Finished with neat side slits and precise stitching, its vibrant color palette adds a lively touch to the traditional silhouette.`;
  } else if (category.includes('lehenga') || name.includes('lehenga')) {
    return `Designed with a voluminous flared skirt, this lehenga choli is fashioned from high-quality silk organza and velvet materials. The pattern showcases dense, heavy hand-embroidery adorned with sparkling sequins and golden zari work throughout the fabric. Complemented by a matching structured choli and a sheer bordered dupatta, the rich colors emphasize its detailed craftsmanship.`;
  } else if (category.includes('salwar') || name.includes('suit') || name.includes('set')) {
    return `This classic three-piece salwar suit is cut from a fluid georgette and silk-blend material that drapes flawlessly. The intricate design focuses on delicate threadwork and subtle embellishments along the neckline, perfectly matching the lightweight dupatta. The classic ethnic pattern and vibrant colors present a refined, cohesive traditional look.`;
  } else if (category.includes('maxi') || category.includes('western') || name.includes('gown')) {
    return `Crafted from lightweight premium chiffon and georgette materials, this maxi gown features an elegant A-line sweeping silhouette. The modern design is characterized by soft pleats, clean tailored seam lines, and a minimalist solid or subtly printed pattern. The rich, cohesive colors and smooth fabric texture create a sleek and sophisticated look.`;
  } else {
    return `This premium garment is skillfully tailored using high-quality blended materials that provide a smooth, comfortable fit. The design highlights clean modern cuts, precise stitching, and a classic solid or subtle printed pattern. Featuring a refined color palette, the fabric’s subtle texture brings out the minute details of its contemporary silhouette.`;
  }
}

// Regex to find each product block and replace the description field
let newContent = content.replace(/description:\s*`[^`]+`/g, (match, offset, str) => {
  // We need to extract the name and category from the surrounding context to pass to the function.
  // Instead of a global replace on just description, let's match the whole block again.
  return match; // placeholder, we will do block replacement instead
});

newContent = content.replace(/(\{\s*id:\s*'[^']+',\s*name:\s*'([^']+)',\s*price:[^\}]+category:\s*'([^']+)',[^}]+colors:\s*\[[^\]]+\]\s*\})/g, (match, p1, p2, p3) => {
  const desc = generateClothDescription(p2, p3);
  
  if (match.includes('description:')) {
    return match.replace(/description:\s*`[^`]*`/, `description: \`${desc}\``);
  } else {
    return match.replace(/(name:\s*'[^']+',)/, `$1\n    description: \`${desc}\`,`);
  }
});

fs.writeFileSync(file, newContent, 'utf-8');
console.log('Short cloth-focused descriptions updated in products.ts');
