import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, 
  PenLine, 
  Camera, 
  X, 
  CheckCircle, 
  Loader2, 
  Image as ImageIcon,
  ChevronDown,
  UploadCloud,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { 
  Review, 
  getProductReviews, 
  submitCustomerReview, 
  uploadReviewImage, 
  subscribeToProductReviews 
} from '../../lib/reviews';

interface CustomerReviewsSectionProps {
  productId: string;
  productName?: string;
  onReviewsChange?: (reviews: Review[]) => void;
}

export function CustomerReviewsSection({
  productId,
  productName,
  onReviewsChange,
}: CustomerReviewsSectionProps) {
  const { user, profile, isAuthenticated } = useCustomerAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox Modal for customer uploaded review photos
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Automatically prefill user's name if signed in
  useEffect(() => {
    if (profile?.full_name) {
      setUserName(profile.full_name);
    } else if (user?.user_metadata?.full_name) {
      setUserName(user.user_metadata.full_name);
    }
  }, [profile, user]);

  // Load reviews function
  const loadReviews = async (showSpinner = false) => {
    if (!productId) return;
    if (showSpinner) setIsLoading(true);
    try {
      const data = await getProductReviews(productId);
      setReviews(data);
      if (onReviewsChange) onReviewsChange(data);
    } catch (err) {
      console.warn('Reviews load error:', err);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

  // Initial load and Realtime subscription
  useEffect(() => {
    loadReviews(true);

    // Subscribe to realtime database changes (INSERT, UPDATE, DELETE)
    const unsubscribe = subscribeToProductReviews(productId, () => {
      loadReviews(false);
    });

    // Fallback polling every 8s while component is mounted
    const interval = setInterval(() => {
      loadReviews(false);
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [productId]);

  // Handle image files selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    // Limit to max 4 photos
    const totalFiles = [...selectedFiles, ...newFiles].slice(0, 4);
    setSelectedFiles(totalFiles);

    // Generate local preview URLs
    const newPreviews = totalFiles.map((file) => URL.createObjectURL(file));
    // Clean up previous URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(newPreviews);

    // Reset input value to allow selecting same file again if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a photo before submitting
  const handleRemovePhoto = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);

    URL.revokeObjectURL(previewUrls[index]);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedPreviews);
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!rating || rating < 1) {
      toast.error('Please select a star rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a short review comment');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload photos (if any)
      const uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        toast.loading('Uploading photos...', { id: 'upload-toast' });
        for (const file of selectedFiles) {
          const url = await uploadReviewImage(file);
          if (url) uploadedImageUrls.push(url);
        }
        toast.dismiss('upload-toast');
      }

      // 2. Submit Review to Supabase
      const result = await submitCustomerReview({
        productId,
        userId: user?.id || null,
        userName: userName.trim(),
        title: title.trim(),
        rating,
        comment: comment.trim(),
        images: uploadedImageUrls,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit review');
      }

      // 3. Optimistic local update so customer sees their review instantly
      if (result.data) {
        setReviews((prev) => [result.data!, ...prev.filter((r) => r.id !== result.data!.id)]);
        if (onReviewsChange) {
          onReviewsChange([result.data!, ...reviews]);
        }
      }

      toast.success('Your review has been published in realtime! Thank you.');

      // Reset form
      setComment('');
      setTitle('');
      setSelectedFiles([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  const starLabels: Record<number, string> = {
    1: '1 Star - Poor',
    2: '2 Stars - Fair',
    3: '3 Stars - Average',
    4: '4 Stars - Very Good',
    5: '5 Stars - Excellent',
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 space-y-6">
      {/* ─── Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#698156]/10 flex items-center justify-center text-[#698156] border border-[#698156]/15">
            <Star className="w-5 h-5 fill-[#698156] text-[#698156]" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A1A] tracking-tight">
              CUSTOMER REVIEWS
            </h3>
            <p className="text-xs text-gray-500">
              Real reviews & customer photos updated in real time
            </p>
          </div>
          {reviews.length > 0 && (
            <span className="text-sm font-bold text-[#698156] bg-[#F4F6F2] px-3 py-1 rounded-full border border-[#DCE4D7]">
              {avgRating} ★ ({reviews.length})
            </span>
          )}
        </div>

        {/* Write a Review Button */}
        <button
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95 bg-[#698156] hover:bg-[#546944] text-white"
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </>
          ) : (
            <>
              <PenLine className="w-4 h-4" />
              <span>Write a Review</span>
            </>
          )}
        </button>
      </div>

      {/* ─── Review Input Form (Collapsible) ─── */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmitReview}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-[#698156]/20 shadow-lg shadow-[#698156]/5 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <h4 className="font-bold text-gray-900 text-base">
                    Share Your Feedback
                  </h4>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {productName ? `For: ${productName}` : 'Realtime Submission'}
                </span>
              </div>

              {/* 1. Interactive Star Rating */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              active
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300 fill-gray-100'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                    {starLabels[hoverRating || rating]}
                  </span>
                </div>
              </div>

              {/* 2. Customer Name & Optional Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#698156]/20 focus:border-[#698156] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Headline / Summary (Optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Beautiful fabric and gorgeous drape!"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#698156]/20 focus:border-[#698156] transition-all"
                  />
                </div>
              </div>

              {/* 3. Review Comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Review Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked or disliked about this product (material quality, true-to-color, stitching, fit)..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50/70 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#698156]/20 focus:border-[#698156] transition-all"
                />
              </div>

              {/* 4. Photo Uploads (Text + Image support) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Add Photos (Optional, Max 4)
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {selectedFiles.length}/4 selected (JPG, PNG, WebP)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Upload Trigger Button */}
                  {selectedFiles.length < 4 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#698156] bg-gray-50/50 hover:bg-[#698156]/5 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-[#698156] transition-all cursor-pointer"
                    >
                      <Camera className="w-6 h-6" />
                      <span className="text-[11px] font-semibold">Upload Photo</span>
                    </button>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Photo Preview Cards */}
                  {previewUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-xs group"
                    >
                      <img
                        src={url}
                        alt={`Review preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                        Photo {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Submit Action */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#698156] hover:bg-[#546944] transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Posting Review...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Reviews List / Empty State ─── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#698156] mb-2" />
          <p className="text-xs text-gray-400">Loading verified customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 px-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <Star className="w-6 h-6 text-gray-300" />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">No reviews yet</p>
            <p className="text-sm text-gray-400 mt-0.5">
              Be the first to review this product and share your thoughts!
            </p>
          </div>
          {!isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#698156] hover:bg-[#546944] text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <PenLine className="w-4 h-4" />
              <span>Write the First Review</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-5 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-sm transition-all space-y-3"
            >
              {/* Header: User avatar, name, verified tag, date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#698156]/15 flex items-center justify-center text-[#698156] text-sm font-bold shadow-xs">
                    {(review.user_name || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">
                        {review.user_name || 'Customer'}
                      </span>
                      {review.verified && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Star rating display */}
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 fill-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-700 ml-0.5">
                    {review.rating}
                  </span>
                </div>
              </div>

              {/* Review Title if present */}
              {review.title && (
                <h5 className="font-bold text-gray-900 text-sm">{review.title}</h5>
              )}

              {/* Review Text */}
              {review.comment && (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {review.comment}
                </p>
              )}

              {/* Customer Uploaded Photos Gallery */}
              {review.images && review.images.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-[#698156]" />
                    <span>Customer Photos ({review.images.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {review.images.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        onClick={() => setActivePhoto(imgUrl)}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 cursor-pointer group shadow-xs hover:border-[#698156] transition-all"
                      >
                        <img
                          src={imgUrl}
                          alt={`Review photo by ${review.user_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Lightbox Modal for Customer Review Photo ─── */}
      <AnimatePresence>
        {activePhoto && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePhoto(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh] w-full flex flex-col items-center z-10"
            >
              <div className="w-full flex items-center justify-between text-white pb-3 px-2">
                <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 text-gray-300">
                  <Camera className="w-4 h-4 text-[#698156]" />
                  <span>Verified Customer Photo</span>
                </span>
                <button
                  onClick={() => setActivePhoto(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
                <img
                  src={activePhoto}
                  alt="Full view customer photo"
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

