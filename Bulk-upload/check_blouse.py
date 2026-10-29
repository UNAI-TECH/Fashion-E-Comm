import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open(r'D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\output\scraped_products.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

for p in scraped:
    desc = p.get('description', '')
    spec = p.get('specifications', {})
    name = p.get('name', '')
    
    blouse_info = []
    for line in desc.split('\n'):
        if 'blouse' in line.lower():
            blouse_info.append(line.strip())
    for k, v in spec.items():
        if 'blouse' in k.lower() or 'blouse' in str(v).lower():
            blouse_info.append(f"{k}: {v}")
            
    if blouse_info:
        info_str = " ; ".join(blouse_info)
        print(f"{name[:45]:45s} | {info_str[:80]}")
    else:
        print(f"{name[:45]:45s} | NO BLOUSE MENTION")
