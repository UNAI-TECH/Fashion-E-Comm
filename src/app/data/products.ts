import { supabase } from '../../lib/supabase';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  compare_at_price?: number;
  category: string;
  images: string[];
  image: string;
  rating: number;
  stock_quantity?: number;
  status: string;
  colors: string[];
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604176354204-926873ff34b0?q=80&w=1000&auto=format&fit=crop';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 's1',
    name: 'Royal Maroon Silk Saree',
    description: `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`,
    price: 4999,
    compare_at_price: 6999,
    originalPrice: 6999,
    category: 'Sarees',
    image: '/saree_s1.jpg',
    images: ['/saree_s1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#800000']
  },
  {
    id: 's2',
    name: 'Emerald Zari Banarasi Saree',
    description: `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`,
    price: 8499,
    compare_at_price: 12999,
    originalPrice: 12999,
    category: 'Sarees',
    image: '/saree_s2.jpg',
    images: ['/saree_s2.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#004f30']
  },
  {
    id: 's3',
    name: 'Golden Kanchipuram Silk Saree',
    description: `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`,
    price: 12999,
    compare_at_price: 18999,
    originalPrice: 18999,
    category: 'Sarees',
    image: '/saree_s3.jpg',
    images: ['/saree_s3.jpg'],
    rating: 5.0,
    status: 'Published',
    colors: ['#D4AF37']
  },
  {
    id: 's4',
    name: 'Midnight Blue Georgette Saree',
    description: `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`,
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Sarees',
    image: '/saree_s4.jpg',
    images: ['/saree_s4.jpg'],
    rating: 4.5,
    status: 'Published',
    colors: ['#000080']
  },
  {
    id: 'k1',
    name: 'Chanderi White Kurta & Pink Dupatta Set',
    description: `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`,
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Kurtis',
    image: '/kurti_k1.jpg',
    images: ['/kurti_k1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#ffffff', '#FFC0CB']
  },
  {
    id: 'k2',
    name: 'Sunshine Yellow Floral Anarkali Kurti',
    description: `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`,
    price: 2999,
    compare_at_price: 3999,
    originalPrice: 3999,
    category: 'Kurtis',
    image: '/kurti_k2.jpg',
    images: ['/kurti_k2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#ffffff', '#FFD700']
  },
  {
    id: 'k3',
    name: 'Indigo Blue Floral Georgette Anarkali',
    description: `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`,
    price: 3299,
    compare_at_price: 4499,
    originalPrice: 4499,
    category: 'Kurtis',
    image: '/kurti_k3.jpg',
    images: ['/kurti_k3.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#000080', '#ADD8E6']
  },
  {
    id: 'l1',
    name: 'Royal Chocolate Embroidered Velvet Lehenga',
    description: `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`,
    price: 18999,
    compare_at_price: 24999,
    originalPrice: 24999,
    category: 'Lehengas',
    image: '/lehenga_l1.jpg',
    images: ['/lehenga_l1.jpg'],
    rating: 5.0,
    status: 'Published',
    colors: ['#4A2E1B', '#D4AF37']
  },
  {
    id: 'l2',
    name: 'Teal Blue Heritage Zardosi Lehenga',
    description: `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`,
    price: 15999,
    compare_at_price: 21999,
    originalPrice: 21999,
    category: 'Lehengas',
    image: '/lehenga_l2.jpg',
    images: ['/lehenga_l2.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#005F73', '#D4AF37']
  },
  {
    id: 'l3',
    name: 'Blush Peach Sequin Silk Lehenga',
    description: `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`,
    price: 12999,
    compare_at_price: 17999,
    originalPrice: 17999,
    category: 'Lehengas',
    image: '/lehenga_l3.jpg',
    images: ['/lehenga_l3.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FFD1DC', '#D4AF37']
  },
  {
    id: 'l4',
    name: 'Regal Purple Floral Banarasi Lehenga',
    description: `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`,
    price: 14999,
    compare_at_price: 19999,
    originalPrice: 19999,
    category: 'Lehengas',
    image: '/lehenga_l4.jpg',
    images: ['/lehenga_l4.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#4B0082', '#D4AF37']
  },
  {
    id: 'l5',
    name: 'Pastel Paradise Dual Tone Lehenga Set',
    description: `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`,
    price: 16999,
    compare_at_price: 22999,
    originalPrice: 22999,
    category: 'Lehengas',
    image: '/lehenga_l5.jpg',
    images: ['/lehenga_l5.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#ADD8E6', '#FFB6C1']
  },
  {
    id: 'ss1',
    name: 'Lavender Blossom Patiala Suit',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Salwar Sets',
    image: '/salwar_ss1.jpg',
    images: ['/salwar_ss1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#E6E6FA', '#FFFFFF']
  },
  {
    id: 'ss2',
    name: 'Mustard Gold Silk Patiala Suit',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 4299,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Salwar Sets',
    image: '/salwar_ss2.jpg',
    images: ['/salwar_ss2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#FFD700', '#D4AF37']
  },
  {
    id: 'ss3',
    name: 'Imperial Purple Patiala Suit',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 4999,
    compare_at_price: 6999,
    originalPrice: 6999,
    category: 'Tradition',
    image: '/salwar_ss3.jpg',
    images: ['/salwar_ss3.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#800080', '#FFFFFF']
  },
  {
    id: 'ss4',
    name: 'Wine Gold Silk Straight Suit',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 3899,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Salwar Sets',
    image: '/salwar_ss4.jpg',
    images: ['/salwar_ss4.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#722F37', '#D4AF37']
  },
  {
    id: 'ss5',
    name: 'Fuchsia Pink Patiala Suit',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 4599,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Salwar Sets',
    image: '/salwar_ss5.jpg',
    images: ['/salwar_ss5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FF00FF', '#FFFFFF']
  },
  {
    id: 'w1',
    name: 'White Pleated Blouse & Brown Culottes',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Western',
    image: '/western_w1.jpg',
    images: ['/western_w1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#ffffff', '#8B4513']
  },
  {
    id: 'w2',
    name: 'Chocolate Silk Shirt & Beige Trousers',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 3999,
    compare_at_price: 5499,
    originalPrice: 5499,
    category: 'Western',
    image: '/western_w2.jpg',
    images: ['/western_w2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#5C4033', '#F5F5DC']
  },
  {
    id: 'w3',
    name: 'Indigo Floral Peplum & Jeans Set',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 2999,
    compare_at_price: 3999,
    originalPrice: 3999,
    category: 'Western',
    image: '/western_w3.jpg',
    images: ['/western_w3.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#000080', '#ADD8E6']
  },
  {
    id: 's5',
    name: 'Ruby Red Bridal Saree',
    description: `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`,
    price: 15999,
    compare_at_price: 21999,
    originalPrice: 21999,
    category: 'Sarees',
    image: '/saree_s5.jpg',
    images: ['/saree_s5.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#ff0000']
  },
  {
    id: 'k4',
    name: 'Heritage Crimson Embroidered Anarkali',
    description: `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`,
    price: 4299,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Kurtis',
    image: '/kurti_k4.jpg',
    images: ['/kurti_k4.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#800000', '#D4AF37']
  },
  {
    id: 'k5',
    name: 'Royal Lavender Sequin Georgette Kurta',
    description: `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`,
    price: 3899,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Kurtis',
    image: '/kurti_k5.jpg',
    images: ['/kurti_k5.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#E6E6FA', '#D4AF37']
  },
  {
    id: 'w4',
    name: 'Midnight Floral Double Layer Coord Set',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 4599,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Western',
    image: '/western_w4.jpg',
    images: ['/western_w4.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#000000', '#FFFFFF']
  },
  {
    id: 'w5',
    name: 'Sky Striped Shirt & Classic Denim Set',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 3299,
    compare_at_price: 4499,
    originalPrice: 4499,
    category: 'Western',
    image: '/western_w5.jpg',
    images: ['/western_w5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#87CEEB', '#ADD8E6']
  },
  {
    id: 't1',
    name: 'Festive Red & Cream Palazzo Set',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 5499,
    compare_at_price: 7999,
    originalPrice: 7999,
    category: 'Tradition',
    image: '/tradition_t1.jpg',
    images: ['/tradition_t1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#800000', '#F5F5DC']
  },
  {
    id: 't2',
    name: 'Royal Purple Banarasi Gown Set',
    description: `Based on the product image, this elegant salwar suit set features a beautifully stitched kameez with intricate detailing around the yoke and hemline. The minute threadwork and subtle sequin highlights add a touch of sophisticated glamour without being overwhelming. Paired with relaxed, perfectly draped bottoms and a diaphanous dupatta that features a delicate border, the premium fabric provides a fluid, flattering drape. The rich color palette and clean tailoring make this three-piece ensemble an impeccable choice for traditional ceremonies and festive gatherings.`,
    price: 4999,
    compare_at_price: 6999,
    originalPrice: 6999,
    category: 'Salwar Sets',
    image: '/tradition_t2.jpg',
    images: ['/tradition_t2.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#800080', '#D4AF37']
  },
  {
    id: 't3',
    name: 'Elegance Crimson Silk Lehenga Choli',
    description: `The visual details of this designer lehenga are truly breathtaking. The flared skirt boasts a dramatic, voluminous silhouette, heavily encrusted with fine hand-embroidery, sequins, and zari work that catch the light at every angle. The matching choli (blouse) is intricately detailed with precision stitching along the neckline and sleeves, offering a structured, flattering fit. Accompanied by a sheer, lightweight dupatta with a scalloped or embellished border, the entire ensemble exudes bridal and festive luxury, showcasing masterful craftsmanship in every single thread.`,
    price: 11999,
    compare_at_price: 15999,
    originalPrice: 15999,
    category: 'Tradition',
    image: '/tradition_t3.jpg',
    images: ['/tradition_t3.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#E60026', '#FFFDD0']
  },
  {
    id: 't4',
    name: 'Mint Grey Embroidered Kurta Set',
    description: `As seen in the imagery, this beautifully tailored kurti features a sophisticated neckline adorned with dense, precise embroidery that immediately catches the eye. The fabric, a soft and breathable cotton-silk blend, falls gracefully into a comfortable yet structured silhouette. Minute details include delicately finished sleeve cuffs, perfectly aligned side slits, and subtle embellishments or prints that add depth to the design. The overall pattern is carefully scaled to flatter the wearer, making this a versatile piece that easily transitions from festive daytime gatherings to elegant evening events.`,
    price: 4599,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Tradition',
    image: '/tradition_t4.jpg',
    images: ['/tradition_t4.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#C0C0C0', '#D4AF37']
  },
  {
    id: 't5',
    name: 'Grace Olive Green & Plum Half Saree',
    description: `Based on the product image, this exquisite saree drapes beautifully, revealing minute details of its premium weave. The rich base color is elevated by intricate, shimmering zari work that runs continuously along the heavily embellished border and spectacular pallu. A closer look shows the subtle texture of the pure silk-blend fabric which offers a luminous sheen under lighting. The meticulously crafted traditional motifs—whether floral, paisley, or geometric—stand out sharply against the smooth fabric, giving this piece a timeless, royal elegance perfect for grand occasions.`,
    price: 7999,
    compare_at_price: 9999,
    originalPrice: 9999,
    category: 'Tradition',
    image: '/tradition_t5.jpg',
    images: ['/tradition_t5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#556B2F', '#4B0082']
  },
  {
    id: 'mx1',
    name: 'Sunshine Yellow Chiffon Maxi',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 3499,
    compare_at_price: 4999,
    originalPrice: 4999,
    category: 'Maxi',
    image: '/maxi_mx1.jpg',
    images: ['/maxi_mx1.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FFD700']
  },
  {
    id: 'mx2',
    name: 'Chocolate Brown Resort Cotton Maxi',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 2899,
    compare_at_price: 3999,
    originalPrice: 3999,
    category: 'Maxi',
    image: '/maxi_mx2.jpg',
    images: ['/maxi_mx2.jpg'],
    rating: 4.6,
    status: 'Published',
    colors: ['#8B4513']
  },
  {
    id: 'mx3',
    name: 'Blossom Pink Ruffled Maxi',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 3199,
    compare_at_price: 4499,
    originalPrice: 4499,
    category: 'Maxi',
    image: '/maxi_mx3.jpg',
    images: ['/maxi_mx3.jpg'],
    rating: 4.7,
    status: 'Published',
    colors: ['#FFC0CB']
  },
  {
    id: 'mx4',
    name: 'Royal Purple Smocked Maxi',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 3999,
    compare_at_price: 5499,
    originalPrice: 5499,
    category: 'Maxi',
    image: '/maxi_mx4.jpg',
    images: ['/maxi_mx4.jpg'],
    rating: 4.9,
    status: 'Published',
    colors: ['#800080']
  },
  {
    id: 'mx5',
    name: 'Vintage Rose Organza Maxi',
    description: `The product image highlights the sweeping, fluid elegance of this modern gown. Crafted from lightweight, ethereal fabric, the A-line silhouette cascades beautifully to the floor, featuring subtle pleats that create graceful movement. Minute details include a finely structured bodice with clean, modern seam lines, and perhaps a delicate back closure or subtle embellishment at the waist. The solid or subtly patterned fabric boasts a soft, luxurious texture, delivering a contemporary and highly sophisticated aesthetic ideal for evening soirées and formal events.`,
    price: 4299,
    compare_at_price: 5999,
    originalPrice: 5999,
    category: 'Maxi',
    image: '/maxi_mx5.jpg',
    images: ['/maxi_mx5.jpg'],
    rating: 4.8,
    status: 'Published',
    colors: ['#FFF0F5']
  }
];

export async function fetchProducts(category?: string) {
  // Always use MOCK_PRODUCTS to keep exactly 5 items per collection with their local images
  let fetched: Product[] = MOCK_PRODUCTS;

  if (category && category !== 'all') {
    const rawTarget = category.toLowerCase().replace(/-/g, ' ');
    
    if (rawTarget === 'trending') {
      return [...fetched].filter(p => (p.rating || 0) >= 4.8).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    let targetStem = rawTarget;
    if (targetStem.endsWith('es')) targetStem = targetStem.slice(0, -2);
    else if (targetStem.endsWith('s') && targetStem.length > 3) targetStem = targetStem.slice(0, -1);

    return fetched.filter(p => {
      const pCat = (p.category || '').toLowerCase().replace(/-/g, ' ');
      return pCat === rawTarget || pCat === targetStem || pCat.replace(/\s+/g, '') === rawTarget.replace(/\s+/g, '');
    }).slice(0, 5); // Return only 5 items per collection
  }

  return fetched;
}
