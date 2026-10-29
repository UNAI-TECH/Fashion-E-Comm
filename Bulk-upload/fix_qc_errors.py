"""
Fix all Meesho QC errors in the error file.
Errors identified:
1. COLUMN SWAP: Error file has Col6=MeeshoPrice, Col7=DefectivePrice, Col8=MRP 
   (original had Col6=MRP, Col7=MeeshoPrice, Col8=DefectivePrice)
   So values got swapped: MRP=807 (was defective), MeeshoPrice=1449 (was MRP), Defective=949 (was selling)
2. MRP MARGIN: MRP must be significantly higher than MeeshoPrice for reseller margin
3. MANUFACTURER/PACKER/IMPORTER: All missing - now provided by user
4. GST: Only 18 and 5 are valid (not 12)
5. NET QUANTITY: "Pack of 1" is not valid - must be "Single"
6. GENERIC NAME: "Saree" is not valid - must be "Sarees"
7. BORDER: "Woven" is not valid - must be "Woven Design" or "Zari"
8. KEYWORD WARNINGS: "coral" is ERROR keyword, "maroon","elegant","an" are warnings in descriptions
"""

import openpyxl
import sys
import re
import json
import os

sys.stdout.reconfigure(encoding='utf-8')

ERROR_PATH = r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\1792826467501378579-1-ea5a86b3412b4b3d8ea82f1bf6766d30_1792826467080-507078.xlsx'
OUTPUT_PATH = r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\Aanya_Fashions_Meesho_Bulk_Catalogue_FIXED.xlsx'

wb = openpyxl.load_workbook(ERROR_PATH)
ws = wb['Sarees-Fill this']

# Manufacturer and Packer details (provided by user)
MFG_NAME = "Aanya Fashions"
MFG_ADDRESS = "36/11 Bose Street, Kodungaiyur (East), Vyasarbadi"
MFG_PINCODE = "600118"
PACKER_NAME = "Aanya Fashions"
PACKER_ADDRESS = "36/11 Bose Street, Kodungaiyur (East), Vyasarbadi"
PACKER_PINCODE = "600118"
# Importer - same as manufacturer for India-made products
IMPORTER_NAME = "Aanya Fashions"
IMPORTER_ADDRESS = "36/11 Bose Street, Kodungaiyur (East), Vyasarbadi"
IMPORTER_PINCODE = "600118"

# ERROR FILE COLUMN MAP (different from original template!)
# Col 2 = ERROR STATUS
# Col 3 = ERROR MESSAGE
# Col 4 = Product Name
# Col 5 = Variation
# Col 6 = Meesho Price (SELLING PRICE)
# Col 7 = Wrong/Defective Returns Price
# Col 8 = MRP
# Col 9 = GST %
# Col 10 = HSN ID
# Col 11 = Net Weight (gms)
# Col 12 = Inventory
# Col 13 = Country of Origin
# Col 14-16 = Manufacturer Name/Address/Pincode
# Col 17-19 = Packer Name/Address/Pincode
# Col 20-22 = Importer Name/Address/Pincode
# Col 23 = Blouse
# Col 24 = Border
# Col 25 = Color
# Col 26 = Generic Name
# Col 27 = Net Quantity (N)
# Col 28 = Print or Pattern Type
# Col 29 = Saree Fabric
# Col 30 = Transparency
# Col 31 = Type
# Col 32 = Blouse Length Size
# Col 33 = Saree Length Size
# Col 34-37 = Image 1-4
# Col 38 = Style ID
# Col 39 = SKU ID
# Col 40 = Brand Name
# Col 41 = Group ID
# Col 42 = Product Description
# Col 43 = Blouse Color
# Col 44 = Blouse Fabric
# Col 45 = Blouse Pattern
# Col 46 = Border Width
# Col 47 = Brand
# Col 48 = Loom Type
# Col 49 = Occasion
# Col 50 = Ornamentation
# Col 51 = Pallu Details
# Col 52 = Pattern

# Meesho-prohibited keywords to clean from descriptions
ERROR_KEYWORDS = ['coral']  # "coral" is marked as Error
WARNING_KEYWORDS = ['maroon', 'elegant']  # These are warnings - Meesho says "you can keep warning keywords"

def clean_description(desc):
    """Remove error keywords from product descriptions."""
    if not desc:
        return desc
    
    cleaned = desc
    # Remove ERROR keywords (case-insensitive word replacement)
    for kw in ERROR_KEYWORDS:
        # Replace the word with a suitable alternative
        replacements = {
            'coral': 'soft pink',
        }
        replacement = replacements.get(kw, '')
        # Case-insensitive replacement preserving sentence structure
        pattern = re.compile(re.escape(kw), re.IGNORECASE)
        cleaned = pattern.sub(replacement, cleaned)
    
    # Clean up any double spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

def clean_product_name(name):
    """Remove error keywords from product name."""
    if not name:
        return name
    cleaned = name
    for kw in ERROR_KEYWORDS:
        replacements = {
            'coral': 'Soft Pink',
        }
        replacement = replacements.get(kw, '')
        pattern = re.compile(re.escape(kw), re.IGNORECASE)
        cleaned = pattern.sub(replacement, cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

fixes_log = []
product_count = 0

for row in range(5, ws.max_row + 1):
    name = ws.cell(row=row, column=4).value
    if not name:
        break
    
    product_count += 1
    row_fixes = []
    
    # ===== FIX 1: PRICE COLUMNS (CRITICAL) =====
    # Current state in error file: Col6=MeeshoPrice, Col7=DefectivePrice, Col8=MRP
    # The values got SWAPPED during our original fill because the original template had
    # Col6=MRP, Col7=MeeshoPrice, Col8=DefectivePrice
    # So current: Col6 has what we put as MRP, Col7 has MeeshoPrice, Col8 has DefectivePrice
    
    current_col6 = ws.cell(row=row, column=6).value  # This has our MRP value
    current_col7 = ws.cell(row=row, column=7).value  # This has our selling price
    current_col8 = ws.cell(row=row, column=8).value  # This has our defective price
    
    # In the error file: Col6=MeeshoPrice, Col7=DefectivePrice, Col8=MRP
    # Our original MRP was in col6 (which was col6=MRP in original template)
    # Our selling price was in col7 (which was col7=MeeshoPrice in original template)  
    # Our defective price was in col8 (which was col8=DefectivePrice in original template)
    
    # The actual original prices from our data:
    # MRP values we used: 1449 (fancy), 899 (checks), 1199 (viscose), 949 (zari), 2499 (kanchi)
    # Selling prices: 949, 599, 799, 649, 1999
    
    # Current data shows: Col6=1449, Col7=949, Col8=807 for first row
    # That means: MeeshoPrice=1449 (should be selling), DefectivePrice=949 (should be defective), MRP=807 (should be MRP)
    # So the data is: our MRP ended up in MeeshoPrice col, our selling in Defective col, our defective in MRP col!
    
    # FIX: Set correct values
    # Our original MRP = current_col6 (1449)
    # Our selling price = current_col7 (949)  
    # Our defective = current_col8 (807)
    
    original_mrp = current_col6    # e.g., 1449
    selling_price = current_col7   # e.g., 949
    
    # MRP must be higher than Meesho Price by at least ~10% for reseller margin
    # Meesho error says "MRP should be greater than listing price by X Rs"
    # The margin needs to be significant - typically MRP should be 15-25% above selling price
    # Let's set MRP to be ~25% above selling price (minimum)
    
    min_mrp_needed = round(selling_price * 1.25)
    # Use the higher of our original MRP or the minimum needed
    new_mrp = max(original_mrp, min_mrp_needed)
    # Round to nice number
    if new_mrp < 1000:
        new_mrp = ((new_mrp + 49) // 50) * 50  # Round up to nearest 50
    else:
        new_mrp = ((new_mrp + 99) // 100) * 100  # Round up to nearest 100
    
    new_meesho_price = selling_price
    new_defective_price = round(selling_price * 0.80)  # 80% of selling price
    
    # Ensure defective < meesho < MRP
    if new_defective_price >= new_meesho_price:
        new_defective_price = new_meesho_price - 50
    if new_meesho_price >= new_mrp:
        new_mrp = new_meesho_price + round(new_meesho_price * 0.25)
    
    ws.cell(row=row, column=6).value = new_meesho_price     # Meesho Price
    ws.cell(row=row, column=7).value = new_defective_price   # Defective Price
    ws.cell(row=row, column=8).value = new_mrp               # MRP
    
    row_fixes.append(f'Prices fixed: MeeshoPrice={new_meesho_price}, Defective={new_defective_price}, MRP={new_mrp} (was {current_col6}/{current_col7}/{current_col8})')
    
    # ===== FIX 2: MANUFACTURER DETAILS =====
    ws.cell(row=row, column=14).value = MFG_NAME
    ws.cell(row=row, column=15).value = MFG_ADDRESS
    ws.cell(row=row, column=16).value = MFG_PINCODE
    row_fixes.append('Manufacturer details filled')
    
    # ===== FIX 3: PACKER DETAILS =====
    ws.cell(row=row, column=17).value = PACKER_NAME
    ws.cell(row=row, column=18).value = PACKER_ADDRESS
    ws.cell(row=row, column=19).value = PACKER_PINCODE
    row_fixes.append('Packer details filled')
    
    # ===== FIX 4: IMPORTER DETAILS =====
    ws.cell(row=row, column=20).value = IMPORTER_NAME
    ws.cell(row=row, column=21).value = IMPORTER_ADDRESS
    ws.cell(row=row, column=22).value = IMPORTER_PINCODE
    row_fixes.append('Importer details filled')
    
    # ===== FIX 5: GST % =====
    # Only valid values are 18 and 5 (from validation sheet)
    # Textiles (sarees) = 5% GST
    current_gst = ws.cell(row=row, column=9).value
    if current_gst not in [5, 18, '5', '18']:
        ws.cell(row=row, column=9).value = 5
        row_fixes.append(f'GST fixed: {current_gst} -> 5')
    else:
        # Ensure it's stored as number, not string
        ws.cell(row=row, column=9).value = int(current_gst) if current_gst else 5
    
    # ===== FIX 6: NET QUANTITY =====
    # "Pack of 1" is not valid - valid values are: Pack of 2-10, Single, Saree With X
    # For single saree: "Single"
    current_net_qty = ws.cell(row=row, column=27).value
    if current_net_qty == 'Pack of 1' or current_net_qty not in [
        'Pack of 10', 'Pack of 12', 'Pack of 2', 'Pack of 3', 'Pack of 4',
        'Pack of 5', 'Pack of 6', 'Pack of 7', 'Pack of 8', 'Pack of 9',
        'Saree With Mundu', 'Saree with Bag', 'Saree with Jewelry',
        'Saree with Kurta', 'Saree with Kurti', 'Single'
    ]:
        ws.cell(row=row, column=27).value = 'Single'
        row_fixes.append(f'Net Quantity fixed: "{current_net_qty}" -> "Single"')
    
    # ===== FIX 7: GENERIC NAME =====
    # "Saree" is not valid - valid: Accessories, Bottom Wear, Garment, Others, Sarees, Sportswear, Topwear, Undergarment
    current_generic = ws.cell(row=row, column=26).value
    if current_generic == 'Saree' or current_generic not in [
        'Accessories', 'Bottom Wear', 'Garment', 'Others', 'Sarees',
        'Sportswear', 'Topwear', 'Undergarment'
    ]:
        ws.cell(row=row, column=26).value = 'Sarees'
        row_fixes.append(f'Generic Name fixed: "{current_generic}" -> "Sarees"')
    
    # ===== FIX 8: BORDER =====
    # "Woven" is not valid - valid: Embellished, Embroidered, Lace, No Border, Printed, Solid, Temple Border, Woven Design, Zari
    current_border = ws.cell(row=row, column=24).value
    valid_borders = ['Embellished', 'Embroidered', 'Lace', 'No Border', 'Printed', 'Solid', 'Temple Border', 'Woven Design', 'Zari']
    if current_border and current_border not in valid_borders:
        if 'woven' in str(current_border).lower():
            ws.cell(row=row, column=24).value = 'Woven Design'
            row_fixes.append(f'Border fixed: "{current_border}" -> "Woven Design"')
        elif 'zari' in str(current_border).lower():
            ws.cell(row=row, column=24).value = 'Zari'
            row_fixes.append(f'Border fixed: "{current_border}" -> "Zari"')
    
    # ===== FIX 9: KEYWORD ERRORS IN PRODUCT NAME =====
    current_name = ws.cell(row=row, column=4).value
    if current_name:
        cleaned_name = clean_product_name(current_name)
        if cleaned_name != current_name:
            ws.cell(row=row, column=4).value = cleaned_name
            row_fixes.append(f'Product name cleaned: "{current_name}" -> "{cleaned_name}"')
    
    # ===== FIX 10: KEYWORD ERRORS IN DESCRIPTION =====
    current_desc = ws.cell(row=row, column=42).value
    if current_desc:
        cleaned_desc = clean_description(current_desc)
        if cleaned_desc != current_desc:
            ws.cell(row=row, column=42).value = cleaned_desc
            row_fixes.append('Description cleaned (removed "coral" keyword)')
    
    # ===== FIX 11: CLEAR ERROR STATUS AND MESSAGE =====
    ws.cell(row=row, column=2).value = None  # Clear ERROR STATUS
    ws.cell(row=row, column=3).value = None  # Clear ERROR MESSAGE
    row_fixes.append('Error status/message cleared')
    
    # Log
    fixes_log.append({
        'row': row,
        'product': name,
        'fixes': row_fixes,
        'prices': {
            'meesho_price': new_meesho_price,
            'defective_price': new_defective_price,
            'mrp': new_mrp
        }
    })
    
    print(f'[{product_count}/42] Row {row}: {name}')
    for fix in row_fixes:
        print(f'  ✓ {fix}')

# Save the fixed workbook
wb.save(OUTPUT_PATH)
print(f'\n{"="*80}')
print(f'FIXED WORKBOOK SAVED TO: {OUTPUT_PATH}')
print(f'{"="*80}')

# Print summary
print(f'\nTotal products fixed: {product_count}')
print(f'\nFixes applied per category:')

fix_counts = {}
for entry in fixes_log:
    for fix in entry['fixes']:
        category = fix.split(':')[0].split('fixed')[0].split('filled')[0].split('cleaned')[0].strip()
        fix_counts[category] = fix_counts.get(category, 0) + 1

for cat, count in sorted(fix_counts.items()):
    print(f'  {cat}: {count} rows')

# Print price table
print(f'\n{"="*80}')
print('PRICE TABLE (Corrected)')
print(f'{"="*80}')
print(f'{"Product":<55} {"MeeshoPrice":>12} {"Defective":>10} {"MRP":>8}')
print('-' * 90)
for entry in fixes_log:
    p = entry['prices']
    print(f'{entry["product"][:54]:<55} {p["meesho_price"]:>12} {p["defective_price"]:>10} {p["mrp"]:>8}')

# Verify the fix
print(f'\n{"="*80}')
print('VERIFICATION')
print(f'{"="*80}')
wb2 = openpyxl.load_workbook(OUTPUT_PATH)
ws2 = wb2['Sarees-Fill this']
issues = []
for row in range(5, 5 + product_count):
    mp = ws2.cell(row=row, column=6).value
    dp = ws2.cell(row=row, column=7).value
    mrp = ws2.cell(row=row, column=8).value
    mfg = ws2.cell(row=row, column=14).value
    nq = ws2.cell(row=row, column=27).value
    gn = ws2.cell(row=row, column=26).value
    gst = ws2.cell(row=row, column=9).value
    err = ws2.cell(row=row, column=2).value
    
    if mrp and mp and mrp <= mp:
        issues.append(f'Row {row}: MRP ({mrp}) <= MeeshoPrice ({mp})')
    if mp and dp and dp >= mp:
        issues.append(f'Row {row}: Defective ({dp}) >= MeeshoPrice ({mp})')
    if not mfg:
        issues.append(f'Row {row}: Missing manufacturer')
    if nq not in ['Single', 'Pack of 2', 'Pack of 3', 'Pack of 4', 'Pack of 5',
                   'Pack of 6', 'Pack of 7', 'Pack of 8', 'Pack of 9', 'Pack of 10', 'Pack of 12',
                   'Saree With Mundu', 'Saree with Bag', 'Saree with Jewelry',
                   'Saree with Kurta', 'Saree with Kurti']:
        issues.append(f'Row {row}: Invalid Net Quantity: {nq}')
    if gn not in ['Accessories', 'Bottom Wear', 'Garment', 'Others', 'Sarees',
                   'Sportswear', 'Topwear', 'Undergarment']:
        issues.append(f'Row {row}: Invalid Generic Name: {gn}')
    if gst not in [5, 18]:
        issues.append(f'Row {row}: Invalid GST: {gst}')
    if err:
        issues.append(f'Row {row}: Error status not cleared: {err}')

if issues:
    print(f'REMAINING ISSUES ({len(issues)}):')
    for i in issues:
        print(f'  ⚠ {i}')
else:
    print('✅ ALL ISSUES RESOLVED - No validation errors found!')

wb2.close()
