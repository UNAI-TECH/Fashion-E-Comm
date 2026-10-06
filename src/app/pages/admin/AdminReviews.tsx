import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Review {
  id: string;
  product_name: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  date: string;
  status: string;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products:product_id (name),
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        product_name: r.products?.name || 'Unknown Product',
        product_id: r.product_id,
        customer_name: r.profiles?.full_name || 'Anonymous',
        rating: r.rating,
        comment: r.comment || '',
        date: new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        status: r.status || 'Pending',
      }));

      setReviews(formatted);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: 'Approved' })
        .eq('id', id);

      if (error) throw error;
      setReviews(reviews.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      toast.success('Review approved');
    } catch (error: any) {
      toast.error('Failed to approve review: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setReviews(reviews.filter(r => r.id !== id));
      toast.success('Review deleted');
    } catch (error: any) {
      toast.error('Failed to delete review: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#698156]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Customer Reviews Moderation</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Customer & Product</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium w-96">Review Comment</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {reviews.length > 0 ? reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{review.customer_name}</div>
                    <div className="text-[#698156] text-xs font-medium cursor-pointer hover:underline flex items-center gap-1 mt-1">
                      {review.product_name} <ExternalLink className="w-3 h-3" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-[#698156]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{review.date}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 italic">"{review.comment}"</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${review.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {review.status === 'Pending' && (
                          <button 
                            onClick={() => handleApprove(review.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                            title="Approve Review"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                       )}
                      <button 
                        onClick={() => handleDelete(review.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                    No customer reviews yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
