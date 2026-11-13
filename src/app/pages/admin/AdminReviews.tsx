import React, { useState, useEffect } from 'react';
import { 
  Star, 
  CheckCircle, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Image as ImageIcon,
  Search,
  Filter,
  X,
  Camera,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';
import { Link } from 'react-router';
import { 
  Review, 
  getAllReviewsForAdmin, 
  deleteReviewById, 
  subscribeToAllReviews 
} from '../../../lib/reviews';

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '1-2'>('all');
  const [hasPhotoFilter, setHasPhotoFilter] = useState(false);

  // Delete Confirmation Modal
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo Lightbox Modal
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  // Load reviews from Supabase
  const loadReviews = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await getAllReviewsForAdmin();
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Failed to load customer reviews');
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  // Initial load and Realtime sync
  useEffect(() => {
    loadReviews();

    // Subscribe to realtime database changes (INSERT, UPDATE, DELETE)
    const unsubscribe = subscribeToAllReviews(() => {
      loadReviews();
    });

    // Background polling every 8s
    const interval = setInterval(() => {
      loadReviews();
    }, 8000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Approve review
  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;
      setReviews(reviews.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r)));
      toast.success('Review approved successfully');
    } catch (error: any) {
      toast.error('Failed to approve review: ' + error.message);
    }
  };

  // Delete review
  const confirmDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteReviewById(reviewToDelete.id);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete review');
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      toast.success('Review permanently deleted');
      setReviewToDelete(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete review');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      (r.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.comment || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.products?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === 'all'
        ? true
        : ratingFilter === '5'
        ? r.rating === 5
        : ratingFilter === '4'
        ? r.rating === 4
        : ratingFilter === '3'
        ? r.rating === 3
        : r.rating <= 2;

    const matchesPhoto = hasPhotoFilter ? r.images && r.images.length > 0 : true;

    return matchesSearch && matchesRating && matchesPhoto;
  });

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const reviewsWithPhotos = reviews.filter((r) => r.images && r.images.length > 0).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#698156]" />
        <p className="text-sm font-medium text-gray-500">Loading Customer Reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Customer Reviews Moderation
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Realtime Active
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage, inspect customer-uploaded review photos, and delete inappropriate reviews.
          </p>
        </div>

        <button
          onClick={() => loadReviews(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#698156]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ─── Metric Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Reviews</p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">{totalReviews}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#698156]/10 text-[#698156] flex items-center justify-center font-bold">
            ★
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-black text-amber-500">{avgRating}</h3>
              <div className="flex items-center text-amber-400">
                <Star className="w-5 h-5 fill-current" />
              </div>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            {totalReviews > 0 ? `${Math.round((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100)}%` : '0%'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Reviews with Photos</p>
            <h3 className="text-2xl font-black text-[#698156] mt-1">{reviewsWithPhotos}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, product, or review text..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50/70 rounded-xl border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#698156]/20 focus:border-[#698156]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Star Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:border-[#698156] text-gray-700"
          >
            <option value="all">All Stars (1 - 5 ★)</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="1-2">1 - 2 Stars (Negative)</option>
          </select>

          {/* Photo toggle button */}
          <button
            onClick={() => setHasPhotoFilter((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              hasPhotoFilter
                ? 'bg-[#698156] text-white border-[#698156]'
                : 'bg-gray-50/70 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos Only</span>
          </button>
        </div>
      </div>

      {/* ─── Reviews Table ─── */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 text-gray-600 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Customer & Product</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4 w-80">Review & Photos</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredReviews.length > 0 ? (
                filteredReviews.map((review) => {
                  const firstProductImage = Array.isArray(review.products?.images) && review.products.images[0]
                    ? review.products.images[0]
                    : null;

                  return (
                    <tr key={review.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Customer & Product */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#698156]/15 text-[#698156] flex items-center justify-center font-bold text-sm shrink-0">
                            {(review.user_name || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-gray-900">
                              <span>{review.user_name || 'Customer'}</span>
                              {review.verified && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                                  ✓ Verified
                                </span>
                              )}
                            </div>

                            {/* Product Link + Thumbnail */}
                            <Link
                              to={`/product/${review.product_id}`}
                              target="_blank"
                              className="mt-1.5 flex items-center gap-1.5 text-xs text-[#698156] hover:text-[#546944] font-medium group"
                            >
                              {firstProductImage && (
                                <img
                                  src={firstProductImage}
                                  alt=""
                                  className="w-5 h-5 rounded object-cover border border-gray-200"
                                />
                              )}
                              <span className="group-hover:underline line-clamp-1 max-w-[200px]">
                                {review.products?.name || 'View Product'}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </Link>

                            <div className="text-[11px] text-gray-400 mt-1">
                              {new Date(review.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating ? 'fill-current' : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-gray-900 ml-1">
                            {review.rating}.0
                          </span>
                        </div>
                        {review.title && (
                          <div className="font-semibold text-xs text-gray-800 mt-1.5 line-clamp-1">
                            "{review.title}"
                          </div>
                        )}
                      </td>

                      {/* Review Comment & Customer Uploaded Images */}
                      <td className="px-6 py-4 align-top">
                        <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                          {review.comment}
                        </p>

                        {/* Customer Uploaded Photos */}
                        {review.images && review.images.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                              Customer Photos ({review.images.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {review.images.map((imgUrl, i) => (
                                <div
                                  key={i}
                                  onClick={() => setActivePhoto(imgUrl)}
                                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:border-[#698156] group shadow-2xs"
                                >
                                  <img
                                    src={imgUrl}
                                    alt="Review attachment"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 align-top text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            review.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {review.status || 'Approved'}
                        </span>
                      </td>

                      {/* Actions: Approve / Delete */}
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {review.status !== 'Approved' && (
                            <button
                              onClick={() => handleApprove(review.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200 cursor-pointer"
                              title="Approve Review"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setReviewToDelete(review)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    <Star className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="font-semibold text-gray-600">No customer reviews found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchTerm || ratingFilter !== 'all' || hasPhotoFilter
                        ? 'Try adjusting your filters or search term'
                        : 'Customer reviews will appear here in realtime once posted'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      <AnimatePresence>
        {reviewToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setReviewToDelete(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 border border-gray-100"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    Delete Customer Review?
                  </h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this review by{' '}
                    <span className="font-bold text-gray-800">
                      {reviewToDelete.user_name || 'Customer'}
                    </span>
                    ? This review and its uploaded photos will be immediately removed from the product page in real time.
                  </p>
                </div>
              </div>

              {/* Review snippet */}
              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-100 italic line-clamp-3">
                "{reviewToDelete.comment}"
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Review</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Lightbox Modal for Customer Photo ─── */}
      <AnimatePresence>
        {activePhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  <span>Customer Uploaded Photo</span>
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
                  alt="Customer Review Photo Full View"
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
