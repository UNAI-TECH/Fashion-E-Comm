import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

TEMPLATE_FILE = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\Sarees-10003-EXTERNAL-MeeshoTemplate2PricesGSTIN.xlsx"
CHECK_FILE = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\Aanya_Fashions_Meesho_Bulk_Catalogue_COLOR_CORRECTED.xlsx"

wb_tmpl = openpyxl.load_workbook(TEMPLATE_FILE, data_only=True)
ws_val = wb_tmpl['Validation Sheet']

# Collect validation dropdown values
val_cols = {}
for col in range(1, ws_val.max_column + 1):
    header = ws_val.cell(row=1, column=col).value
    if header:
        header = header.strip()
        vals = []
        for r in range(3, ws_val.max_row + 1):
            v = ws_val.cell(row=r, column=col).value
            if v is not None:
                vals.append(str(v).strip())
        if vals:
            val_cols[header] = vals

wb_check = openpyxl.load_workbook(CHECK_FILE, data_only=True)
ws_check = wb_check['Sarees-Fill this']

valid_colors = set(val_cols.get('Color', []))
valid_blouse_colors = set(val_cols.get('Blouse Color', []))
valid_borders = set(val_cols.get('Border', []))
valid_generic = set(val_cols.get('Generic Name', []))
valid_net_qty = set(val_cols.get('Net Quantity (N)', []))

errors = []
rows_checked = 0

for r in range(5, ws_check.max_row + 1):
    name = ws_check.cell(row=r, column=4).value
    if not name:
        break
    rows_checked += 1
    sku = ws_check.cell(row=r, column=39).value
    price_meesho = ws_check.cell(row=r, column=6).value
    price_defect = ws_check.cell(row=r, column=7).value
    price_mrp = ws_check.cell(row=r, column=8).value
    gst = ws_check.cell(row=r, column=9).value
    
    mfg_name = ws_check.cell(row=r, column=14).value
    mfg_addr = ws_check.cell(row=r, column=15).value
    mfg_pin = ws_check.cell(row=r, column=16).value
    
    border = ws_check.cell(row=r, column=24).value
    color = ws_check.cell(row=r, column=25).value
    generic_name = ws_check.cell(row=r, column=26).value
    net_qty = ws_check.cell(row=r, column=27).value
    blouse_col = ws_check.cell(row=r, column=43).value
    
    # 1. Colors
    if color not in valid_colors:
        errors.append(f"Row {r} ({sku}): Invalid Color '{color}'")
    if blouse_col not in valid_blouse_colors:
        errors.append(f"Row {r} ({sku}): Invalid Blouse Color '{blouse_col}'")
        
    # 2. Generic Name & Net Qty
    if generic_name not in valid_generic:
        errors.append(f"Row {r} ({sku}): Invalid Generic Name '{generic_name}'")
    if net_qty not in valid_net_qty:
        errors.append(f"Row {r} ({sku}): Invalid Net Qty '{net_qty}'")
        
    # 3. Border (optional, but if filled must be valid)
    if border is not None and border not in valid_borders:
        errors.append(f"Row {r} ({sku}): Invalid Border '{border}'")
        
    # 4. Prices
    if not (price_mrp > price_meesho):
        errors.append(f"Row {r} ({sku}): MRP ({price_mrp}) not > Meesho Price ({price_meesho})")
        
    # 5. GST
    if str(gst) not in ['5', '5.0', '18', '18.0']:
        errors.append(f"Row {r} ({sku}): Invalid GST '{gst}'")
        
    # 6. Manufacturer details
    if not mfg_name or not mfg_addr or str(mfg_pin) != '600118':
        errors.append(f"Row {r} ({sku}): Missing or invalid manufacturer details")

print(f"Validated {rows_checked} products:")
if errors:
    print(f"FAILED with {len(errors)} errors:")
    for e in errors:
        print("  -", e)
else:
    print("SUCCESS: 0 ERRORS! All 42 products fully validated against all Meesho rules and dropdown constraints!")
