import { supabase } from '../config/supabase.js';

// @desc    Fetch all products with pagination, search, and filter
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 12;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword || '';
    const categoryFilter = req.query.category || '';

    // Calculate ranges for pagination in Supabase
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select(`*, category:categories(name)`, { count: 'exact' });

    if (keyword) {
      query = query.ilike('name', `%${keyword}%`);
    }
    
    // In our initial schema, category_id is used. If filtering by category name, 
    // it requires joining or passing category_id. We'll assume category_id is passed for now
    // or we fetch category by name first.
    if (categoryFilter) {
      query = query.eq('category_id', categoryFilter);
    }

    const { data: products, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ products, page, pages: Math.ceil((count || 0) / pageSize), count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('id', req.params.id)
      .single();

    if (error || !product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, price, description, images, category, stock, discount } = req.body;

    const { data: createdProduct, error } = await supabase
      .from('products')
      .insert({
        name,
        price,
        description,
        images: images || [],
        category_id: category,
        stock_quantity: stock,
        compare_at_price: discount ? price / (1 - discount/100) : null,
        status: 'Published'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { name, price, description, images, category, stock, discount } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (price !== undefined) updates.price = price;
    if (description) updates.description = description;
    if (images) updates.images = images;
    if (category) updates.category_id = category;
    if (stock !== undefined) updates.stock_quantity = stock;
    if (discount !== undefined) updates.compare_at_price = discount ? price / (1 - discount/100) : null;
    
    updates.updated_at = new Date();

    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
