-- =========================================================================
-- SEED MORE PRODUCTS (V3) - 30 ADDITIONAL UNIQUE PRODUCTS
-- =========================================================================

-- 1. Insert Products for 'Salwar Sets' category
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Emerald Silk Salwar Suit', 'Rich emerald green silk with heavy gold embroidery.', 5900, 8500, 'Salwar Sets', array['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080'], 20, 'Published'),
('Ivory Chikankari Set', 'Handcrafted Lucknowi chikankari on pure georgette.', 4200, 6000, 'Salwar Sets', array['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080'], 15, 'Published'),
('Blush Pink Anarkali', 'Floor-length anarkali with delicate thread work.', 7500, 11000, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080'], 12, 'Published'),
('Mustard Palazzo Suit', 'Contemporary palazzo set with mirror work detailing.', 4800, 6500, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080'], 25, 'Published'),
('Royal Blue Sharara Set', 'Vibrant blue sharara with sequin borders.', 6200, 8900, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080'], 10, 'Published'),
('Midnight Black Patiala', 'Traditional Patiala suit with phulkari dupatta.', 3500, 5200, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249721-92912d5825e2?q=80&w=1080'], 30, 'Published'),
('Mint Green Straight Fit', 'Elegent straight-cut suit for formal wear.', 3900, 5500, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249414-b49e06173004?q=80&w=1080'], 40, 'Published'),
('Deep Red Velvet Suit', 'Luxurious velvet set for winter weddings.', 8900, 12500, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080'], 8, 'Published'),
('Lemon Yellow Cotton Set', 'Breathable cotton with floral block prints.', 2800, 4200, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080'], 50, 'Published'),
('Teal Blue Angrakha', 'Traditional angrakha style with side tassels.', 5400, 7800, 'Salwar Sets', array['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080'], 18, 'Published')
on conflict (name) do nothing;

-- 2. Insert more products for 'Sarees'
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Golden Tissue Saree', 'Exquisite gold tissue with scalloped borders.', 12500, 18000, 'Sarees', array['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080'], 10, 'Published'),
('Ruby Red Bridal Saree', 'Heavy bridal silk with intricate stone work.', 25000, 35000, 'Sarees', array['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080'], 5, 'Published'),
('Pastel Lilac Organza', 'Modern organza with hand-painted florals.', 6800, 9500, 'Sarees', array['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080'], 15, 'Published'),
('Copper Zari Banarasi', 'Antique copper zari on charcoal grey silk.', 18500, 24000, 'Sarees', array['https://images.unsplash.com/photo-1714023249661-8b9cad0e1f20?q=80&w=1080'], 7, 'Published'),
('Champagne Shimmer Saree', 'Contemporary sequin saree for evening galas.', 9500, 14000, 'Sarees', array['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080'], 12, 'Published')
on conflict (name) do nothing;

-- 3. Insert more products for 'Kurtis'
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Peplum Style Kurti', 'Contemporary peplum cut with dhoti pants.', 3800, 5500, 'Kurtis', array['https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080'], 25, 'Published'),
('Boho Fusion Kurti', 'Ethnic prints with a bohemian tassels.', 2400, 3600, 'Kurtis', array['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080'], 40, 'Published'),
('Asymmetric Hem Kurti', 'Modern high-low hem in vibrant orange.', 2900, 4200, 'Kurtis', array['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080'], 30, 'Published'),
('Denim Ethnic Kurti', 'Unique fusion of denim fabric and embroidery.', 3200, 4800, 'Kurtis', array['https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080'], 20, 'Published'),
('Mirror Work Cape Kurti', 'Elegant cape overlay with mirror detailing.', 5600, 7900, 'Kurtis', array['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080'], 15, 'Published')
on conflict (name) do nothing;

-- 4. Insert more products for 'Lehengas'
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Lavender Ombre Lehenga', 'Beautiful ombre shading on fine tulle.', 22000, 32000, 'Lehengas', array['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080'], 8, 'Published'),
('Gota Patti Lehenga', 'Traditional Jaipur gota patti on bright yellow.', 18000, 26000, 'Lehengas', array['https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080'], 12, 'Published'),
('Navy Blue Velvet Lehenga', 'Regal velvet with silver metallic work.', 35000, 48000, 'Lehengas', array['https://images.unsplash.com/photo-1714023249219-160c234ded01?q=80&w=1080'], 5, 'Published'),
('Peach Pearl Lehenga', 'Delicate pearl and crystal embroidery.', 28500, 39000, 'Lehengas', array['https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080'], 10, 'Published'),
('Mirror Mosaic Lehenga', 'Stunning mosaic mirror work for sangeet.', 15000, 22000, 'Lehengas', array['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080'], 20, 'Published')
on conflict (name) do nothing;

-- 5. Insert more products for 'Western'
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Metallic Pleated Gown', 'Shimmering metallic fabric with micro-pleats.', 8500, 12000, 'Western', array['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080'], 15, 'Published'),
('Satin Slip Dress', 'Elegant crimson satin with adjustable straps.', 4200, 6500, 'Western', array['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080'], 25, 'Published'),
('Tailored Tuxedo Jumpsuit', 'Sophisticated one-piece for formal events.', 11000, 16000, 'Western', array['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080'], 10, 'Published'),
('Lace Overlay Blouse', 'Delicate white lace for a romantic look.', 3200, 4800, 'Western', array['https://images.unsplash.com/photo-1714023249661-8b9cad0e1f20?q=80&w=1080'], 40, 'Published'),
('Frou Frou Tulle Skirt', 'Dramatic layered tulle skirt in blush.', 5900, 8500, 'Western', array['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080'], 20, 'Published')
on conflict (name) do nothing;
