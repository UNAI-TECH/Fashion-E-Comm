"""
Fix colors v2: Combines image analysis with product spec color data.
Uses image analysis as primary, but cross-references with product name
and spec color to resolve ambiguous/dark detections.
"""
import os
import sys
import json
import math
from collections import Counter
from PIL import Image
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

IMAGES_DIR = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\images"
FIXED_XLSX = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\Aanya_Fashions_Meesho_Bulk_Catalogue_FIXED.xlsx"
OUTPUT_XLSX = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\Aanya_Fashions_Meesho_Bulk_Catalogue_FIXED_v2.xlsx"

# Valid Meesho colors with RGB approximations
MEESHO_COLORS = {
    'Aqua Blue':     (0, 200, 210),
    'Beige':         (210, 190, 160),
    'Black':         (20, 20, 20),
    'Blue':          (50, 80, 180),
    'Brown':         (120, 70, 40),
    'Copper':        (184, 115, 51),
    'Coral':         (255, 127, 80),
    'Cream':         (240, 230, 210),
    'Dark Pink':     (200, 50, 100),
    'Gajari':        (220, 80, 60),
    'Gold':          (200, 170, 80),
    'Green':         (40, 130, 60),
    'Grey':          (150, 150, 150),
    'Indigo':        (50, 40, 120),
    'Lavender':      (180, 150, 200),
    'Maroon':        (128, 30, 40),
    'Mehendi':       (100, 120, 50),
    'Metallic':      (190, 190, 200),
    'Mustard':       (200, 170, 50),
    'Navy Blue':     (30, 40, 100),
    'Olive':         (110, 120, 50),
    'Orange':        (230, 150, 50),
    'Peach':         (240, 185, 145),
    'Pink':          (230, 100, 150),
    'Purple':        (110, 40, 130),
    'Rani':          (200, 40, 100),
    'Red':           (200, 40, 40),
    'Rust':          (180, 80, 40),
    'Silver':        (200, 200, 210),
    'Teal':          (0, 128, 128),
    'Yellow':        (240, 210, 60),
}

def rgb_distance(c1, c2):
    """Weighted Euclidean distance."""
    dr = c1[0] - c2[0]
    dg = c1[1] - c2[1]
    db = c1[2] - c2[2]
    return math.sqrt(2*dr*dr + 4*dg*dg + 3*db*db)

def rgb_to_hsv(r, g, b):
    r, g, b = r/255.0, g/255.0, b/255.0
    mx = max(r, g, b)
    mn = min(r, g, b)
    diff = mx - mn
    if diff == 0: h = 0
    elif mx == r: h = (60 * ((g - b) / diff) + 360) % 360
    elif mx == g: h = (60 * ((b - r) / diff) + 120) % 360
    else: h = (60 * ((r - g) / diff) + 240) % 360
    s = 0 if mx == 0 else (diff / mx)
    v = mx
    return h, s, v

def analyze_image_color(image_path):
    """Analyze center of saree image, return top chromatic colors."""
    try:
        img = Image.open(image_path).convert('RGB')
        w, h = img.size
        
        # Sample multiple regions of the body (not just center)
        regions = [
            (0.25, 0.15, 0.75, 0.50),  # Upper center
            (0.20, 0.30, 0.80, 0.65),  # Mid center
            (0.30, 0.10, 0.70, 0.45),  # Core center
        ]
        
        all_pixels = []
        for l, t, r, b in regions:
            crop = img.crop((int(w*l), int(h*t), int(w*r), int(h*b)))
            crop = crop.resize((60, 60), Image.LANCZOS)
            all_pixels.extend(list(crop.getdata()))
        
        # Quantize
        quantized = []
        for r, g, b in all_pixels:
            qr = (r // 15) * 15
            qg = (g // 15) * 15
            qb = (b // 15) * 15
            quantized.append((qr, qg, qb))
        
        counter = Counter(quantized)
        top_colors = counter.most_common(20)
        
        # Separate chromatic vs achromatic colors
        chromatic = []
        achromatic = []
        
        for color, count in top_colors:
            h, s, v = rgb_to_hsv(*color)
            if s < 0.10:  # Very desaturated = achromatic
                achromatic.append((color, count, h, s, v))
            elif v < 0.06:  # Very dark
                achromatic.append((color, count, h, s, v))
            else:
                chromatic.append((color, count, h, s, v))
        
        return chromatic, achromatic
        
    except Exception as e:
        return [], []

def find_best_meesho_color(chromatic_colors, spec_color, product_name):
    """
    Determine the best Meesho color using:
    1. Image analysis (chromatic dominant colors)
    2. Product spec color as reference
    3. Product name keywords
    """
    
    # First: try to determine from product name + spec color (most reliable)
    name_lower = product_name.lower()
    spec_lower = (spec_color or '').lower()
    combined = f"{name_lower} {spec_lower}"
    
    # Build a mapping from name/spec keywords to Meesho colors
    # Order matters - more specific first
    keyword_map = [
        # Specific compound colors
        ('dark teal', 'Teal'),
        ('teal green', 'Teal'),
        ('teal blue', 'Teal'),
        ('peacock teal', 'Teal'),
        ('navy blue', 'Navy Blue'),
        ('royal blue', 'Blue'),
        ('blueberry blue', 'Blue'),
        ('aqua blue', 'Aqua Blue'),
        ('dark pink', 'Dark Pink'),
        ('rose pink', 'Pink'),
        ('raspberry pink', 'Pink'),
        ('fuchsia pink', 'Rani'),
        ('magenta pink', 'Rani'),
        ('magenta', 'Rani'),
        ('coral pink', 'Peach'),
        ('emerald green', 'Green'),
        ('parrot green', 'Green'),
        ('dark emerald', 'Green'),
        ('mustard yellow', 'Mustard'),
        ('golden yellow', 'Gold'),
        ('lemon yellow', 'Yellow'),
        ('royal purple', 'Purple'),
        ('plum purple', 'Purple'),
        ('royal plum', 'Purple'),
        ('dark blackish purple', 'Purple'),
        ('rust orange', 'Rust'),
        ('champagne gold', 'Gold'),
        ('ivory gold', 'Cream'),
        
        # Simple colors
        ('maroon', 'Maroon'),
        ('teal', 'Teal'),
        ('purple', 'Purple'),
        ('plum', 'Purple'),
        ('mauve', 'Lavender'),
        ('green', 'Green'),
        ('blue', 'Blue'),
        ('pink', 'Pink'),
        ('red', 'Red'),
        ('orange', 'Orange'),
        ('rust', 'Rust'),
        ('yellow', 'Yellow'),
        ('mustard', 'Mustard'),
        ('gold', 'Gold'),
        ('grey', 'Grey'),
        ('peach', 'Peach'),
        ('cream', 'Cream'),
        ('ivory', 'Cream'),
        ('beige', 'Beige'),
        ('brown', 'Brown'),
        ('black', 'Black'),
        ('white', 'White'),
    ]
    
    # The product name typically starts with the MAIN saree body color
    # e.g., "Teal Green & Maroon Gold Zari Fancy Saree" -> main body = Teal Green
    # Split on '&', 'with', 'Contrast' to get the first/primary color
    primary_part = name_lower.split('&')[0].split(' with ')[0].split(' contrast ')[0].strip()
    # Also try the full name for compound matches
    
    # Try matching primary part first (this is the BODY color)
    for keyword, meesho_color in keyword_map:
        if keyword in primary_part:
            return meesho_color, f"name-primary-match: '{keyword}' in '{primary_part}'"
    
    # Try spec color 
    for keyword, meesho_color in keyword_map:
        if keyword in spec_lower:
            return meesho_color, f"spec-match: '{keyword}' in '{spec_lower}'"
    
    # Fallback to image analysis
    if chromatic_colors:
        dominant_rgb = chromatic_colors[0][0]
        best_color = 'Multicolor'
        best_dist = float('inf')
        for name, ref_rgb in MEESHO_COLORS.items():
            if name == 'Black':
                continue  # Avoid Black unless clearly black
            dist = rgb_distance(dominant_rgb, ref_rgb)
            if dist < best_dist:
                best_dist = dist
                best_color = name
        return best_color, f"image-analysis: RGB{dominant_rgb}"
    
    return 'Multicolor', 'fallback'

# ============================================================================
# MAIN
# ============================================================================
print("=" * 80)
print("FIXING COLORS - USING NAME + SPEC + IMAGE ANALYSIS")
print("=" * 80)

wb = openpyxl.load_workbook(FIXED_XLSX)
ws = wb['Sarees-Fill this']

with open(r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\scraped_products.json", 'r', encoding='utf-8') as f:
    products_data = json.load(f)

product_specs = {}
for p in products_data:
    product_specs[p['name']] = p.get('specifications', {})

# Also handle the cleaned name case (coral -> soft pink)
for p in products_data:
    cleaned = p['name'].replace('Coral', 'Soft Pink').replace('coral', 'soft pink')
    if cleaned != p['name']:
        product_specs[cleaned] = p.get('specifications', {})

color_updates = []

for row in range(5, ws.max_row + 1):
    name = ws.cell(row=row, column=4).value
    if not name:
        break
    
    current_color = ws.cell(row=row, column=25).value
    sku = ws.cell(row=row, column=39).value
    
    specs = product_specs.get(name, {})
    spec_color = specs.get('color', '')
    
    # Find front image
    sku_dir = os.path.join(IMAGES_DIR, sku) if sku else None
    chromatic = []
    if sku_dir and os.path.isdir(sku_dir):
        for f_name in os.listdir(sku_dir):
            if 'image-1-front' in f_name:
                front_image = os.path.join(sku_dir, f_name)
                chromatic, achromatic = analyze_image_color(front_image)
                break
    
    new_color, reason = find_best_meesho_color(chromatic, spec_color, name)
    
    # Special handling for the Kanchi Cotton series with "–" in name
    if 'Kanchi Cotton Saree' in name and '–' in name:
        # Extract color from the part after "–"
        after_dash = name.split('–')[1].strip().lower()
        if 'mustard' in after_dash:
            new_color = 'Mustard'
            reason = 'kanchi-name-parse: mustard'
        elif 'grey' in after_dash:
            new_color = 'Grey'
            reason = 'kanchi-name-parse: grey'
        elif 'fuchsia' in after_dash or 'pink' in after_dash:
            new_color = 'Pink'
            reason = 'kanchi-name-parse: pink/fuchsia'
        elif 'peach' in after_dash:
            new_color = 'Peach'
            reason = 'kanchi-name-parse: peach'
    
    # Update
    ws.cell(row=row, column=25).value = new_color      # Color
    ws.cell(row=row, column=43).value = new_color       # Blouse Color (match saree)
    
    changed = '✓' if current_color != new_color else ''
    
    color_updates.append({
        'row': row,
        'product': name,
        'spec_color': spec_color,
        'old_color': current_color,
        'new_color': new_color,
        'reason': reason,
        'changed': bool(changed),
    })
    
    print(f"  [{row-4:2d}/42] {name[:55]:<55s} {current_color:>12} -> {new_color:<12} {changed} ({reason})")

# Save
wb.save(OUTPUT_XLSX)
print(f"\n{'='*80}")
print(f"SAVED TO: {OUTPUT_XLSX}")
print(f"{'='*80}")

# Summary
changes = sum(1 for u in color_updates if u['changed'])
print(f"\nTotal: {len(color_updates)} products | Changed: {changes} | Kept: {len(color_updates)-changes}")

print(f"\n{'='*80}")
print("FINAL COLOR ASSIGNMENTS")
print(f"{'='*80}")
print(f"{'#':>3} {'Product':<55} {'Color':<15} {'Source'}")
print("-" * 100)
for i, u in enumerate(color_updates):
    print(f"{i+1:3d} {u['product'][:54]:<55} {u['new_color']:<15} {u['reason']}")
