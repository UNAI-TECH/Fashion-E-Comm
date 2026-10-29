import requests, json, sys
sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://cvhofhdwedszsqcngxbt.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aG9maGR3ZWRzenNxY25neGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzcyMDgsImV4cCI6MjEwNjE1MzIwOH0.UWlyHqFW5LySfDLFVTwobQmMURhFGuNlA1spVAbeFzo'

headers = {
    'apikey': ANON_KEY,
    'Authorization': 'Bearer ' + ANON_KEY,
}

# Get ALL saree products
resp = requests.get(
    SUPABASE_URL + '/rest/v1/products?select=*&category=eq.Sarees&order=created_at.desc&limit=500',
    headers=headers
)
print(f'Status: {resp.status_code}')
products = resp.json()
print(f'Products count: {len(products)}')

for i, p in enumerate(products):
    name = p.get("name", "N/A")
    price = p.get("price", "N/A")
    mrp = p.get("compare_at_price", "N/A")
    imgs = p.get("images", [])
    img_count = len(imgs) if isinstance(imgs, list) else 0
    status = p.get("status", "N/A")
    material = p.get("material_type", "N/A")
    specs = p.get("specifications", {})
    print(f'{i+1}. {name}')
    print(f'   Price: {price} | MRP: {mrp} | Stock: {p.get("stock_quantity")} | Status: {status}')
    print(f'   Material: {material} | Images: {img_count}')
    print(f'   Specs: {json.dumps(specs, ensure_ascii=False)}')
    print()

# Save
with open('supabase_products_raw.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False, default=str)
print(f'Saved {len(products)} products to supabase_products_raw.json')
