-- Fix NULL categories based on product names
UPDATE public.products
SET category = 'Sarees'
WHERE category IS NULL AND (name ILIKE '%Saree%' OR name ILIKE '%Organza%' OR name ILIKE '%Banarasi%');

UPDATE public.products
SET category = 'Kurtis'
WHERE category IS NULL AND (name ILIKE '%Kurti%' OR name ILIKE '%Fusion%');

UPDATE public.products
SET category = 'Lehengas'
WHERE category IS NULL AND (name ILIKE '%Lehenga%');

UPDATE public.products
SET category = 'Salwar Sets'
WHERE category IS NULL AND (name ILIKE '%Salwar%' OR name ILIKE '%Suit%');

UPDATE public.products
SET category = 'Western'
WHERE category IS NULL AND (name ILIKE '%Dress%' OR name ILIKE '%Maxi%' OR name ILIKE '%Peplum%' OR name ILIKE '%Western%');

-- Ensure all remaining NULLs at least have a category
UPDATE public.products
SET category = 'Western'
WHERE category IS NULL;

-- Ensure status is Published so they show up in frontend
UPDATE public.products
SET status = 'Published'
WHERE status IS NULL OR status = 'Draft';

-- Log the changes
SELECT id, name, category, status FROM public.products;
