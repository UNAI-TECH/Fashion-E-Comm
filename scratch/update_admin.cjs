const fs = require('fs');

let code = fs.readFileSync('src/app/pages/admin/AdminAanyaPage.tsx', 'utf8');

// 1. Add state variables around line 450
const stateTarget = 'const [form, setForm] = useState(emptyForm);';
const stateReplacement = `const [form, setForm] = useState(emptyForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCustomMaterial, setIsCustomMaterial] = useState<boolean>(false);

  const PRESET_ADMIN_MATERIALS = [
    'Kanchi Cotton',
    'Viscose Sarees',
    'Fancy Sarees',
    'Checks Pedding',
    'Banarasi Fashion silk sarees',
  ];

  const availableMaterials = useMemo(() => {
    const mats = new Set<string>(PRESET_ADMIN_MATERIALS);
    dbProducts.forEach(p => {
      const m = (p.specifications?.material || p.material_type || p.material || '').trim();
      if (m && !PRESET_ADMIN_MATERIALS.some(pm => pm.toLowerCase() === m.toLowerCase())) {
        mats.add(m);
      }
    });
    return Array.from(mats);
  }, [dbProducts]);`;

if (!code.includes('editingProductId')) {
  code = code.replace(stateTarget, stateReplacement);
}

// 2. Add handleOpenEditProduct and handleToggleStock
const helperHook = '/* ─── Add product → Supabase & Local Storefront ─── */';
const helperAddition = `/* ─── Edit & Stock Helpers ─── */
  const handleOpenEditProduct = (prod: any) => {
    setEditingProductId(prod.id);
    const specMat = (prod.specifications?.material || prod.material_type || prod.material || '').trim();
    const isPreset = PRESET_ADMIN_MATERIALS.some(pm => pm.toLowerCase() === specMat.toLowerCase());

    setForm({
      ...emptyForm,
      name: prod.name || '',
      category: prod.category || 'Sarees',
      price: String(prod.price ?? ''),
      compare_at_price: prod.compare_at_price ? String(prod.compare_at_price) : '',
      stock_quantity: prod.stock_quantity ?? 0,
      image_url: prod.image_url || '',
      images: prod.images && prod.images.length > 0 ? prod.images : (prod.image_url ? [prod.image_url] : []),
      description: prod.description || '',
      status: prod.status || 'Published',
      spec_brand: prod.specifications?.brand || 'Aanya Fashions',
      spec_color: prod.specifications?.color || '',
      spec_material: specMat,
      spec_design: prod.specifications?.design || '',
      spec_pattern: prod.specifications?.pattern || '',
      spec_wash_care: prod.specifications?.wash_care || 'Dry Clean Only',
      spec_occasion: prod.specifications?.occasion || '',
      offer_enabled: !!prod.offer_enabled,
      offer_price: prod.offer_details?.offer_price ? String(prod.offer_details.offer_price) : '',
      coupon_discount: prod.offer_details?.coupon_discount ? String(prod.offer_details.coupon_discount) : '',
      applicable_on: prod.offer_details?.applicable_on || 'All Orders',
      coupon_code: prod.offer_details?.coupon_code || '',
      variants_enabled: false,
      material_type: isPreset ? specMat : (specMat ? 'Other' : ''),
      material_type_custom: isPreset ? '' : specMat,
    });
    setIsCustomMaterial(!isPreset && !!specMat);
    setIsAddOpen(true);
  };

  const handleToggleStock = async (product: any, forcedStock?: number) => {
    const currentStock = product.stock_quantity ?? 25;
    const newStock = forcedStock !== undefined ? forcedStock : (currentStock > 0 ? 0 : 25);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product.id);

      if (error) {
        toast.error('Failed to update stock: ' + error.message);
        return;
      }

      setDbProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newStock } : p));

      try {
        const bc = new BroadcastChannel('products_channel');
        bc.postMessage({ type: 'STOCK_UPDATED', id: product.id, stock_quantity: newStock });
        bc.close();
      } catch {}
      window.dispatchEvent(new Event('products_updated'));
      window.dispatchEvent(new Event('storage'));

      if (newStock === 0) {
        toast.success('"' + product.name + '" marked Out of Stock! (Customers cannot order this item)');
      } else {
        toast.success('"' + product.name + '" marked In Stock (' + newStock + ' units available)');
      }
    } catch (err: any) {
      toast.error('Failed to update stock: ' + err.message);
    }
  };

  /* ─── Add product → Supabase & Local Storefront ─── */`;

if (!code.includes('handleOpenEditProduct')) {
  code = code.replace(helperHook, helperAddition);
}

// 3. Update handleAddSubmit for Edit mode
const submitReplacement = `const finalMaterial = form.spec_material.trim();
      const baseOffer = form.offer_enabled ? {
        offer_price: form.offer_price ? parseFloat(form.offer_price) : null,
        coupon_discount: form.coupon_discount ? parseFloat(form.coupon_discount) : null,
        applicable_on: form.applicable_on.trim() || 'All Orders',
        coupon_code: form.coupon_code.trim().toUpperCase() || '',
      } : {};

      // ─── EDIT MODE: Update existing product in database ───
      if (editingProductId) {
        const updatePayload = {
          name: form.name.trim(),
          category: form.category,
          price: parseFloat(form.price),
          compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
          stock_quantity: Number(form.stock_quantity) || 0,
          image_url: primaryImg,
          images: guaranteedImages,
          description: form.description.trim() || null,
          status: form.status,
          specifications: {
            brand: form.spec_brand.trim() || 'Aanya Fashions',
            color: form.spec_color.trim() || '',
            material: finalMaterial || '',
            design: form.spec_design.trim() || '',
            pattern: form.spec_pattern.trim() || '',
            wash_care: form.spec_wash_care.trim() || 'Dry Clean Only',
            occasion: form.spec_occasion.trim() || '',
          },
          offer_enabled: form.offer_enabled,
          offer_details: baseOffer,
          material_type: finalMaterial,
        };

        const { data: updatedProduct, error: updateErr } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', editingProductId)
          .select()
          .single();

        if (updateErr) {
          toast.error('Failed to update product: ' + updateErr.message);
          setAdding(false);
          return;
        }

        const updatedItem = updatedProduct || { id: editingProductId, ...updatePayload };
        setDbProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, ...updatedItem } : p));

        try {
          const bc = new BroadcastChannel('products_channel');
          bc.postMessage({ type: 'PRODUCT_UPDATED', product: updatedItem });
          bc.close();
        } catch {}
        window.dispatchEvent(new Event('products_updated'));
        window.dispatchEvent(new Event('storage'));

        toast.success('"' + form.name.trim() + '" updated successfully!');
        setIsAddOpen(false);
        setEditingProductId(null);
        setForm(emptyForm);
        setIsCustomMaterial(false);
        setAdding(false);
        return;
      }`;

const fullSubmitBlock = /const baseOffer = form\.offer_enabled \? \{[\s\S]*?\} : \{\};/;
if (!code.includes('// ─── EDIT MODE: Update existing product')) {
  code = code.replace(fullSubmitBlock, submitReplacement);
}

// 4. Update Form Title
code = code.replace('<h2 className="font-serif text-base sm:text-xl font-bold text-gray-900 leading-tight">Add New Product</h2>', '<h2 className="font-serif text-base sm:text-xl font-bold text-gray-900 leading-tight">{editingProductId ? "Edit Product" : "Add New Product"}</h2>');
code = code.replace('<p className="text-[10px] sm:text-xs text-[#698156] font-medium">Publish directly to Supabase catalog & storefront</p>', '<p className="text-[10px] sm:text-xs text-[#698156] font-medium">{editingProductId ? "Update saved product specifications & live storefront details" : "Publish directly to Supabase catalog & storefront"}</p>');

// 5. Update close buttons to reset editingProductId
code = code.replaceAll('onClick={() => setIsAddOpen(false)}', 'onClick={() => { setIsAddOpen(false); setEditingProductId(null); setForm(emptyForm); setIsCustomMaterial(false); }}');

// 6. Update Material input to Dropdown with Other option
const matInputRegex = /<div>\s*<label className="block text-\[10px\] sm:text-\[11px\] uppercase tracking-wider font-bold text-gray-500 mb-1">Material<\/label>\s*<input[\s\S]*?onChange=\{e => setForm\(\{ \.\.\.form, spec_material: e\.target\.value \}\)\}[\s\S]*?\/>\s*<\/div>/;

const matDropdownReplacement = `<div className="col-span-2 sm:col-span-1">
                                  <label className="block text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-gray-500 mb-1">
                                    Material *
                                  </label>
                                  <select
                                    value={
                                      isCustomMaterial
                                        ? 'other'
                                        : (availableMaterials.find(m => m.toLowerCase() === (form.spec_material || '').toLowerCase()) || (form.spec_material ? 'other' : ''))
                                    }
                                    onChange={e => {
                                      const val = e.target.value;
                                      if (val === 'other') {
                                        setIsCustomMaterial(true);
                                        setForm({ ...form, spec_material: '' });
                                      } else {
                                        setIsCustomMaterial(false);
                                        setForm({ ...form, spec_material: val });
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 cursor-pointer font-medium"
                                  >
                                    <option value="">Select Material...</option>
                                    {availableMaterials.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                    <option value="other">+ Other (Add New Material)...</option>
                                  </select>

                                  {isCustomMaterial && (
                                    <div className="mt-2">
                                      <input
                                        type="text"
                                        required
                                        placeholder="Enter new material name (e.g. Banarasi Fashion silk sarees, Organza...)"
                                        value={form.spec_material}
                                        onChange={e => setForm({ ...form, spec_material: e.target.value })}
                                        className="w-full px-3 py-2 bg-[#F4F6F2] rounded-xl text-sm border border-[#DCE4D7] outline-none focus:ring-2 focus:ring-[#698156]/20 font-medium"
                                      />
                                      <p className="text-[10px] text-[#698156] font-medium mt-1">
                                        * This new material will immediately appear in the filter options on the main site.
                                      </p>
                                    </div>
                                  )}
                                </div>`;

code = code.replace(matInputRegex, matDropdownReplacement);

// 7. Update Submit button text
code = code.replace(`{adding ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Publishing…</span>
                            </>
                          ) : (
                            'Publish to Store'
                          )}`, `{adding ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>{editingProductId ? 'Saving Changes…' : 'Publishing…'}</span>
                            </>
                          ) : (
                            editingProductId ? 'Save Changes' : 'Publish to Store'
                          )}`);

// 8. Update Product Card in Grid: add Edit button and Out of Stock button
const deleteBtnBlock = /<button\s*type="button"\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setProductToDelete\(product\);\s*\}\}[\s\S]*?<\/button>/;

const editAndDeleteReplacement = `<button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditProduct(product);
                                }}
                                title="Edit product details"
                                className="absolute top-2 right-9 p-1.5 bg-white/95 hover:bg-[#F4F6F2] hover:text-[#698156] text-gray-700 rounded-md shadow-2xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductToDelete(product);
                                }}
                                title="Delete this product"
                                className="absolute top-2 right-2 p-1.5 bg-white/95 hover:bg-[#F4F6F2] hover:text-rose-600 text-gray-500 rounded-md shadow-2xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-105 active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>`;

code = code.replace(deleteBtnBlock, editAndDeleteReplacement);

// Add Out of Stock button right before Cart / Bill row
const priceRowBlock = /<span className="text-gray-400 line-through text-\[11px\]">₹\{product\.compare_at_price\.toLocaleString\('en-IN'\)\}<\/span>\s*\}\)\s*<\/div>\s*<\/div>/;

const priceRowWithStockBtn = `<span className="text-gray-400 line-through text-[11px]">₹{product.compare_at_price.toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                              </div>

                              {/* Out of Stock Toggle Button */}
                              <div className="pt-0.5">
                                {(product.stock_quantity ?? 25) === 0 ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStock(product, 25);
                                    }}
                                    className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                    title="Click to mark In Stock (25 units)"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Mark In Stock</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleStock(product, 0);
                                    }}
                                    className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                    title="Mark Out of Stock — customers will not be able to order this item on main site"
                                  >
                                    <Ban className="w-3 h-3 text-rose-600" />
                                    <span>Out of Stock</span>
                                  </button>
                                )}
                              </div>`;

code = code.replace(priceRowBlock, priceRowWithStockBtn);

// 9. Categories navigation hook
code = code.replace('<AdminCategories />', '<AdminCategories onSelectCategory={(catName) => { setSearchQuery(catName); setActiveTab("products"); }} />');

fs.writeFileSync('src/app/pages/admin/AdminAanyaPage.tsx', code, 'utf8');
console.log('Successfully updated AdminAanyaPage.tsx!');

