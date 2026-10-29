import os
import sys
import json
import openpyxl
from PIL import Image
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

# Load Meesho valid colors from validation sheet
wb_template = openpyxl.load_workbook(r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\Sarees-10003-EXTERNAL-MeeshoTemplate2PricesGSTIN.xlsx', data_only=True)
ws_val = wb_template['Validation Sheet']
valid_colors = []
for r in range(3, 100):
    val = ws_val.cell(row=r, column=25).value
    if val:
        valid_colors.append(val.strip())
print(f"Loaded {len(valid_colors)} valid Meesho colors: {valid_colors}")

# Load products
wb_curr = openpyxl.load_workbook(r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\Aanya_Fashions_Meesho_Bulk_Catalogue_FIXED.xlsx', data_only=True)
ws_curr = wb_curr['Sarees-Fill this']

with open(r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\scraped_products.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

img_base = r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\images'

results = []

for r in range(5, ws_curr.max_row + 1):
    name = ws_curr.cell(row=r, column=4).value
    if not name:
        break
    sku = ws_curr.cell(row=r, column=39).value
    curr_col = ws_curr.cell(row=r, column=25).value
    
    # Scraped data
    p_scraped = None
    for p in scraped:
        if p.get('name') == name or p.get('name', '').replace('Coral', 'Soft Pink').replace('coral', 'soft pink') == name:
            p_scraped = p
            break
        elif sku and sku in p.get('sku', ''):
            p_scraped = p
            break
            
    spec_col = p_scraped.get('specifications', {}).get('color', '') if p_scraped else ''
    
    sku_dir = os.path.join(img_base, sku) if sku else ''
    front_img_path = None
    if sku_dir and os.path.isdir(sku_dir):
        for fn in sorted(os.listdir(sku_dir)):
            if 'image-1-front' in fn:
                front_img_path = os.path.join(sku_dir, fn)
                break
    
    img_rgb = None
    if front_img_path and os.path.exists(front_img_path):
        img = Image.open(front_img_path).convert('RGB')
        w, h = img.size
        # Sample body region (avoid border edges): center 40% width, 30% to 70% height
        crop = img.crop((int(w * 0.3), int(h * 0.35), int(w * 0.7), int(h * 0.65)))
        arr = np.array(crop)
        # Average color
        mean_rgb = arr.mean(axis=(0, 1)).astype(int)
        # Median color
        med_rgb = np.median(arr, axis=(0, 1)).astype(int)
        img_rgb = (int(mean_rgb[0]), int(mean_rgb[1]), int(mean_rgb[2]))
        med_rgb = (int(med_rgb[0]), int(med_rgb[1]), int(med_rgb[2]))
    else:
        med_rgb = None
        
    results.append({
        'row': r,
        'sku': sku,
        'name': name,
        'spec_color': spec_color if 'spec_color' in locals() else spec_col,
        'spec_col': spec_col,
        'curr_col': curr_col,
        'mean_rgb': img_rgb,
        'med_rgb': med_rgb,
        'img_path': front_img_path
    })

for item in results:
    print(f"Row {item['row']:2d} | SKU: {item['sku']} | Current: {item['curr_col']:10s} | Spec: {item['spec_col'][:25]:25s} | RGB: {str(item['med_rgb']):16s} | {item['name'][:45]}")
