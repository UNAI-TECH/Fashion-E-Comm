"""
Phase 1: Analyze the Meesho bulk catalogue Excel template.
Extracts sheet names, column headers, data validations, formulas, and example data.
"""
import openpyxl
import json
import os

TEMPLATE_PATH = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\Sarees-10003-EXTERNAL-MeeshoTemplate2PricesGSTIN.xlsx"

wb = openpyxl.load_workbook(TEMPLATE_PATH, data_only=False)

report = {}

print("=" * 80)
print("MEESHO TEMPLATE ANALYSIS REPORT")
print("=" * 80)

# 1. List all sheets
print(f"\nWorksheets: {wb.sheetnames}")
report["worksheets"] = wb.sheetnames

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"\n{'='*80}")
    print(f"SHEET: '{sheet_name}'")
    print(f"Dimensions: {ws.dimensions}")
    print(f"Max Row: {ws.max_row}, Max Col: {ws.max_column}")
    
    sheet_info = {
        "dimensions": ws.dimensions,
        "max_row": ws.max_row,
        "max_col": ws.max_column,
        "headers": [],
        "validations": [],
        "sample_data": [],
        "formulas": [],
        "merged_cells": [str(mc) for mc in ws.merged_cells.ranges],
    }
    
    # Get headers (first few rows)
    print(f"\n--- Headers (first 3 rows) ---")
    for row_idx in range(1, min(4, ws.max_row + 1)):
        row_data = []
        for col_idx in range(1, ws.max_column + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            val = cell.value
            if val is not None:
                row_data.append(f"  Col {col_idx}: {repr(val)}")
        if row_data:
            print(f"  Row {row_idx}:")
            for rd in row_data:
                print(f"    {rd}")
    
    # Collect column headers from row 1 and row 2
    headers_row1 = {}
    headers_row2 = {}
    for col_idx in range(1, ws.max_column + 1):
        v1 = ws.cell(row=1, column=col_idx).value
        v2 = ws.cell(row=2, column=col_idx).value
        if v1:
            headers_row1[col_idx] = str(v1)
        if v2:
            headers_row2[col_idx] = str(v2)
    
    sheet_info["headers_row1"] = headers_row1
    sheet_info["headers_row2"] = headers_row2
    
    # Data validations
    if ws.data_validations and ws.data_validations.dataValidation:
        print(f"\n--- Data Validations ---")
        for dv in ws.data_validations.dataValidation:
            dv_info = {
                "type": dv.type,
                "formula1": str(dv.formula1) if dv.formula1 else None,
                "formula2": str(dv.formula2) if dv.formula2 else None,
                "allow_blank": dv.allow_blank,
                "cells": str(dv.sqref),
                "prompt": dv.prompt,
                "promptTitle": dv.promptTitle,
                "error": dv.error,
                "errorTitle": dv.errorTitle,
            }
            sheet_info["validations"].append(dv_info)
            print(f"  Cells: {dv.sqref} | Type: {dv.type} | Formula1: {dv.formula1} | AllowBlank: {dv.allow_blank}")
            if dv.prompt:
                print(f"    Prompt: {dv.prompt}")
    
    # Check for formulas in data rows
    if ws.max_row > 2:
        print(f"\n--- Formulas in Row 3 (first data row) ---")
        for col_idx in range(1, ws.max_column + 1):
            cell = ws.cell(row=3, column=col_idx)
            if cell.value and isinstance(cell.value, str) and cell.value.startswith("="):
                header = headers_row1.get(col_idx, headers_row2.get(col_idx, f"Col{col_idx}"))
                formula_info = {"col": col_idx, "header": header, "formula": cell.value}
                sheet_info["formulas"].append(formula_info)
                print(f"  Col {col_idx} ({header}): {cell.value}")
    
    # Sample data from example/data rows
    if sheet_name.lower().startswith("example") or "fill" in sheet_name.lower():
        print(f"\n--- Sample Data (rows 3-5) ---")
        for row_idx in range(3, min(6, ws.max_row + 1)):
            row_data = {}
            for col_idx in range(1, ws.max_column + 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                if cell.value is not None:
                    header = headers_row1.get(col_idx, headers_row2.get(col_idx, f"Col{col_idx}"))
                    row_data[f"Col{col_idx}_{header}"] = repr(cell.value)
            if row_data:
                sheet_info["sample_data"].append(row_data)
                print(f"  Row {row_idx}: {json.dumps(row_data, indent=4, default=str)}")

    report[sheet_name] = sheet_info

# Also check the Validation Sheet specifically for dropdown values
if "Validation Sheet" in wb.sheetnames:
    vs = wb["Validation Sheet"]
    print(f"\n{'='*80}")
    print("VALIDATION SHEET DETAILED CONTENTS")
    print(f"Max Row: {vs.max_row}, Max Col: {vs.max_column}")
    
    # Print headers
    val_headers = {}
    for col_idx in range(1, vs.max_column + 1):
        v = vs.cell(row=1, column=col_idx).value
        if v:
            val_headers[col_idx] = str(v)
            print(f"  Validation Col {col_idx}: {v}")
    
    # Print first 30 rows of each validation column
    for col_idx, header in val_headers.items():
        print(f"\n  --- {header} (Col {col_idx}) values ---")
        vals = []
        for row_idx in range(2, min(vs.max_row + 1, 100)):
            v = vs.cell(row=row_idx, column=col_idx).value
            if v is not None:
                vals.append(str(v))
        print(f"    Count: {len(vals)}")
        if vals:
            print(f"    Values: {vals[:50]}")

# Save full report
report_path = r"D:\Aanya Fashion Site\Fashion-E-Comm\Bulk-upload\template_analysis.json"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2, default=str)
print(f"\nFull report saved to: {report_path}")

wb.close()
