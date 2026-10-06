-- Insert the existing AF2001 coupon that was blocked by RLS earlier
INSERT INTO public.coupons (code, discount_type, discount_value, status, product_id, min_order_amount, applicable_on)
SELECT 
  'AF2001',
  'Percentage',
  25,
  'Active',
  id,
  0,
  'inthaa poduvaiku mattum thaa intha coupon uh'
FROM public.products
WHERE name = 'demo gorogon pottaaa podavai broo ithu'
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  status = 'Active',
  product_id = EXCLUDED.product_id;
