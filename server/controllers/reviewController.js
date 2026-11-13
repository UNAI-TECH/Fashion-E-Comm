import { supabase } from '../config/supabase.js';
import path from 'path';

// Helper to clean and format review row
const formatReviewRow = (r) => {
  let images = [];
  if (Array.isArray(r.images)) {
    images = r.images;
  } else if (typeof r.comment === 'string') {
    const match = r.comment.match(/<!--REVIEW_IMAGES:(.*?)-->/);
    if (match && match[1]) {
      try {
        images = JSON.parse(match[1]);
      } catch {}
    }
  }

  const cleanComment = typeof r.comment === 'string'
    ? r.comment.replace(/<!--REVIEW_IMAGES:.*?-->/g, '').trim()
    : '';

  return {
    id: r.id,
    product_id: r.product_id,
    user_id: r.user_id,
    user_name: r.user_name || 'Customer',
    title: r.title || '',
    rating: Number(r.rating) || 5,
    comment: cleanComment,
    images: images,
    status: r.status || 'Approved',
    verified: !!(r.verified || r.verified_purchase),
    created_at: r.created_at,
  };
};

// @desc    Create new review (Public or authenticated)
// @route   POST /api/reviews
// @access  Public / Private
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, userName, title, images = [] } = req.body;
    const userId = req.user?.id || null;
    const displayName = userName?.trim() || req.user?.full_name || 'Customer';

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'Product ID, rating, and comment are required.' });
    }

    if (userId) {
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existingReview) {
        return res.status(400).json({ message: 'You have already reviewed this product.' });
      }
    }

    const payload = {
      product_id: productId,
      user_id: userId,
      user_name: displayName,
      title: title?.trim() || null,
      rating: Number(rating),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      status: 'Approved',
      verified_purchase: !!userId,
    };

    // Primary insert
    let { data, error } = await supabase
      .from('reviews')
      .insert(payload)
      .select()
      .single();

    // Fallback if images column does not exist yet
    if (error && (error.code === '42703' || error.message?.includes('images'))) {
      const fallbackComment = images.length > 0 
        ? `${comment.trim()}\n\n<!--REVIEW_IMAGES:${JSON.stringify(images)}-->` 
        : comment.trim();

      const fallbackPayload = {
        product_id: productId,
        user_id: userId,
        user_name: displayName,
        title: title?.trim() || null,
        rating: Number(rating),
        comment: fallbackComment,
        status: 'Approved',
        verified_purchase: !!userId,
      };

      const fallbackRes = await supabase
        .from('reviews')
        .insert(fallbackPayload)
        .select()
        .single();

      if (fallbackRes.error) throw fallbackRes.error;
      data = fallbackRes.data;
      error = null;
    }

    if (error) throw error;

    res.status(201).json({ 
      success: true, 
      message: 'Review added successfully', 
      review: formatReviewRow(data) 
    });
  } catch (error) {
    console.error('createReview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get product reviews
// @route   GET /api/reviews/:productId
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', req.params.productId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json((reviews || []).map(formatReviewRow));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
export const deleteReview = async (req, res) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload review images endpoint
// @route   POST /api/reviews/upload
// @access  Public
export const uploadReviewImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const fileExt = path.extname(file.originalname).toLowerCase();
      const fileName = `reviews/rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${fileExt}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        // Dev fallback base64
        const base64 = file.buffer.toString('base64');
        uploadedUrls.push(`data:${file.mimetype};base64,${base64}`);
        continue;
      }

      const { data: pubData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      if (pubData?.publicUrl) {
        uploadedUrls.push(pubData.publicUrl);
      }
    }

    res.json({
      success: true,
      urls: uploadedUrls,
      count: uploadedUrls.length,
    });
  } catch (error) {
    console.error('uploadReviewImages error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
