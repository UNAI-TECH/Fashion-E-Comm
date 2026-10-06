import React, { useState, useEffect, useCallback } from 'react';
import { AdminInventorySection } from './AdminInventorySection';
import { fetchProducts } from '../../data/products';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router';

export function AdminInventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Supabase products
      let dbProds: any[] = [];
      try {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) dbProds = data;
      } catch (e) {}

      // 2. Fetch local/mock products
      const fallbackProds = await fetchProducts();
      
      const mergedMap = new Map<string, any>();
      fallbackProds.forEach(p => mergedMap.set(String(p.id), p));
      dbProds.forEach(p => mergedMap.set(String(p.id), p));

      setProducts(Array.from(mergedMap.values()));
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
    const handleUpdate = () => { loadInventory(); };
    window.addEventListener('products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadInventory]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <AdminInventorySection
        products={products}
        onRefreshProducts={loadInventory}
        onNavigateToCatalog={(searchQuery) => {
          navigate(searchQuery ? `/admin?tab=products&q=${encodeURIComponent(searchQuery)}` : '/admin?tab=products');
        }}
      />
    </div>
  );
}
