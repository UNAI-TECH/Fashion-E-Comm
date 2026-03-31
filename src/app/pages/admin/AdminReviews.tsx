import React, { useState } from 'react';
import { Star, CheckCircle, Trash2, ExternalLink } from 'lucide-react';

const initialReviews = [
  { id: 1, product: 'Elegant Maroon Saree', customer: 'Priya Sharma', rating: 5, comment: 'Absolutely stunning! The material is very premium and it looks better than the pictures.', date: '25 Mar, 2026', status: 'Pending' },
  { id: 2, product: 'Designer Bridal Lehenga', customer: 'Rahul Verma', rating: 4, comment: 'Bought this for my sister. She loved the embroidery. Packaging could be better.', date: '24 Mar, 2026', status: 'Approved' },
  { id: 3, product: 'Casual Cotton Kurti', customer: 'Anjali Desai', rating: 1, comment: 'Color faded after first wash. Totally unacceptable quality.', date: '22 Mar, 2026', status: 'Pending' },
  { id: 4, product: 'Chiffon Party Wear', customer: 'Meera Patel', rating: 5, comment: 'Perfect fit! Got so many compliments at the party.', date: '20 Mar, 2026', status: 'Approved' },
];

export function AdminReviews() {
  const [reviews, setReviews] = useState(initialReviews);

  const handleApprove = (id: number) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
  };

  const handleDelete = (id: number) => {
    setReviews(reviews.filter(r => r.id !== id));
  };

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
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{review.customer}</div>
                    <div className="text-[#D4AF37] text-xs font-medium cursor-pointer hover:underline flex items-center gap-1 mt-1">
                      {review.product} <ExternalLink className="w-3 h-3" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-[#D4AF37]">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
