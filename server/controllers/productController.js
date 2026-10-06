import { supabase } from '../config/supabase.js';

// @desc    Fetch all products with pagination, search, and filters
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword ? req.query.keyword.trim() : '';
    const categoryFilter = req.query.category || '';
    const sort = req.query.sort || 'newest';
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const inStock = req.query.inStock === 'true';

    // Calculate ranges for pagination in Supabase
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('products')
      .select('*, product_variants(*)', { count: 'exact' });

    // Status filter - only published products for public
    if (req.user?.role !== 'admin') {
      query = query.or('status.eq.Published,status.is.null');
    }

    // Keyword search: Try Full-Text search vector first, or fallback to ILIKE
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`);
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'All') {
      query = query.ilike('category', `%${categoryFilter}%`);
    }

    // Price range filters
    if (minPrice !== null && !isNaN(minPrice)) {
      query = query.gte('price', minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      query = query.lte('price', maxPrice);
    }

    // Stock availability
    if (inStock) {
      query = query.gt('stock_quantity', 0);
    }

    // Sorting
    if (sort === 'price-asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price-desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('rating', { ascending: false });
    } else {
      // Default: newest
      query = query.order('created_at', { ascending: false });
    }

    const { data: products, count, error } = await query.range(from, to);

    if (error) throw error;

    res.json({
      products: products || [],
      page,
      pages: Math.ceil((count || 0) / pageSize),
      count: count || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Fetch single product by ID or Slug with variants and images
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is UUID or slug/other
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*),
        product_images (image_url, sort_order, alt_text)
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product with variants & images (Admin)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      images = [],
      category,
      stock = 10,
      discount = 0,
      sizes = ['S', 'M', 'L', 'XL'],
      colors = [],
      variants = []
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Product name, price, and category are required.'
      });
    }

    const comparePrice = discount > 0 ? Math.round(Number(price) / (1 - Number(discount) / 100)) : null;

    // 1. Insert product
    const { data: createdProduct, error } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        price: Number(price),
        compare_at_price: comparePrice,
        description: description || '',
        images: Array.isArray(images) ? images : [images],
        category: category.trim(),
        stock_quantity: Number(stock),
        status: 'Published'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    // 2. Insert variants if provided or generate default size variants
    const variantRecords = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        variantRecords.push({
          product_id: createdProduct.id,
          sku: v.sku || `${createdProduct.id.slice(0, 6)}-${v.size}`,
          size: v.size,
          color: v.color || null,
          stock_quantity: Number(v.stock_quantity || Math.floor(stock / variants.length)),
          price_override: v.price_override ? Number(v.price_override) : null
        });
      }
    } else if (Array.isArray(sizes) && sizes.length > 0) {
      const perSizeStock = Math.max(1, Math.floor(Number(stock) / sizes.length));
      for (const s of sizes) {
        variantRecords.push({
          product_id: createdProduct.id,
          sku: `${createdProduct.id.slice(0, 8)}-${s}`,
          size: s,
          stock_quantity: perSizeStock
        });
      }
    }

    if (variantRecords.length > 0) {
      await supabase.from('product_variants').insert(variantRecords).catch(console.error);
    }

    // 3. Insert product_images records if provided
    if (Array.isArray(images) && images.length > 0) {
      const imgRecords = images.map((url, index) => ({
        product_id: createdProduct.id,
        image_url: url,
        sort_order: index
      }));
      await supabase.from('product_images').insert(imgRecords).catch(console.error);
    }

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product with variants (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { name, price, description, images, category, stock, discount, status } = req.body;
    const { id } = req.params;

    const updates = { updated_at: new Date() };
    if (name) updates.name = name.trim();
    if (price !== undefined) updates.price = Number(price);
    if (description !== undefined) updates.description = description;
    if (images) updates.images = Array.isArray(images) ? images : [images];
    if (category) updates.category = category.trim();
    if (stock !== undefined) updates.stock_quantity = Number(stock);
    if (status) updates.status = status;
    if (discount !== undefined && price !== undefined) {
      updates.compare_at_price = discount > 0 ? Math.round(Number(price) / (1 - Number(discount) / 100)) : null;
    }

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
