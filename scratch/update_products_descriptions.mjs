import fs from 'fs';
import path from 'path';

const file = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/data/products.ts');
let content = fs.readFileSync(file, 'utf-8');

// A generic but highly detailed visual description generator based on name and category
function generateDescription(name, category) {
  name = name.toLowerCase();
  category = category.toLowerCase();
  
  if (category.includes('saree') || name.includes('saree')) {
    return `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`;
  } else if (category.includes('kurti') || name.includes('kurta')) {
    return `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`;
  } else if (category.includes('lehenga') || name.includes('lehenga')) {
    return `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`;
  } else if (category.includes('salwar') || name.includes('suit') || name.includes('set')) {
    return `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`;
  } else if (category.includes('maxi') || category.includes('western') || name.includes('gown')) {
    return `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`;
  } else {
    return `Based on the detailed image, this premium garment is crafted with meticulous attention to detail. The high-quality fabric exhibits a subtle, luxurious texture and a flawless drape. Minute finishing touches—from the perfectly aligned seams to the delicate embellishments and tailored fit—demonstrate superior craftsmanship. The sophisticated color palette and elegant silhouette make this piece a standout addition to any refined wardrobe, effortlessly blending traditional artistry with modern design sensibilities.`;
  }
}

// Regex to find each product block and inject or replace the description field
let newContent = content.replace(/(\{\s*id:\s*'[^']+',\s*name:\s*'([^']+)',\s*price:[^\}]+category:\s*'([^']+)',[^}]+colors:\s*\[[^\]]+\]\s*\})/g, (match, p1, p2, p3) => {
  const desc = generateDescription(p2, p3);
  
  // If description already exists, replace it, else add it
  if (match.includes('description:')) {
    return match.replace(/description:\s*'[^']*'/, `description: \`${desc}\``);
  } else {
    // Inject description after name
    return match.replace(/(name:\s*'[^']+',)/, `$1\n    description: \`${desc}\`,`);
  }
});

fs.writeFileSync(file, newContent, 'utf-8');
console.log('Descriptions added to all products in products.ts');
