-- =========================================================================
-- SEED PRODUCTS (V2) - 15 PRODUCTS PER CATEGORY
-- =========================================================================

-- 1. Ensure category column exists in products table
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='category') then
        alter table public.products add column category text;
    end if;
end $$;

-- 2. Clear existing products (Optional, but useful for a clean seed)
-- delete from public.products;

-- 3. Insert Products for 'saree' category
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Maroon Silk Saree', 'Luxurious silk with gold zari.', 2999, 4999, 'saree', array['https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=1080'], 50, 'Published'),
('Handwoven Banarasi Saree', 'Authentic Banarasi silk.', 8999, 12999, 'saree', array['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080'], 30, 'Published'),
('Designer Zari Saree', 'Intricate zari work on soft georgette.', 5499, 7999, 'saree', array['https://images.unsplash.com/photo-1762708592720-92912d5825e2?q=80&w=1080'], 25, 'Published'),
('Emerald Green Kanchipuram Saree', 'Traditional Kanchipuram silk.', 6999, 9999, 'saree', array['https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=1080'], 20, 'Published'),
('Royal Blue Chiffon Saree', 'Lightweight and elegant.', 1999, 2999, 'saree', array['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080'], 40, 'Published'),
('Yellow Cotton Jamdani Saree', 'Breathable cotton with floral motifs.', 3499, 4999, 'saree', array['https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080'], 15, 'Published'),
('Black Net Party Saree', 'Glamorous net saree with sequins.', 4599, 6499, 'saree', array['https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080'], 22, 'Published'),
('Peach Organza Saree', 'Modern floral print on organza.', 3299, 4499, 'saree', array['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080'], 18, 'Published'),
('Red Wedding Saree', 'Heavy bridal embroidery.', 14999, 19999, 'saree', array['https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72?q=80&w=1080'], 10, 'Published'),
('Ivory Tissue Saree', 'Shimmering tissue silk.', 4299, 5999, 'saree', array['https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080'], 14, 'Published'),
('Turquoise Tussar Silk Saree', 'Wild silk with natural texture.', 5999, 8499, 'saree', array['https://images.unsplash.com/photo-1583391733956-6c7827602521?q=80&w=1080'], 12, 'Published'),
('Purple Pashmina Saree', 'Soft wool-blend for winter.', 7499, 10999, 'saree', array['https://images.unsplash.com/photo-1590736962305-654efad8409e?q=80&w=1080'], 8, 'Published'),
('Grey Linen Saree', 'Minimalist linen with silver border.', 2799, 3999, 'saree', array['https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=1080'], 35, 'Published'),
('Cyan Mysore Silk Saree', 'Soft and smooth Mysore silk.', 4999, 6999, 'saree', array['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1080'], 16, 'Published'),
('Beige Patola Saree', 'Traditional double ikat weave.', 12999, 17999, 'saree', array['https://images.unsplash.com/photo-1610030469668-935102a9e52c?q=80&w=1080'], 5, 'Published')
on conflict (name) do nothing;

-- 4. Insert Products for 'kurti' category
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Chic Pink Kurti', 'Soft cotton with delicate embroidery.', 999, 1499, 'kurti', array['https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080'], 60, 'Published'),
('White Chikankari Kurti', 'Traditional Lucknowi work.', 1499, 1999, 'kurti', array['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080'], 45, 'Published'),
('Indigo Anarkali Kurti', 'Flowy cotton with block print.', 2499, 3499, 'kurti', array['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080'], 30, 'Published'),
('Mirror Work Short Kurti', 'Bright colors with mirror accents.', 1299, 1799, 'kurti', array['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080'], 25, 'Published'),
('Pastel Yellow Kurta Set', 'Includes matching dupatta and pants.', 3499, 4999, 'kurti', array['https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080'], 20, 'Published'),
('Georgette Party Kurti', 'Shimmering georgette with sequins.', 1899, 2599, 'kurti', array['https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080'], 40, 'Published'),
('Floral Print Daily Kurti', 'Breathable rayon for summer.', 799, 1199, 'kurti', array['https://images.unsplash.com/photo-1610030469661-8b9cad0e1f20?q=80&w=1080'], 100, 'Published'),
('Velvet Winter Kurti', 'Warm velvet with minimal border.', 2999, 3999, 'kurti', array['https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1080'], 15, 'Published'),
('Black High-Low Kurti', 'Contemporary silhouette.', 1199, 1699, 'kurti', array['https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=1080'], 50, 'Published'),
('Turquoise Embroidered Kurti', 'Heavy embroidery on neckline.', 1699, 2299, 'kurti', array['https://images.unsplash.com/photo-1621285853634-713b8dd6b5ee?q=80&w=1080'], 35, 'Published'),
('Slit Cut Designer Kurti', 'Side slits with contrast fabric.', 2199, 2999, 'kurti', array['https://images.unsplash.com/photo-16101235312c7-2c1b47214739?q=80&w=1080'], 22, 'Published'),
('Grey Office Kurti', 'Professional and comfortable.', 899, 1299, 'kurti', array['https://images.unsplash.com/photo-1610123531405-1a2b3c4d5e6f?q=80&w=1080'], 70, 'Published'),
('Red Rayon Wrap Kurti', 'Adjustable waist tie.', 1099, 1599, 'kurti', array['https://images.unsplash.com/photo-1610123531589-1a2b3c4d5e6f?q=80&w=1080'], 40, 'Published'),
('Mustard Front Slit Kurti', 'Paired with white trousers.', 1399, 1899, 'kurti', array['https://images.unsplash.com/photo-1610123531765-1a2b3c4d5e6f?q=80&w=1080'], 28, 'Published'),
('Lime Green Tunic', 'Short kurti for casual outings.', 699, 999, 'kurti', array['https://images.unsplash.com/photo-1610123531876-1a2b3c4d5e6f?q=80&w=1080'], 80, 'Published')
on conflict (name) do nothing;

-- 5. Insert Products for 'lehenga' category
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Designer Floral Lehenga', 'Perfect for Sangeet or Engagement.', 14999, 19999, 'lehenga', array['https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72?q=80&w=1080'], 15, 'Published'),
('Bridal Red Velvet Lehenga', 'Heavy gold embroidery for the bride.', 45999, 59999, 'lehenga', array['https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=1080'], 5, 'Published'),
('Pastel Pink Silk Lehenga', 'Elegant and minimal for bridesmaids.', 9999, 14999, 'lehenga', array['https://images.unsplash.com/photo-1767955694884-d4bf352c23c2?q=80&w=1080'], 18, 'Published'),
('Royal Blue Mirror Lehenga', 'Sparkling mirror work on heavy georgette.', 12499, 17999, 'lehenga', array['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080'], 12, 'Published'),
('Mustard Yellow Haldi Lehenga', 'Paired with a gota patti blouse.', 6999, 9999, 'lehenga', array['https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080'], 25, 'Published'),
('Emerald Green Silk Lehenga', 'Rich silk fabric with stone work.', 18999, 24999, 'lehenga', array['https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080'], 8, 'Published'),
('White Lace Reception Lehenga', 'Modern silhouette with lace details.', 8499, 11999, 'lehenga', array['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080'], 14, 'Published'),
('Grey Sequence Night Lehenga', 'Dazzling sequins for a night out.', 7599, 10499, 'lehenga', array['https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080'], 20, 'Published'),
('Yellow Bandhani Lehenga', 'Traditional Rajasthani print.', 5499, 7499, 'lehenga', array['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080'], 30, 'Published'),
('Purple Organza Lehenga', 'Floral printed on light organza.', 4999, 6999, 'lehenga', array['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080'], 22, 'Published'),
('Turquoise Banarasi Lehenga', 'Classic Banarasi weave.', 10999, 15499, 'lehenga', array['https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?q=80&w=1080'], 10, 'Published'),
('Black Velvet Fusion Lehenga', 'Western look with traditional touch.', 13999, 18999, 'lehenga', array['https://images.unsplash.com/photo-1759840278381-bf7d5e332050?q=80&w=1080'], 7, 'Published'),
('Maroon Art Silk Lehenga', 'Budget friendly party wear.', 3999, 5499, 'lehenga', array['https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080'], 40, 'Published'),
('Teal Embroidered Lehenga', 'Intricate thread work on teal base.', 11499, 15999, 'lehenga', array['https://images.unsplash.com/photo-1756488775431-80410a56f947?q=80&w=1080'], 11, 'Published'),
('Beige Gold Tissue Lehenga', 'Shimmering gold tissue fabric.', 16499, 21999, 'lehenga', array['https://images.unsplash.com/photo-1756488775432-80410a56f947?q=80&w=1080'], 6, 'Published')
on conflict (name) do nothing;

-- 6. Insert Products for 'western' category
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status)
values 
('Black Satin Party Dress', 'Sleek and elegant evening wear.', 2499, 3999, 'western', array['https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?q=80&w=1080'], 35, 'Published'),
('Beige Wrap Maxi Dress', 'Versatile dress for brunch or beach.', 1899, 2599, 'western', array['https://images.unsplash.com/photo-1759840278381-bf7d5e332050?q=80&w=1080'], 40, 'Published'),
('Floral Summer Sundress', 'Lightweight cotton with vibrant print.', 1299, 1799, 'western', array['https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080'], 55, 'Published'),
('White Eyelet Midi Dress', 'Romantic mid-length dress.', 2199, 2999, 'western', array['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080'], 28, 'Published'),
('Red Off-Shoulder Gown', 'Stunning look for formal events.', 4999, 6999, 'western', array['https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080'], 15, 'Published'),
('Polka Dot Retro Dress', 'Vintage inspired style.', 1599, 2199, 'western', array['https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080'], 32, 'Published'),
('Denim Jacket with Embroidery', 'Custom embroidery on premium denim.', 2799, 3499, 'western', array['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080'], 45, 'Published'),
('High Waisted Trousers', 'Classic fit for professional look.', 1499, 1999, 'western', array['https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080'], 60, 'Published'),
('Emerald Green Blazer', 'Tailored blazer for office or night.', 3299, 4499, 'western', array['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080'], 12, 'Published'),
('Silk Slip Top', 'Luxurious base layer in champagne.', 1099, 1599, 'western', array['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080'], 50, 'Published'),
('Navy Blue Jumpsuit', 'One piece outfit with belted waist.', 2499, 3299, 'western', array['https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080'], 20, 'Published'),
('Grey Knit Sweater', 'Soft wool-blend for cooler days.', 1299, 1799, 'western', array['https://images.unsplash.com/photo-1760287364219-160c234ded01?q=80&w=1080'], 40, 'Published'),
('Floral Plisse Skirt', 'Elegant pleated skirt.', 1199, 1699, 'western', array['https://images.unsplash.com/photo-1760287364219-160c234ded02?q=80&w=1080'], 45, 'Published'),
('Beige Trench Coat', 'Timeless outer layer.', 5999, 7999, 'western', array['https://images.unsplash.com/photo-1760287364219-160c234ded03?q=80&w=1080'], 10, 'Published'),
('Striped Cotton Shirt', 'Breathable and classic.', 899, 1199, 'western', array['https://images.unsplash.com/photo-1760287364219-160c234ded04?q=80&w=1080'], 75, 'Published')
on conflict (name) do nothing;
