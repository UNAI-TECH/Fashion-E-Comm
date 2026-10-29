import openpyxl
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# The 51 valid colors from Meesho Validation Sheet Column Y
VALID_MEESHO_COLORS = [
    'Aqua Blue', 'Baby Blue', 'Beige', 'Black', 'Blue', 'Bronze', 'Brown', 'Copper',
    'Coral', 'Cream', 'Dark Pink', 'Gajari', 'Gold', 'Green', 'Grey', 'Grey Melange',
    'Indigo', 'Khaki', 'Lavender', 'Lemon Yellow', 'Maroon', 'Mehendi', 'Metallic',
    'Mint Green', 'Multicolor', 'Mustard', 'Navy Blue', 'Nude', 'Olive', 'Orange',
    'Pastel Blue', 'Pastel Brown', 'Pastel Orange', 'Pastel Pink', 'Pastel Red',
    'Pastel Yellow', 'Peach', 'Pink', 'Purple', 'Rama', 'Rani', 'Red', 'Rust',
    'Sage', 'Silver', 'Sky Blue', 'Teal', 'Tricolor', 'Turquoise', 'White', 'Yellow'
]

# Let's map every single one of the 42 products with full precision
# Main saree body color (NOT border, NOT contrast pallu):

MAPPING = {
    # 1. Teal Green body with Maroon Red border & gold zari
    'AF-SAR-TEALGREE-001': ('Teal', 'Teal Green body (maroon is border/pallu)'),
    
    # 2. Royal Purple body with Blue/Teal border & gold zari
    'AF-SAR-ROYALPUR-002': ('Purple', 'Royal Purple body (blue/teal is border)'),
    
    # 3. Plum Purple body with Teal border & gold zari
    'AF-SAR-PLUMPURP-003': ('Purple', 'Plum Purple body (teal is border)'),
    
    # 4. Magenta body with Teal Blue border & gold zari
    'AF-SAR-MAGENTAT-004': ('Rani', 'Magenta body (Rani pink in Indian ethnic wear, teal is border)'),
    
    # 5. Golden Yellow body with Red border & gold brocade
    'AF-SAR-GOLDENYE-005': ('Yellow', 'Golden Yellow body (red is border/pallu)'),
    
    # 6. Dark Green body with Red border & gold zari
    'AF-SAR-GREENRED-006': ('Green', 'Dark Green body (red is border/pallu)'),
    
    # 7. Rust Orange body with gold checks
    'AF-SAR-RUSTORAN-007': ('Rust', 'Rust Orange body'),
    
    # 8. Raspberry Pink body with gold checks
    'AF-SAR-RASPBERR-008': ('Pink', 'Raspberry Pink body'),
    
    # 9. Plum Purple body with gold checks
    'AF-SAR-PLUMPURP-009': ('Purple', 'Plum Purple body'),
    
    # 10. Rose Pink body with gold checks
    'AF-SAR-ROSEPINK-010': ('Pink', 'Rose Pink body'),
    
    # 11. Mauve body with gold checks
    'AF-SAR-MAUVEGOL-011': ('Lavender', 'Mauve body (Lavender in Meesho dropdown)'),
    
    # 12. Teal Blue body with gold checks
    'AF-SAR-TEALBLUE-012': ('Teal', 'Teal Blue body'),
    
    # 13. Navy Blue body with gold checks
    'AF-SAR-NAVYBLUE-013': ('Navy Blue', 'Navy Blue body'),
    
    # 14. Emerald Green body with gold checks
    'AF-SAR-EMERALDG-014': ('Green', 'Emerald Green body'),
    
    # 15. Royal Plum body with gold checks
    'AF-SAR-ROYALPLU-015': ('Purple', 'Royal Plum body'),
    
    # 16. Parrot Green body with black contrast border
    'AF-SAR-PARROTGR-016': ('Green', 'Parrot Green body (black is contrast)'),
    
    # 17. Magenta Pink body with black contrast border
    'AF-SAR-MAGENTAP-017': ('Pink', 'Magenta Pink body (black is contrast)'),
    
    # 18. Soft Pink (Coral Pink) body with purple contrast border
    'AF-SAR-CORALPIN-018': ('Peach', 'Coral / Soft Pink body (peach/soft pink tone, purple is contrast)'),
    
    # 19. Ivory Gold body with maroon contrast border
    'AF-SAR-IVORYGOL-019': ('Cream', 'Ivory Gold body (maroon is contrast border)'),
    
    # 20. Champagne Gold body with maroon contrast border
    'AF-SAR-CHAMPAGN-020': ('Gold', 'Champagne Gold body (maroon is contrast border)'),
    
    # 21. Aqua Blue body with gold stripes & black contrast
    'AF-SAR-AQUABLUE-021': ('Aqua Blue', 'Aqua Blue body (exact match in Meesho dropdown)'),
    
    # 22. Royal Blue body with antique gold brocade
    'AF-SAR-ROYALBLU-022': ('Blue', 'Royal Blue body'),
    
    # 23. Peacock Teal Blue body with antique gold zari
    'AF-SAR-PEACOCKT-023': ('Teal', 'Peacock Teal Blue body'),
    
    # 24. Royal Plum Purple body with antique gold zari
    'AF-SAR-ROYALPLU-024': ('Purple', 'Royal Plum Purple body'),
    
    # 25. Navy Blue body with antique gold zari
    'AF-SAR-NAVYBLUE-025': ('Navy Blue', 'Navy Blue body'),
    
    # 26. Maroon Red body with gold zari
    'AF-SAR-MAROONRE-026': ('Maroon', 'Maroon Red body'),
    
    # 27. Mustard Yellow body with antique gold zari
    'AF-SAR-MUSTARDY-027': ('Mustard', 'Mustard Yellow body'),
    
    # 28. Fuchsia Pink body with gold zari
    'AF-SAR-FUCHSIAP-028': ('Pink', 'Fuchsia Pink body'),
    
    # 29. Emerald Green body with antique gold checked
    'AF-SAR-EMERALDG-029': ('Green', 'Emerald Green body'),
    
    # 30. Dark Emerald Green body with antique gold zari
    'AF-SAR-DARKEMER-030': ('Green', 'Dark Emerald Green body'),
    
    # 31. Royal Blue body with antique gold zari checked
    'AF-SAR-ROYALBLU-031': ('Blue', 'Royal Blue body'),
    
    # 32. Deep Teal Blue body with antique gold checked
    'AF-SAR-TEALBLUE-032': ('Teal', 'Teal Blue body'),
    
    # 33. Dark Blackish Purple body with peacock zari border
    'AF-SAR-DARKBLAC-033': ('Purple', 'Dark Blackish Purple body'),
    
    # 34. Royal Purple body with elephant zari border
    'AF-SAR-ROYALPUR-034': ('Purple', 'Royal Purple body'),
    
    # 35. Royal Blueberry Blue body with elephant zari border
    'AF-SAR-ROYALBLU-035': ('Blue', 'Royal Blueberry Blue body'),
    
    # 36. Royal Blue body with gold zari border
    'AF-SAR-ROYALBLU-036': ('Blue', 'Royal Blue body'),
    
    # 37. Dark Teal Green body with elephant zari border
    'AF-SAR-DARKTEAL-037': ('Teal', 'Dark Teal Green body'),
    
    # 38. Emerald Green body with gold zari border
    'AF-SAR-EMERALDG-038': ('Green', 'Emerald Green body'),
    
    # 39. Mustard Yellow body with antique gold zari border
    'AF-SAR-KANCHICO-039': ('Mustard', 'Mustard Yellow body (antique gold is border)'),
    
    # 40. Grey body with black & gold zari border
    'AF-SAR-KANCHICO-040': ('Grey', 'Grey body (black & gold is border)'),
    
    # 41. Fuchsia Pink body with maroon gold zari border
    'AF-SAR-KANCHICO-041': ('Pink', 'Fuchsia Pink body (maroon & gold is border)'),
    
    # 42. Peach / Soft Pink body with maroon zari border
    'AF-SAR-KANCHICO-042': ('Peach', 'Peach / Soft Pink body (maroon is border)')
}

# Verify all colors are strictly in VALID_MEESHO_COLORS
for sku, (col, reason) in MAPPING.items():
    assert col in VALID_MEESHO_COLORS, f"Invalid color '{col}' for SKU {sku}!"

print(f"All {len(MAPPING)} SKU mappings verified against Meesho validation list!")
