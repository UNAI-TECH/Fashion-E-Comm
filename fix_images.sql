-- Overhaul product images with 60 unique entries (15 per category)
-- Saree, Kurti, Lehenga, Western

-- Clear existing products first to avoid constraint issues if needed, 
-- or just update them by a generated sequence.
-- We'll assume we want to perfectly match the 15 units per category structure.

DELETE FROM public.products;

-- Sarees (15)
INSERT INTO public.products (name, price, compare_at_price, image_url, category, rating, status) VALUES
('Royal Maroon Silk Saree', 4999, 6999, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800', 'saree', 4.8, 'In Stock'),
('Emerald Zari Banarasi', 8499, 12999, 'https://images.unsplash.com/photo-1610030469668-9351426477cc?q=80&w=800', 'saree', 4.9, 'New Arrival'),
('Golden Kanchipuram Silk', 12999, 18999, 'https://images.unsplash.com/photo-1583391733956-6c782829d22d?q=80&w=800', 'saree', 5.0, 'In Stock'),
('Midnight Blue Georgette', 3499, 4999, 'https://images.unsplash.com/photo-1610408542784-0e318fb41f02?q=80&w=800', 'saree', 4.5, 'In Stock'),
('Blush Pink Organza', 4299, 5999, 'https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=800', 'saree', 4.7, 'Best Seller'),
('Ruby Red Bridal Saree', 15999, 21999, 'https://images.unsplash.com/photo-1595950275510-9c169b17781f?q=80&w=800', 'saree', 4.9, 'In Stock'),
('Silver Grey Chiffon', 2999, 3999, 'https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=800', 'saree', 4.3, 'In Stock'),
('Teal Green Paithani', 7299, 9999, 'https://images.unsplash.com/photo-1621334006456-1f6e2f122718?q=80&w=800', 'saree', 4.6, 'In Stock'),
('Lemon Yellow Cotton', 1899, 2499, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800', 'saree', 4.4, 'Low Stock'),
('Lavender Net Saree', 5499, 7999, 'https://images.unsplash.com/photo-1634711679301-b541bb8bb4f9?q=80&w=800', 'saree', 4.7, 'In Stock'),
('Black Beauty Designer', 6499, 8999, 'https://images.unsplash.com/photo-1594950157572-85a3e5b27ac3?q=80&w=800', 'saree', 4.8, 'Premium'),
('White Lace Statement', 5999, 8499, 'https://images.unsplash.com/photo-1610030469145-88569502a9eb?q=80&w=800', 'saree', 4.6, 'In Stock'),
('Mustard Linen Saree', 2499, 3499, 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=800', 'saree', 4.5, 'In Stock'),
('Royal Purple Velvet', 9999, 14999, 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800', 'saree', 4.9, 'New Arrival'),
('Indigo Hand-Block', 1299, 1999, 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?q=80&w=800', 'saree', 4.2, 'In Stock');

-- Kurtis (15)
INSERT INTO public.products (name, price, compare_at_price, image_url, category, rating, status) VALUES
('Classic White Chikankari', 1999, 2999, 'https://images.unsplash.com/photo-1609357605129-26f69abb5db6?q=80&w=800', 'kurti', 4.7, 'Best Seller'),
('Indigo Floral Anarkali', 2499, 3499, 'https://images.unsplash.com/photo-1617113931032-4d7a8d3e0b0e?q=80&w=800', 'kurti', 4.6, 'In Stock'),
('Sunshine Yellow Straight', 1299, 1899, 'https://images.unsplash.com/photo-1624388339401-49942a77a9cf?q=80&w=800', 'kurti', 4.5, 'In Stock'),
('Royal Blue Long Kurti', 1899, 2499, 'https://images.unsplash.com/photo-1611771472337-17f1a8c3d70e?q=80&w=800', 'kurti', 4.4, 'Low Stock'),
('Pastel Green Palazzo Set', 3999, 5499, 'https://images.unsplash.com/photo-1611601679655-7c8bc197f0c6?q=80&w=800', 'kurti', 4.8, 'New Arrival'),
('Designer Silk Tunic', 3299, 4499, 'https://images.unsplash.com/photo-1583391262775-9a28c070497b?q=80&w=800', 'kurti', 4.7, 'Premium'),
('Cotton Daily Wear', 999, 1499, 'https://images.unsplash.com/photo-1606162883500-8e7ac640df1d?q=80&w=800', 'kurti', 4.2, 'In Stock'),
('Black Embroidered Vibe', 2299, 3299, 'https://images.unsplash.com/photo-1610030469602-0e2715456250?q=80&w=800', 'kurti', 4.6, 'In Stock'),
('Crimson Red Side-Slit', 1599, 2299, 'https://images.unsplash.com/photo-1598501022379-58ec789f2571?q=80&w=800', 'kurti', 4.5, 'In Stock'),
('Teal Festive Kurta', 2799, 3999, 'https://images.unsplash.com/photo-1610408543167-88f569502a9cf?q=80&w=800', 'kurti', 4.7, 'Limited Edition'),
('Boho Fusion Kurti', 1499, 1999, 'https://images.unsplash.com/photo-1582533089852-02c3cd20227c?q=80&w=800', 'kurti', 4.4, 'In Stock'),
('Grey Minimalist Tunic', 1199, 1699, 'https://images.unsplash.com/photo-1595950626271-5ca23ebe80ec?q=80&w=800', 'kurti', 4.3, 'In Stock'),
('Peach Party Wear', 3499, 4999, 'https://images.unsplash.com/photo-1612459284970-e8f027596582?q=80&w=800', 'kurti', 4.8, 'New Arrival'),
('Mustard Ethnic Jacket', 2199, 2999, 'https://images.unsplash.com/photo-1610030469635-c3f25c777f76?q=80&w=800', 'kurti', 4.6, 'In Stock'),
('White Linen Summer', 1700, 2400, 'https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=800', 'kurti', 4.5, 'In Stock');

-- Lehengas (15)
INSERT INTO public.products (name, price, compare_at_price, image_url, category, rating, status) VALUES
('Bridal Red Heavily Embroidered', 45999, 65000, 'https://images.unsplash.com/photo-1594633225954-bh45c3b1acc2?q=80&w=800', 'lehenga', 5.0, 'Premium'),
('Peacock Blue Silk Lehenga', 22999, 35000, 'https://images.unsplash.com/photo-1595950275510-9c169b17781f?q=80&w=800', 'lehenga', 4.9, 'Best Seller'),
('Sunshine Yellow Haldi Special', 12999, 18000, 'https://images.unsplash.com/photo-1610030469733-317426477cc1?q=80&w=800', 'lehenga', 4.8, 'New Arrival'),
('Pastel Pink Floral', 18499, 26000, 'https://images.unsplash.com/photo-1610030469123-317426477cc1?q=80&w=800', 'lehenga', 4.7, 'In Stock'),
('Midnight Black Mirror-Work', 15999, 22000, 'https://images.unsplash.com/photo-1594950157572-85a3e5b27ac3?q=80&w=800', 'lehenga', 4.8, 'New Arrival'),
('Emerald Green Velvet', 28999, 40000, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800', 'lehenga', 4.9, 'Premium'),
('White Silk Minimalist', 9499, 12000, 'https://images.unsplash.com/photo-1568252542512-9fe1fe9cf08d?q=80&w=800', 'lehenga', 4.6, 'In Stock'),
('Gold Dusted Party Lehenga', 32999, 45000, 'https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=800', 'lehenga', 4.9, 'Best Seller'),
('Mint Green Net', 14299, 20000, 'https://images.unsplash.com/photo-1610030469602-0e2715456250?q=80&w=800', 'lehenga', 4.7, 'In Stock'),
('Lavender Dream', 19999, 28000, 'https://images.unsplash.com/photo-1621334006456-1f6e2f122718?q=80&w=800', 'lehenga', 4.8, 'New Arrival'),
('Maroon Traditional Zari', 38999, 52000, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800', 'lehenga', 5.0, 'Premium'),
('Peach Sabyasachi Style', 42999, 60000, 'https://images.unsplash.com/photo-1610030469315-c3f25c777f76?q=80&w=800', 'lehenga', 4.9, 'Elite'),
('Aqua Blue Net Lehenga', 11999, 16000, 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=800', 'lehenga', 4.6, 'In Stock'),
('Black & Gold Fusion', 17499, 24000, 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800', 'lehenga', 4.7, 'In Stock'),
('Grey Embellished Modern', 21499, 30000, 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?q=80&w=800', 'lehenga', 4.8, 'New Arrival');

-- Western (15)
INSERT INTO public.products (name, price, compare_at_price, image_url, category, rating, status) VALUES
('Floral Summer Maxi', 3299, 4499, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800', 'western', 4.6, 'In Stock'),
('Velvet Cocktail Mini', 4999, 6999, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800', 'western', 4.8, 'Best Seller'),
('Satin Party Gown', 8999, 12999, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800', 'western', 4.9, 'Premium'),
('Chic Linen Co-ord', 4299, 5999, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800', 'western', 4.7, 'New Arrival'),
('Denim Jacket Deluxe', 3499, 4999, 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?q=80&w=800', 'western', 4.5, 'In Stock'),
('Black Lace Evening', 6499, 8999, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800', 'western', 4.8, 'Premium'),
('White Summer Dress', 2899, 3999, 'https://images.unsplash.com/photo-1591085686350-798c0f99330a?q=80&w=800', 'western', 4.4, 'In Stock'),
('Floral Wrap Dress', 3199, 4499, 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?q=80&w=800', 'western', 4.6, 'New Arrival'),
('Emerald Silk Tunic', 4799, 6499, 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=800', 'western', 4.7, 'Best Seller'),
('Leather Biker Jacket', 7999, 10999, 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=800', 'western', 4.8, 'In Stock'),
('Sequin Party Blouse', 2499, 3499, 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800', 'western', 4.3, 'In Stock'),
('Casual Stripe T-shirt', 1299, 1899, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800', 'western', 4.2, 'In Stock'),
('Pleated Midi Skirt', 2199, 2999, 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?q=80&w=800', 'western', 4.5, 'In Stock'),
('Oversized Blazer', 5499, 7999, 'https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=800', 'western', 4.7, 'Premium'),
('Red Hot Bodycon', 3999, 5499, 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?q=80&w=800', 'western', 4.6, 'Best Seller');
