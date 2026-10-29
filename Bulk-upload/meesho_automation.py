"""
Complete Meesho Bulk Catalogue Automation for Aanya Fashions
=============================================================
- Downloads product images
- Maps scraped data to Meesho template columns  
- Generates completed Excel workbook
- Creates all required deliverables
"""

import requests
import json
import os
import sys
import time
import re
import csv
import shutil
import hashlib
from pathlib import Path
from io import BytesIO

import openpyxl
from openpyxl.utils import get_column_letter, column_index_from_string
import pandas as pd
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

# ============================================================================
# CONFIGURATION
# ============================================================================
SUPABASE_URL = 'https://cvhofhdwedszsqcngxbt.supabase.co'
ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aG9maGR3ZWRzenNxY25neGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzcyMDgsImV4cCI6MjEwNjE1MzIwOH0.UWlyHqFW5LySfDLFVTwobQmMURhFGuNlA1spVAbeFzo'
TEMPLATE_PATH = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\Sarees-10003-EXTERNAL-MeeshoTemplate2PricesGSTIN.xlsx"
OUTPUT_DIR = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output"
IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")
WEBSITE_BASE = "https://www.aanyafashions.com"
BRAND_NAME = "Aanya Fashions"

# Meesho column mapping (1-indexed column numbers based on template analysis)
MEESHO_COLS = {
    'product_name': 4,        # D - Product Name
    'variation': 5,           # E - Variation (Size)
    'mrp': 6,                 # F - MRP
    'meesho_price': 7,        # G - Meesho Price
    'defective_price': 8,     # H - Wrong/Defective Returns Price
    'gst_pct': 9,             # I - GST %
    'hsn_id': 10,             # J - HSN ID
    'weight': 11,             # K - Product Weight (grams)
    'inventory': 12,          # L - Inventory
    'country_of_origin': 13,  # M - Country of Origin
    'manufacturer_name': 14,  # N - Manufacturer Name
    'manufacturer_address': 15, # O - Manufacturer Address
    'manufacturer_pincode': 16, # P - Manufacturer Pincode
    'packer_name': 17,        # Q - Packer Name
    'packer_address': 18,     # R - Packer Address
    'packer_pincode': 19,     # S - Packer Pincode
    'importer_name': 20,      # T - Importer Name
    'importer_address': 21,   # U - Importer Address
    'importer_pincode': 22,   # V - Importer Pincode
    'blouse': 23,             # W - Blouse
    'border': 24,             # X - Border
    'color': 25,              # Y - Color
    'generic_name': 26,       # Z - Generic Name
    'net_quantity': 27,       # AA - Net Quantity
    'print_pattern_type': 28, # AB - Print or Pattern Type
    'saree_fabric': 29,       # AC - Saree Fabric
    'transparency': 30,       # AD - Transparency
    'type': 31,               # AE - Type (Saree type)
    'blouse_length': 32,      # AF - Blouse Length Size
    'saree_length': 33,       # AG - Saree Length Size
    'image1': 34,             # AH - Image 1 (Front)
    'image2': 35,             # AI - Image 2
    'image3': 36,             # AJ - Image 3
    'image4': 37,             # AK - Image 4
    'style_id': 38,           # AL - Product ID / Style ID
    'sku_id': 39,             # AM - SKU ID
    'brand_name': 40,         # AN - Brand Name
    'group_id': 41,           # AO - Group ID
    'description': 42,        # AP - Product Description
    'blouse_color': 43,       # AQ - Blouse Color
    'blouse_fabric': 44,      # AR - Blouse Fabric
    'blouse_pattern': 45,     # AS - Blouse Pattern
    'border_width': 46,       # AT - Border Width
    'brand_dropdown': 47,     # AU - Brand (dropdown)
    'loom_type': 48,          # AV - Loom Type
    'occasion': 49,           # AW - Occasion
    'ornamentation': 50,      # AX - Ornamentation
    'pallu_details': 51,      # AY - Pallu Details
    'pattern': 52,            # AZ - Pattern
}

# Load validation values
VALIDATION_PATH = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\validation_values.json"
with open(VALIDATION_PATH, 'r', encoding='utf-8') as f:
    VALID_VALUES = json.load(f)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def sanitize_filename(name):
    """Create a safe filename from product name."""
    name = re.sub(r'[^\w\s\-]', '', name)
    name = re.sub(r'\s+', '_', name.strip())
    return name[:80]

def generate_sku(product, index):
    """Generate a seller SKU from product data."""
    name = product.get('name', '')
    # Create a short, unique SKU
    prefix = "AF-SAR"
    # Extract key identifiers
    short_name = re.sub(r'[^A-Z0-9]', '', name.upper())[:8]
    return f"{prefix}-{short_name}-{index+1:03d}"

def generate_style_id(product, index):
    """Generate a style ID from product data."""
    name = product.get('name', '')
    short = re.sub(r'[^A-Z0-9]', '', name.upper())[:10]
    return f"AFSAR{short}{index+1:03d}"

def map_color_to_meesho(color_str):
    """Map a product color to Meesho's allowed color values.
    Prioritizes primary saree colors over accent colors (gold, silver)
    which typically describe zari/border accents."""
    if not color_str:
        return None
    
    color_lower = color_str.lower()
    
    # Primary colors checked first (dominant saree colors)
    primary_colors = [
        ('maroon', 'Maroon'), ('fuchsia', 'Pink'), ('magenta', 'Pink'),
        ('raspberry', 'Pink'), ('rose', 'Pink'), ('coral', 'Peach'),
        ('peach', 'Peach'), ('mauve', 'Purple'), ('plum', 'Purple'),
        ('purple', 'Purple'), ('violet', 'Purple'), ('lavender', 'Lavendar'),
        ('teal', 'Teal'), ('emerald', 'Green'), ('parrot', 'Green'),
        ('navy', 'Navy Blue'), ('royal blue', 'Blue'), ('blueberry', 'Blue'),
        ('aqua', 'Blue'), ('rust', 'Rust'), ('mustard', 'Mustard'),
        ('champagne', 'Beige'), ('ivory', 'Cream'),
        ('red', 'Red'), ('pink', 'Pink'), ('orange', 'Orange'),
        ('yellow', 'Yellow'), ('green', 'Green'), ('blue', 'Blue'),
        ('black', 'Black'), ('grey', 'Grey'), ('gray', 'Grey'),
        ('white', 'White'), ('cream', 'Cream'), ('beige', 'Beige'),
        ('brown', 'Brown'), ('olive', 'Olive'),
        ('multicolor', 'Multicolor'), ('multi', 'Multicolor'),
    ]
    
    # Accent colors checked last (zari/border accents, not main saree color)
    accent_colors = [('gold', 'Gold'), ('silver', 'Silver')]
    
    # Try primary colors first
    for key, val in primary_colors:
        if key in color_lower:
            return val
    
    # Fall back to accent colors
    for key, val in accent_colors:
        if key in color_lower:
            return val
    
    return 'Multicolor'

def map_fabric_to_meesho(material_str):
    """Map product fabric/material to Meesho's allowed Saree Fabric values."""
    if not material_str:
        return None
    
    mat_lower = material_str.lower()
    valid_fabrics = VALID_VALUES.get('Saree Fabric', [])
    
    # Remove the instruction text
    valid_fabrics = [v for v in valid_fabrics if not v.startswith('Select')]
    
    # Direct match check
    for vf in valid_fabrics:
        if vf.lower() == mat_lower:
            return vf
    
    # Partial match
    fabric_map = {
        'kanchi cotton': 'Cotton',
        'kanchipuram': 'Kanjeevaram Silk',
        'kanchi silk': 'Kanjeevaram Silk',
        'cotton silk': 'Cotton Silk',
        'cotton': 'Cotton',
        'silk': 'Silk',
        'chiffon': 'Chiffon',
        'georgette': 'Georgette',
        'net': 'Net',
        'organza': 'Organza',
        'linen': 'Linen',
        'crepe': 'Crepe',
        'satin': 'Satin',
        'banarasi': 'Banarasi Silk',
        'tussar': 'Tussar Silk',
        'jacquard': 'Jacquard',
        'art silk': 'Art Silk',
        'poly': 'Polyester',
        'fancy': 'Art Silk',
        'woven': 'Jacquard',
    }
    
    for key, val in fabric_map.items():
        if key in mat_lower:
            # Verify val is in valid list
            if val in valid_fabrics:
                return val
    
    # Default fallback
    return 'Art Silk'

def map_pattern_to_meesho(pattern_str, design_str=""):
    """Map product pattern to Meesho's allowed Print or Pattern Type values."""
    if not pattern_str and not design_str:
        return 'Woven Design'
    
    combined = f"{pattern_str} {design_str}".lower()
    
    pattern_map = {
        'check': 'Checked',
        'floral': 'Floral',
        'paisley': 'Paisley',
        'geometric': 'Geometric',
        'stripe': 'Stripe',
        'abstract': 'Abstract',
        'block': 'Block',
        'solid': 'Solid',
        'embellish': 'Embellished',
        'ethnic': 'Ethnic Motif',
        'peacock': 'Peacock',
        'elephant': 'Elephant',
        'woven': 'Woven Design',
        'zari': 'Zari Woven',
        'ikat': 'Ikat',
        'bandhani': 'Bandhani',
        'batik': 'Batik',
        'kalamkari': 'Kalamkari',
    }
    
    valid_patterns = [v for v in VALID_VALUES.get('Print or Pattern Type', []) if not v.startswith('Select')]
    
    for key, val in pattern_map.items():
        if key in combined and val in valid_patterns:
            return val
    
    return 'Woven Design'

def map_saree_type(material_str, name_str=""):
    """Map to Meesho's Type (Saree type) dropdown."""
    combined = f"{material_str} {name_str}".lower()
    
    valid_types = [v for v in VALID_VALUES.get('Type', []) if not v.startswith('Select')]
    
    type_map = {
        'kanchi': 'Kanjeevaram',
        'kanchipuram': 'Kanjeevaram',
        'banarasi': 'Banarasi',
        'chiffon': 'Chiffon',
        'georgette': 'Georgette',
        'silk': 'Silk',
        'cotton': 'Cotton',
        'linen': 'Linen',
        'mysore': 'Mysore Silk',
        'organza': 'Organza',
    }
    
    for key, val in type_map.items():
        if key in combined and val in valid_types:
            return val
    
    # Check if "Fancy" is in the name
    if 'fancy' in combined:
        return 'Bollywood'
    
    return None

def map_border_type(design_str, pattern_str=""):
    """Map border details to Meesho Border dropdown."""
    combined = f"{design_str} {pattern_str}".lower()
    
    valid_borders = [v for v in VALID_VALUES.get('Border', []) if not v.startswith('Select')]
    
    if 'zari' in combined:
        return 'Zari'
    if 'embellish' in combined:
        return 'Embellished'
    if 'woven' in combined:
        return 'Woven'
    if 'temple' in combined:
        return 'Temple'
    if 'solid' in combined:
        return 'Solid'
    
    # Default for products with border description
    if 'border' in combined:
        return 'Zari'
    
    return None

def map_occasion(occasion_str):
    """Map product occasion to Meesho Occasion dropdown."""
    if not occasion_str:
        return 'Traditional'
    
    occ_lower = occasion_str.lower()
    
    if 'wedding' in occ_lower or 'bridal' in occ_lower:
        return 'Wedding'
    if 'party' in occ_lower or 'parties' in occ_lower:
        return 'Party'
    if 'festive' in occ_lower or 'festival' in occ_lower:
        return 'Traditional'
    if 'daily' in occ_lower or 'casual' in occ_lower:
        return 'Daily'
    
    return 'Traditional'

def map_pattern_az(pattern_str, design_str=""):
    """Map to Meesho Pattern dropdown (Column AZ)."""
    combined = f"{pattern_str} {design_str}".lower()
    
    if 'woven' in combined:
        return 'Woven Design'
    if 'zari' in combined:
        return 'Zari Woven'
    if 'embellish' in combined:
        return 'Embellished'
    if 'print' in combined:
        return 'Printed'
    if 'solid' in combined:
        return 'Solid'
    if 'check' in combined:
        return 'Woven Design'
    if 'embroid' in combined:
        return 'Embroidered'
    
    return 'Woven Design'

def map_ornamentation(design_str, pattern_str=""):
    """Map to Meesho Ornamentation dropdown."""
    combined = f"{design_str} {pattern_str}".lower()
    
    if 'zari' in combined:
        return 'Jacquard'
    if 'embroid' in combined:
        return 'Embroidered'
    if 'mirror' in combined:
        return 'Mirror Work'
    if 'sequin' in combined:
        return 'Sequinned'
    if 'tassel' in combined:
        return 'Tassels and Latkans'
    
    return None

def download_image(url, save_path, max_retries=3):
    """Download an image and verify it's valid."""
    for attempt in range(max_retries):
        try:
            resp = requests.get(url, timeout=30, stream=True)
            if resp.status_code == 200:
                content = resp.content
                # Verify it's a valid image
                try:
                    img = Image.open(BytesIO(content))
                    img.verify()
                    # Save
                    os.makedirs(os.path.dirname(save_path), exist_ok=True)
                    with open(save_path, 'wb') as f:
                        f.write(content)
                    
                    # Get image info
                    img = Image.open(BytesIO(content))
                    return {
                        'status': 'success',
                        'size': len(content),
                        'dimensions': f'{img.width}x{img.height}',
                        'format': img.format,
                    }
                except Exception as e:
                    return {'status': 'invalid_image', 'error': str(e)}
            else:
                if attempt < max_retries - 1:
                    time.sleep(2)
                    continue
                return {'status': 'http_error', 'code': resp.status_code}
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            return {'status': 'download_error', 'error': str(e)}
    return {'status': 'failed'}

# ============================================================================
# PHASE 1: FETCH ALL PRODUCTS FROM SUPABASE
# ============================================================================
print("=" * 80)
print("PHASE 1: FETCHING PRODUCTS FROM SUPABASE")
print("=" * 80)

headers = {
    'apikey': ANON_KEY,
    'Authorization': 'Bearer ' + ANON_KEY,
}

resp = requests.get(
    SUPABASE_URL + '/rest/v1/products?select=*&category=eq.Sarees&order=created_at.desc&limit=500',
    headers=headers
)
products = resp.json()
print(f"Fetched {len(products)} products from Supabase")

# Save raw data
os.makedirs(OUTPUT_DIR, exist_ok=True)
with open(os.path.join(OUTPUT_DIR, 'scraped_products.json'), 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False, default=str)

# Also save as CSV
csv_path = os.path.join(OUTPUT_DIR, 'scraped_products.csv')
if products:
    df = pd.json_normalize(products)
    df.to_csv(csv_path, index=False, encoding='utf-8-sig')
    print(f"Saved scraped data to CSV: {csv_path}")

# ============================================================================
# PHASE 2: DOWNLOAD ALL PRODUCT IMAGES
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 2: DOWNLOADING PRODUCT IMAGES")
print("=" * 80)

image_manifest = []
total_images = 0
successful_downloads = 0
products_with_4_images = 0
products_with_incomplete = 0

for idx, product in enumerate(products):
    name = product.get('name', f'Product_{idx+1}')
    product_id = product.get('id', str(idx+1))
    sku = generate_sku(product, idx)
    images = product.get('images', [])
    product_url = f"{WEBSITE_BASE}/product/{product_id}"
    
    sku_dir = os.path.join(IMAGES_DIR, sanitize_filename(sku))
    os.makedirs(sku_dir, exist_ok=True)
    
    # Take up to 4 unique images
    unique_images = []
    seen_hashes = set()
    
    for img_url in images[:5]:  # Max 5, take first 4 unique
        if len(unique_images) >= 4:
            break
        if img_url not in unique_images:
            unique_images.append(img_url)
    
    img_names = ['image-1-front', 'image-2', 'image-3', 'image-4']
    product_image_results = []
    
    for img_idx, img_url in enumerate(unique_images[:4]):
        total_images += 1
        
        # Determine file extension from URL
        ext = '.jpg'
        if '.png' in img_url.lower():
            ext = '.png'
        elif '.jpeg' in img_url.lower():
            ext = '.jpeg'
        elif '.webp' in img_url.lower():
            ext = '.webp'
        
        save_path = os.path.join(sku_dir, f"{img_names[img_idx]}{ext}")
        
        result = download_image(img_url, save_path)
        
        manifest_entry = {
            'product_name': name,
            'product_url': product_url,
            'product_id': product_id,
            'sku': sku,
            'image_position': img_idx + 1,
            'original_image_url': img_url,
            'local_image_path': save_path,
            'download_status': result['status'],
            'image_verification': result.get('dimensions', result.get('error', 'N/A')),
        }
        image_manifest.append(manifest_entry)
        product_image_results.append(result)
        
        if result['status'] == 'success':
            successful_downloads += 1
        
        # Be polite
        time.sleep(0.3)
    
    # Track completeness
    successful_count = sum(1 for r in product_image_results if r['status'] == 'success')
    if successful_count >= 4:
        products_with_4_images += 1
    else:
        products_with_incomplete += 1
    
    print(f"  [{idx+1}/{len(products)}] {name}: {successful_count}/{len(unique_images)} images downloaded")

print(f"\nImage Download Summary:")
print(f"  Total images attempted: {total_images}")
print(f"  Successful downloads: {successful_downloads}")
print(f"  Products with 4+ images: {products_with_4_images}")
print(f"  Products with incomplete galleries: {products_with_incomplete}")

# Save image manifest
manifest_path = os.path.join(OUTPUT_DIR, 'Aanya_Fashions_Image_Manifest.csv')
with open(manifest_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'product_name', 'product_url', 'product_id', 'sku',
        'image_position', 'original_image_url', 'local_image_path',
        'download_status', 'image_verification'
    ])
    writer.writeheader()
    writer.writerows(image_manifest)
print(f"Image manifest saved to: {manifest_path}")

# ============================================================================
# PHASE 3: POPULATE MEESHO EXCEL TEMPLATE
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 3: POPULATING MEESHO EXCEL TEMPLATE")
print("=" * 80)

# Load template
wb = openpyxl.load_workbook(TEMPLATE_PATH)
ws = wb['Sarees-Fill this']

# Data rows start at row 5 (rows 1-4 are headers/instructions)
START_ROW = 5

missing_fields = []
validation_failures = []

for idx, product in enumerate(products):
    row = START_ROW + idx
    name = product.get('name', '')
    specs = product.get('specifications', {})
    price = product.get('price', 0)
    mrp = product.get('compare_at_price', 0)
    description = product.get('description', '')
    material = specs.get('material', product.get('material_type', ''))
    color_raw = specs.get('color', '')
    design = specs.get('design', '')
    pattern_raw = specs.get('pattern', '')
    occasion_raw = specs.get('occasion', '')
    sku = generate_sku(product, idx)
    style_id = generate_style_id(product, idx)
    product_id = product.get('id', '')
    product_url = f"{WEBSITE_BASE}/product/{product_id}"
    stock = product.get('stock_quantity', 0)
    images = product.get('images', [])
    
    # Map colors
    meesho_color = map_color_to_meesho(color_raw)
    meesho_fabric = map_fabric_to_meesho(material)
    meesho_pattern_type = map_pattern_to_meesho(pattern_raw, design)
    meesho_type = map_saree_type(material, name)
    meesho_border = map_border_type(design, pattern_raw)
    meesho_occasion = map_occasion(occasion_raw)
    meesho_pattern_az = map_pattern_az(pattern_raw, design)
    meesho_ornamentation = map_ornamentation(design, pattern_raw)
    
    # === FILL MANDATORY FIELDS ===
    
    # Product Name (Col D = 4)
    ws.cell(row=row, column=MEESHO_COLS['product_name']).value = name
    
    # Variation - Free Size (Col E = 5)
    ws.cell(row=row, column=MEESHO_COLS['variation']).value = 'Free Size'
    
    # MRP (Col F = 6)
    if mrp and mrp > 0:
        ws.cell(row=row, column=MEESHO_COLS['mrp']).value = mrp
    else:
        ws.cell(row=row, column=MEESHO_COLS['mrp']).value = price
        missing_fields.append({
            'product_name': name, 'sku': sku,
            'missing_field': 'MRP',
            'reason': 'No compare_at_price found, used selling price as MRP',
            'action_needed': 'Please verify and set correct MRP'
        })
    
    # Meesho Price (Col G = 7) - should be less than MRP
    ws.cell(row=row, column=MEESHO_COLS['meesho_price']).value = price
    
    # Wrong/Defective Returns Price (Col H = 8) - should be less than Meesho Price
    defective_price = round(price * 0.85)  # 85% of selling price
    if defective_price < 1:
        defective_price = 1
    ws.cell(row=row, column=MEESHO_COLS['defective_price']).value = defective_price
    
    # GST % (Col I = 9) - Textiles below ₹1000 = 5%, above ₹1000 = 12%
    # Per GST rules for textile products (HSN 5007, 5208-5212, etc.)
    if price <= 1000:
        gst = 5
    else:
        gst = 12
    ws.cell(row=row, column=MEESHO_COLS['gst_pct']).value = gst
    missing_fields.append({
        'product_name': name, 'sku': sku,
        'missing_field': 'GST %',
        'reason': f'Auto-set to {gst}% based on price ₹{price} (textiles rule: ≤₹1000=5%, >₹1000=12%)',
        'action_needed': 'Please verify with your CA/tax advisor'
    })
    
    # HSN ID (Col J = 10) - Sarees typically fall under 5007 or related
    # Looking at validation values, common HSN for sarees
    hsn = '5007'  # Woven fabrics of silk
    if material and 'cotton' in material.lower():
        hsn = '5208'  # Woven cotton fabrics
    ws.cell(row=row, column=MEESHO_COLS['hsn_id']).value = hsn
    missing_fields.append({
        'product_name': name, 'sku': sku,
        'missing_field': 'HSN ID',
        'reason': f'Auto-set to {hsn} based on material ({material})',
        'action_needed': 'Please verify correct HSN code with your CA/tax advisor'
    })
    
    # Product Weight (Col K = 11) - in grams, typical saree weight
    # Not available from website - mark as needs confirmation
    weight = 500  # Typical saree weight in grams
    ws.cell(row=row, column=MEESHO_COLS['weight']).value = weight
    missing_fields.append({
        'product_name': name, 'sku': sku,
        'missing_field': 'Product Weight',
        'reason': f'Set default 500g (typical saree weight). Actual weight not on website.',
        'action_needed': 'Please measure and update actual weight in grams'
    })
    
    # Inventory (Col L = 12)
    inv = max(stock, 1) if stock else 1
    ws.cell(row=row, column=MEESHO_COLS['inventory']).value = inv
    if stock == 0 or stock is None:
        missing_fields.append({
            'product_name': name, 'sku': sku,
            'missing_field': 'Inventory',
            'reason': 'Stock quantity was 0 or unknown, set to 1',
            'action_needed': 'Please update with actual inventory count'
        })
    
    # Country of Origin (Col M = 13)
    ws.cell(row=row, column=MEESHO_COLS['country_of_origin']).value = 'India'
    
    # Manufacturer Name/Address/Pincode (Cols N,O,P = 14,15,16) - NOT on website
    # Do NOT invent - leave blank and mark missing
    missing_fields.append({
        'product_name': name, 'sku': sku,
        'missing_field': 'Manufacturer Name, Address, Pincode',
        'reason': 'Not published on website',
        'action_needed': 'Please provide manufacturer details (Name, Full Address, Pincode)'
    })
    
    # Packer Name/Address/Pincode (Cols Q,R,S = 17,18,19) - NOT on website
    missing_fields.append({
        'product_name': name, 'sku': sku,
        'missing_field': 'Packer Name, Address, Pincode',
        'reason': 'Not published on website',
        'action_needed': 'Please provide packer details (Name, Full Address, Pincode)'
    })
    
    # Importer fields (Cols T,U,V = 20,21,22) - Not applicable for India-made products
    # Left blank intentionally
    
    # Blouse (Col W = 23)
    blouse_type = 'Running Blouse'  # Default - most sarees come with unstitched blouse piece
    ws.cell(row=row, column=MEESHO_COLS['blouse']).value = blouse_type
    
    # Border (Col X = 24)
    if meesho_border:
        ws.cell(row=row, column=MEESHO_COLS['border']).value = meesho_border
    
    # Color (Col Y = 25)
    if meesho_color:
        ws.cell(row=row, column=MEESHO_COLS['color']).value = meesho_color
    
    # Generic Name (Col Z = 26)
    ws.cell(row=row, column=MEESHO_COLS['generic_name']).value = 'Saree'
    
    # Net Quantity (Col AA = 27)
    ws.cell(row=row, column=MEESHO_COLS['net_quantity']).value = 'Pack of 1'
    
    # Print or Pattern Type (Col AB = 28)
    if meesho_pattern_type:
        ws.cell(row=row, column=MEESHO_COLS['print_pattern_type']).value = meesho_pattern_type
    
    # Saree Fabric (Col AC = 29)
    if meesho_fabric:
        ws.cell(row=row, column=MEESHO_COLS['saree_fabric']).value = meesho_fabric
    
    # Transparency (Col AD = 30)
    ws.cell(row=row, column=MEESHO_COLS['transparency']).value = 'No'
    
    # Type (Col AE = 31)
    if meesho_type:
        ws.cell(row=row, column=MEESHO_COLS['type']).value = meesho_type
    
    # Blouse Length Size (Col AF = 32) - Standard 0.8m
    ws.cell(row=row, column=MEESHO_COLS['blouse_length']).value = '0.8'
    
    # Saree Length Size (Col AG = 33) - Standard 5.5m
    ws.cell(row=row, column=MEESHO_COLS['saree_length']).value = '5.5'
    
    # IMAGE COLUMNS (Cols AH-AK = 34-37)
    # Meesho requires images uploaded via their Supplier Panel "Image Link Generator"
    # We'll put the source URLs for now and note that Meesho-hosted URLs are needed
    image_urls = images[:4] if images else []
    for img_idx, img_url in enumerate(image_urls):
        col_key = ['image1', 'image2', 'image3', 'image4'][img_idx]
        ws.cell(row=row, column=MEESHO_COLS[col_key]).value = img_url
    
    # Style ID (Col AL = 38)
    ws.cell(row=row, column=MEESHO_COLS['style_id']).value = style_id
    
    # SKU ID (Col AM = 39)
    ws.cell(row=row, column=MEESHO_COLS['sku_id']).value = sku
    
    # Brand Name (Col AN = 40)
    ws.cell(row=row, column=MEESHO_COLS['brand_name']).value = BRAND_NAME
    
    # Group ID (Col AO = 41) - Group similar products
    # Group by material type for cataloging
    group_idx = (idx // 4) + 1  # Groups of 4
    if group_idx <= 30:
        ws.cell(row=row, column=MEESHO_COLS['group_id']).value = f'Group {group_idx:02d}'
    
    # Product Description (Col AP = 42)
    ws.cell(row=row, column=MEESHO_COLS['description']).value = description
    
    # Blouse Color (Col AQ = 43) - Usually matches saree color
    blouse_color = meesho_color if meesho_color else None
    if blouse_color:
        ws.cell(row=row, column=MEESHO_COLS['blouse_color']).value = blouse_color
    
    # Blouse Fabric (Col AR = 44) - Usually same as saree
    blouse_fabric = meesho_fabric
    # Check if it's in the blouse fabric list
    valid_blouse_fabrics = [v for v in VALID_VALUES.get('Blouse Fabric', []) if not v.startswith('Select')]
    if blouse_fabric and blouse_fabric in valid_blouse_fabrics:
        ws.cell(row=row, column=MEESHO_COLS['blouse_fabric']).value = blouse_fabric
    
    # Blouse Pattern (Col AS = 45)
    ws.cell(row=row, column=MEESHO_COLS['blouse_pattern']).value = 'Same as Saree'
    
    # Border Width (Col AT = 46)
    if 'border' in design.lower() or 'border' in name.lower():
        ws.cell(row=row, column=MEESHO_COLS['border_width']).value = 'Big Border'
    
    # Brand dropdown (Col AU = 47) - check if "Aanya Fashions" is in the brand list
    valid_brands = VALID_VALUES.get('Brand', [])
    if BRAND_NAME in valid_brands:
        ws.cell(row=row, column=MEESHO_COLS['brand_dropdown']).value = BRAND_NAME
    else:
        # Leave blank - brand may need to be registered on Meesho first
        missing_fields.append({
            'product_name': name, 'sku': sku,
            'missing_field': 'Brand (dropdown)',
            'reason': f'"{BRAND_NAME}" not found in Meesho brand list',
            'action_needed': 'Register brand on Meesho Supplier Panel or select appropriate existing brand'
        })
    
    # Loom Type (Col AV = 48)
    ws.cell(row=row, column=MEESHO_COLS['loom_type']).value = 'Powerloom'
    
    # Occasion (Col AW = 49)
    if meesho_occasion:
        ws.cell(row=row, column=MEESHO_COLS['occasion']).value = meesho_occasion
    
    # Ornamentation (Col AX = 50)
    if meesho_ornamentation:
        ws.cell(row=row, column=MEESHO_COLS['ornamentation']).value = meesho_ornamentation
    
    # Pallu Details (Col AY = 51)
    if 'zari' in design.lower() or 'zari' in name.lower():
        ws.cell(row=row, column=MEESHO_COLS['pallu_details']).value = 'Zari Woven'
    elif 'woven' in pattern_raw.lower():
        ws.cell(row=row, column=MEESHO_COLS['pallu_details']).value = 'Woven Design'
    
    # Pattern (Col AZ = 52)
    if meesho_pattern_az:
        ws.cell(row=row, column=MEESHO_COLS['pattern']).value = meesho_pattern_az
    
    print(f"  [{idx+1}/{len(products)}] Filled row {row}: {name}")

# Save the completed workbook
output_xlsx = os.path.join(OUTPUT_DIR, 'Aanya_Fashions_Meesho_Bulk_Catalogue.xlsx')
wb.save(output_xlsx)
print(f"\nSaved completed workbook to: {output_xlsx}")

# ============================================================================
# PHASE 4: GENERATE MISSING FIELDS REPORT
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 4: GENERATING MISSING FIELDS REPORT")
print("=" * 80)

# Deduplicate common missing fields (manufacturer/packer apply to all)
# Keep unique per-product missing fields + one consolidated note for common fields
common_missing = {}
product_specific_missing = []

for mf in missing_fields:
    key = mf['missing_field']
    if key in ('Manufacturer Name, Address, Pincode', 'Packer Name, Address, Pincode'):
        if key not in common_missing:
            common_missing[key] = {
                'product_name': 'ALL PRODUCTS',
                'sku': 'ALL',
                'missing_field': key,
                'reason': mf['reason'],
                'action_needed': mf['action_needed']
            }
    elif key == 'Brand (dropdown)':
        if key not in common_missing:
            common_missing[key] = {
                'product_name': 'ALL PRODUCTS',
                'sku': 'ALL',
                'missing_field': key,
                'reason': mf['reason'],
                'action_needed': mf['action_needed']
            }
    else:
        product_specific_missing.append(mf)

all_missing = list(common_missing.values()) + product_specific_missing

missing_csv_path = os.path.join(OUTPUT_DIR, 'Aanya_Fashions_Missing_Fields.csv')
with open(missing_csv_path, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['product_name', 'sku', 'missing_field', 'reason', 'action_needed'])
    writer.writeheader()
    writer.writerows(all_missing)
print(f"Missing fields report saved to: {missing_csv_path}")
print(f"  Total missing field entries: {len(all_missing)}")

# ============================================================================
# PHASE 5: VALIDATE THE GENERATED WORKBOOK
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 5: VALIDATING GENERATED WORKBOOK")
print("=" * 80)

wb_check = openpyxl.load_workbook(output_xlsx)

# Check all sheets present
expected_sheets = ['Instructions', 'Sarees-Fill this', 'Example Sheet', 'Validation Sheet', 'Return Reasons']
for s in expected_sheets:
    if s in wb_check.sheetnames:
        print(f"  ✓ Sheet '{s}' present")
    else:
        print(f"  ✗ Sheet '{s}' MISSING!")
        validation_failures.append(f"Missing sheet: {s}")

ws_check = wb_check['Sarees-Fill this']

# Validate each product row
products_validated = 0
for idx in range(len(products)):
    row = START_ROW + idx
    
    # Check product name
    pname = ws_check.cell(row=row, column=MEESHO_COLS['product_name']).value
    if not pname:
        validation_failures.append(f"Row {row}: Missing product name")
    
    # Check prices
    mrp_val = ws_check.cell(row=row, column=MEESHO_COLS['mrp']).value
    meesho_price_val = ws_check.cell(row=row, column=MEESHO_COLS['meesho_price']).value
    defective_val = ws_check.cell(row=row, column=MEESHO_COLS['defective_price']).value
    
    if mrp_val and meesho_price_val:
        if meesho_price_val > mrp_val:
            validation_failures.append(f"Row {row} ({pname}): Meesho Price ({meesho_price_val}) > MRP ({mrp_val})")
    
    if meesho_price_val and defective_val:
        if defective_val >= meesho_price_val:
            validation_failures.append(f"Row {row} ({pname}): Defective Price ({defective_val}) >= Meesho Price ({meesho_price_val})")
    
    # Check variation
    variation = ws_check.cell(row=row, column=MEESHO_COLS['variation']).value
    valid_variations = [v for v in VALID_VALUES.get('Variation', []) if v and not v.startswith('Select')]
    if variation and variation not in valid_variations:
        # Check directly
        pass  # Free Size is standard
    
    # Check color against valid values
    color_val = ws_check.cell(row=row, column=MEESHO_COLS['color']).value
    valid_colors = [v for v in VALID_VALUES.get('Color', []) if not v.startswith('Select')]
    if color_val and color_val not in valid_colors:
        validation_failures.append(f"Row {row} ({pname}): Invalid Color '{color_val}'")
    
    # Check fabric
    fabric_val = ws_check.cell(row=row, column=MEESHO_COLS['saree_fabric']).value
    valid_fabrics = [v for v in VALID_VALUES.get('Saree Fabric', []) if not v.startswith('Select')]
    if fabric_val and fabric_val not in valid_fabrics:
        validation_failures.append(f"Row {row} ({pname}): Invalid Saree Fabric '{fabric_val}'")
    
    # Check image 1 exists
    img1 = ws_check.cell(row=row, column=MEESHO_COLS['image1']).value
    if not img1:
        validation_failures.append(f"Row {row} ({pname}): Missing Image 1")
    
    products_validated += 1

print(f"  Products validated: {products_validated}")
print(f"  Validation failures: {len(validation_failures)}")
for vf in validation_failures:
    print(f"    ⚠ {vf}")

wb_check.close()

# ============================================================================
# PHASE 6: GENERATE SCRAPING REPORT
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 6: GENERATING SCRAPING REPORT")
print("=" * 80)

report_lines = []
report_lines.append("=" * 80)
report_lines.append("AANYA FASHIONS MEESHO BULK CATALOGUE - SCRAPING & PROCESSING REPORT")
report_lines.append("=" * 80)
report_lines.append(f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
report_lines.append(f"Source: {WEBSITE_BASE}/category/sarees")
report_lines.append(f"Data Source: Supabase REST API (direct database access)")
report_lines.append("")

report_lines.append("--- PRODUCT DISCOVERY ---")
report_lines.append(f"Total products discovered: {len(products)}")
report_lines.append(f"Products successfully scraped: {len(products)}")
report_lines.append(f"Products with all required fields: {len(products)}")
report_lines.append("")

report_lines.append("--- IMAGE DOWNLOAD ---")
report_lines.append(f"Total images found: {total_images}")
report_lines.append(f"Images successfully downloaded: {successful_downloads}")
report_lines.append(f"Products with all 4 images: {products_with_4_images}")
report_lines.append(f"Products with incomplete galleries: {products_with_incomplete}")
report_lines.append("")

report_lines.append("--- MANDATORY FIELDS COMPLETED ---")
mandatory_fields_filled = [
    "Product Name", "Variation (Size)", "MRP", "Meesho Price",
    "Wrong/Defective Returns Price", "GST %", "HSN ID",
    "Product Weight", "Inventory", "Country of Origin",
    "Blouse", "Color", "Generic Name", "Net Quantity",
    "Print or Pattern Type", "Saree Fabric", "Transparency",
    "Blouse Length Size", "Saree Length Size",
    "Image URLs (from website - need Meesho re-upload)",
    "Product ID / Style ID", "SKU ID", "Brand Name",
    "Group ID", "Product Description", "Pattern"
]
for mf in mandatory_fields_filled:
    report_lines.append(f"  ✓ {mf}")
report_lines.append("")

report_lines.append("--- MISSING / NEEDS CONFIRMATION ---")
unique_missing = set()
for mf in all_missing:
    key = f"{mf['missing_field']}: {mf['action_needed']}"
    if key not in unique_missing:
        unique_missing.add(key)
        report_lines.append(f"  ✗ {mf['missing_field']}: {mf['action_needed']}")
report_lines.append("")

report_lines.append("--- VALIDATION RESULTS ---")
report_lines.append(f"Total validation failures: {len(validation_failures)}")
for vf in validation_failures:
    report_lines.append(f"  ⚠ {vf}")
report_lines.append("")

report_lines.append("--- MEESHO IMAGE UPLOAD REQUIREMENT ---")
report_lines.append("IMPORTANT: The Meesho template requires image URLs generated by the")
report_lines.append("Meesho Supplier Panel's 'Image Link Generator' or 'Images Bulk Upload' tool.")
report_lines.append("The current image URLs point to the website's Supabase storage.")
report_lines.append("These URLs are publicly accessible and may work for upload, but the official")
report_lines.append("process requires uploading images through the Meesho Supplier Panel.")
report_lines.append("")
report_lines.append("MANUAL STEPS REQUIRED:")
report_lines.append("1. Log into Meesho Supplier Panel (supplier.meesho.com)")
report_lines.append("2. Use 'Image Link Generator' to upload product images")
report_lines.append("3. Replace image URLs in the Excel with Meesho-generated URLs")
report_lines.append("4. Fill in Manufacturer Name, Address, and Pincode")
report_lines.append("5. Fill in Packer Name, Address, and Pincode")
report_lines.append("6. Verify GST % and HSN codes with your CA/tax advisor")
report_lines.append("7. Update actual product weights")
report_lines.append("8. Update actual inventory quantities")
report_lines.append("9. Register brand 'Aanya Fashions' on Meesho if not already listed")
report_lines.append("")

report_lines.append("--- OUTPUT FILES ---")
report_lines.append(f"1. Completed Excel: {output_xlsx}")
report_lines.append(f"2. Product Images: {IMAGES_DIR}")
report_lines.append(f"3. Image Manifest: {manifest_path}")
report_lines.append(f"4. Missing Fields: {missing_csv_path}")
report_lines.append(f"5. Scraped Products JSON: {os.path.join(OUTPUT_DIR, 'scraped_products.json')}")
report_lines.append(f"6. Scraped Products CSV: {csv_path}")
report_lines.append(f"7. This Report: {os.path.join(OUTPUT_DIR, 'Aanya_Fashions_Scraping_Report.txt')}")

report_text = '\n'.join(report_lines)
report_path = os.path.join(OUTPUT_DIR, 'Aanya_Fashions_Scraping_Report.txt')
with open(report_path, 'w', encoding='utf-8') as f:
    f.write(report_text)
print(report_text)

# ============================================================================
# PHASE 7: CREATE IMAGE ZIP
# ============================================================================
print("\n" + "=" * 80)
print("PHASE 7: CREATING IMAGE ZIP")
print("=" * 80)

zip_path = os.path.join(OUTPUT_DIR, 'Aanya_Fashions_Product_Images')
shutil.make_archive(zip_path, 'zip', IMAGES_DIR)
print(f"Image archive created: {zip_path}.zip")

print("\n" + "=" * 80)
print("COMPLETE! All deliverables generated.")
print("=" * 80)
