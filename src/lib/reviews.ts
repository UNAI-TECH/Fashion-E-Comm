import { supabase } from './supabase';

export interface Review {
  id: string;
  product_id: string;
  user_id?: string | null;
  user_name: string;
  title?: string;
  rating: number;
  comment: string;
  images: string[];
  status?: string;
  verified?: boolean;
  verified_purchase?: boolean;
  created_at: string;
  products?: {
    id: string;
    name: string;
    images?: string[];
  };
}

/**
 * Robustly extract customer photos from a review row:
 * 1. Native `images` column (text[] or JSON)
 * 2. Embedded comment metadata `<!--REVIEW_IMAGES:[...]-->` fallback
 */
export function extractReviewImages(row: any): string[] {
  if (!row) return [];

  // 1. Direct array column
  if (Array.isArray(row.images) && row.images.length > 0) {
    return row.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
  }

  // 2. String representation in column
  if (typeof row.images === 'string' && row.images.startsWith('[')) {
    try {
      const parsed = JSON.parse(row.images);
      if (Array.isArray(parsed)) return parsed.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    } catch {}
  }

  // 3. Fallback embedded in comment
  if (typeof row.comment === 'string') {
    const match = row.comment.match(/<!--REVIEW_IMAGES:(.*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          return parsed.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
        }
      } catch {}
    }
  }

  return [];
}

/**
 * Remove any embedded image metadata tags from user comment
 */
export function cleanReviewComment(comment: string | null | undefined): string {
  if (!comment) return '';
  return comment.replace(/<!--REVIEW_IMAGES:.*?-->/g, '').trim();
}

/**
 * Helper to compress and resize an image before uploading to optimize bandwidth
 */
async function optimizeImageForUpload(file: File, maxDimension = 1400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Upload single review photo:
 * 1. Directly to Supabase Storage 'products' bucket under 'reviews/'
 * 2. Fallback to base64 data URL if storage upload is denied
 */
export async function uploadReviewImage(file: File): Promise<string> {
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `reviews/rev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext === 'png' ? 'png' : 'jpg'}`;
    const optimizedBlob = await optimizeImageForUpload(file);

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, optimizedBlob, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      });

    if (!uploadError) {
      const { data: pubData } = supabase.storage.from('products').getPublicUrl(fileName);
      if (pubData?.publicUrl) {
        return pubData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[Review Upload] Direct storage upload notice:', err);
  }

  // Fallback to Base64 Data URL if Supabase storage is not reachable
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Notify all listening tabs and components of review updates (Realtime broadcast)
 */
function broadcastReviewChange(action: 'created' | 'deleted' | 'updated', reviewId?: string) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aanya:review_changed', { detail: { action, reviewId } }));
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('aanya_reviews_channel');
        bc.postMessage({ action, reviewId, timestamp: Date.now() });
        bc.close();
      }
    }
  } catch {}
}

/**
 * Submit customer review with text and optional images
 */
export async function submitCustomerReview(params: {
  productId: string;
  userId?: string | null;
  userName: string;
  rating: number;
  comment: string;
  images?: string[];
  title?: string;
}): Promise<{ success: boolean; data?: Review; error?: string }> {
  const { productId, userId, userName, rating, comment, images = [], title = '' } = params;

  if (!productId) return { success: false, error: 'Product ID is required' };
  if (!userName.trim()) return { success: false, error: 'Please enter your name' };
  if (!rating || rating < 1 || rating > 5) return { success: false, error: 'Please select a star rating between 1 and 5' };
  if (!comment.trim()) return { success: false, error: 'Please write a review comment' };

  const trimmedComment = comment.trim();
  const trimmedName = userName.trim();
  const trimmedTitle = title.trim();

  // Primary attempt: Save with native `images` array column
  const payloadWithImages: any = {
    product_id: productId,
    user_id: userId || null,
    user_name: trimmedName,
    rating: Number(rating),
    comment: trimmedComment,
    title: trimmedTitle || null,
    images: images,
    status: 'Approved', // Visible immediately
    verified_purchase: !!userId,
  };

  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert(payloadWithImages)
      .select()
      .single();

    if (!error && data) {
      const review: Review = {
        id: data.id,
        product_id: data.product_id,
        user_id: data.user_id,
        user_name: data.user_name || trimmedName,
        title: data.title || '',
        rating: data.rating,
        comment: cleanReviewComment(data.comment),
        images: extractReviewImages(data),
        status: data.status || 'Approved',
        verified: data.verified || data.verified_purchase || false,
        created_at: data.created_at || new Date().toISOString(),
      };
      broadcastReviewChange('created', data.id);
      return { success: true, data: review };
    }

    // If error was missing `images` column, fall back seamlessly by encoding inside comment
    if (error && (error.code === '42703' || error.message?.includes('images'))) {
      const fallbackComment = images.length > 0 
        ? `${trimmedComment}\n\n<!--REVIEW_IMAGES:${JSON.stringify(images)}-->` 
        : trimmedComment;

      const fallbackPayload: any = {
        product_id: productId,
        user_id: userId || null,
        user_name: trimmedName,
        rating: Number(rating),
        comment: fallbackComment,
        title: trimmedTitle || null,
        status: 'Approved',
        verified_purchase: !!userId,
      };

      const { data: fbData, error: fbError } = await supabase
        .from('reviews')
        .insert(fallbackPayload)
        .select()
        .single();

      if (fbError) throw fbError;

      const review: Review = {
        id: fbData.id,
        product_id: fbData.product_id,
        user_id: fbData.user_id,
        user_name: fbData.user_name || trimmedName,
        title: fbData.title || '',
        rating: fbData.rating,
        comment: cleanReviewComment(fbData.comment),
        images: extractReviewImages(fbData),
        status: fbData.status || 'Approved',
        verified: fbData.verified || fbData.verified_purchase || false,
        created_at: fbData.created_at || new Date().toISOString(),
      };
      broadcastReviewChange('created', fbData.id);
      return { success: true, data: review };
    }

    if (error) throw error;
  } catch (err: any) {
    console.error('[submitCustomerReview error]:', err);
    return { success: false, error: err.message || 'Failed to submit review' };
  }

  return { success: false, error: 'Could not complete review submission' };
}

/**
 * Fetch reviews for a specific product
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  if (!productId) return [];

  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      user_id: r.user_id,
      user_name: r.user_name || 'Customer',
      title: r.title || '',
      rating: Number(r.rating) || 5,
      comment: cleanReviewComment(r.comment),
      images: extractReviewImages(r),
      status: r.status || 'Approved',
      verified: !!(r.verified || r.verified_purchase),
      created_at: r.created_at,
    }));
  } catch (err) {
    console.warn('[getProductReviews notice]:', err);
    return [];
  }
}

/**
 * Admin: Fetch all reviews with product info
 */
export async function getAllReviewsForAdmin(): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        products:product_id (id, name, images)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      user_id: r.user_id,
      user_name: r.user_name || 'Customer',
      title: r.title || '',
      rating: Number(r.rating) || 5,
      comment: cleanReviewComment(r.comment),
      images: extractReviewImages(r),
      status: r.status || 'Approved',
      verified: !!(r.verified || r.verified_purchase),
      created_at: r.created_at,
      products: r.products || { id: r.product_id, name: 'Product' },
    }));
  } catch (err) {
    console.error('[getAllReviewsForAdmin error]:', err);
    return [];
  }
}

/**
 * Admin: Delete review by ID
 */
export async function deleteReviewById(id: string): Promise<{ success: boolean; error?: string }> {
  if (!id) return { success: false, error: 'Review ID is required' };

  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    broadcastReviewChange('deleted', id);
    return { success: true };
  } catch (err: any) {
    console.error('[deleteReviewById error]:', err);
    return { success: false, error: err.message || 'Failed to delete review' };
  }
}

/**
 * Realtime hook / subscription for a product page
 */
export function subscribeToProductReviews(productId: string, onUpdate: () => void): () => void {
  if (!productId) return () => {};

  // 1. Supabase Postgres changes channel
  const channel = supabase
    .channel(`product_reviews_${productId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews',
        filter: `product_id=eq.${productId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  // 2. Cross-tab BroadcastChannel and Window CustomEvent
  const handleWindowChange = () => onUpdate();
  window.addEventListener('aanya:review_changed', handleWindowChange);

  let bc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    bc = new BroadcastChannel('aanya_reviews_channel');
    bc.onmessage = () => onUpdate();
  }

  return () => {
    supabase.removeChannel(channel);
    window.removeEventListener('aanya:review_changed', handleWindowChange);
    if (bc) bc.close();
  };
}

/**
 * Realtime hook / subscription for Admin Reviews Moderation page
 */
export function subscribeToAllReviews(onUpdate: () => void): () => void {
  const channel = supabase
    .channel('admin_reviews_all')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reviews',
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  const handleWindowChange = () => onUpdate();
  window.addEventListener('aanya:review_changed', handleWindowChange);

  let bc: BroadcastChannel | null = null;
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    bc = new BroadcastChannel('aanya_reviews_channel');
    bc.onmessage = () => onUpdate();
  }

  return () => {
    supabase.removeChannel(channel);
    window.removeEventListener('aanya:review_changed', handleWindowChange);
    if (bc) bc.close();
  };
}

