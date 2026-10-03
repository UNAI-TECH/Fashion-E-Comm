import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt, Printer, Plus, Trash2, Search,
  ShoppingBag, User, Phone, Mail, MapPin,
  Check, RefreshCw, ShoppingCart, X, Package,
  ExternalLink, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { supabaseAdmin } from '../../../lib/supabase';




// Crisp vector script signature
const SignatureSVG = ({ className = "w-28 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 160 50" className={className} fill="none" stroke="#1E293B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 36 C 26 14, 32 4, 42 24 C 47 34, 57 40, 72 20 C 86 6, 96 28, 112 24 C 126 20, 136 14, 152 17 M66 26 Q 92 23 132 21 M36 34 Q 56 38 88 31" />
  </svg>
);

// Number to Words Converter (INR)
function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded <= 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  }

  let num = rounded;
  let result = '';

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const remainder = num;

  if (crores > 0) result += convertLessThanOneThousand(crores) + ' Crore ';
  if (lakhs > 0) result += convertLessThanOneThousand(lakhs) + ' Lakh ';
  if (thousands > 0) result += convertLessThanOneThousand(thousands) + ' Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  return 'Rupees ' + result.trim() + ' Only';
}

export interface BillItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AdminBillingSectionProps {
  products: any[];
  initialProduct?: any | null;
  initialProducts?: any[] | null;
  onClearInitialProduct?: () => void;
  onClearInitialProducts?: () => void;
  onOrderCreated?: (order: any) => void;
  onNavigateToCatalog?: () => void;
}

export function AdminBillingSection({
  products = [],
  initialProduct,
  initialProducts,
  onClearInitialProduct,
  onClearInitialProducts,
  onOrderCreated,
  onNavigateToCatalog
}: AdminBillingSectionProps) {
  // Invoice Meta
  const [invoiceNo, setInvoiceNo] = useState(() => `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'UPI / QR' | 'Cash' | 'Credit/Debit Card' | 'Net Banking'>('UPI / QR');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');

  // Customer Details (CLEAN EMPTY DEFAULTS - No mock strings)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState('');

  // Bill Line Items (Populated from props, localStorage, or catalog cart)
  const [billItems, setBillItems] = useState<BillItem[]>(() => {
    try {
      if (initialProducts && Array.isArray(initialProducts) && initialProducts.length > 0) {
        return initialProducts.map((item: any) => ({
          id: String(item.id),
          name: item.name,
          category: item.category || 'General',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: (item.images && item.images.length > 0 ? item.images[0] : null) || item.image_url || item.image || ''
        }));
      }
      if (initialProduct) {
        return [{
          id: String(initialProduct.id),
          name: initialProduct.name,
          category: initialProduct.category || 'General',
          price: Number(initialProduct.price) || 0,
          quantity: 1,
          image: (initialProduct.images && initialProduct.images.length > 0 ? initialProduct.images[0] : null) || initialProduct.image_url || initialProduct.image || ''
        }];
      }
      const savedBill = localStorage.getItem('admin_billing_items');
      if (savedBill) {
        const parsed = JSON.parse(savedBill);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // If billing items is empty, but admin_pos_cart has items, automatically load them
      const savedCart = localStorage.getItem('admin_pos_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          return parsedCart.map((i: any) => ({
            id: String(i.product?.id || i.id),
            name: i.product?.name || i.name,
            category: i.product?.category || i.category || 'General',
            price: Number(i.product?.price ?? i.price) || 0,
            quantity: Number(i.quantity) || 1,
            image: (i.product?.images && i.product.images.length > 0 ? i.product.images[0] : null) || i.product?.image_url || i.product?.image || i.image || ''
          }));
        }
      }
    } catch (e) {}
    return [];
  });

  // Automatically keep billItems synced to localStorage
  useEffect(() => {
    try {
      if (billItems.length > 0) {
        localStorage.setItem('admin_billing_items', JSON.stringify(billItems));
      }
    } catch (e) {}
  }, [billItems]);

  // Listen for direct broadcast events from catalog products tab
  useEffect(() => {
    const handleLoadItems = (e: any) => {
      const items = e.detail;
      if (Array.isArray(items) && items.length > 0) {
        setBillItems(prev => {
          const next = [...prev];
          items.forEach((item: any) => {
            const prodImg = (item.images && item.images.length > 0 ? item.images[0] : null) || item.image_url || item.image || '';
            const existingIdx = next.findIndex(bi => String(bi.id) === String(item.id));
            const addQty = Number(item.quantity) || 1;
            if (existingIdx >= 0) {
              next[existingIdx].quantity += addQty;
            } else {
              next.push({
                id: String(item.id),
                name: item.name,
                category: item.category || 'General',
                price: Number(item.price) || 0,
                quantity: addQty,
                image: prodImg
              });
            }
          });
          try {
            localStorage.setItem('admin_billing_items', JSON.stringify(next));
          } catch (err) {}
          return next;
        });
      }
    };

    window.addEventListener('admin_billing_load_items', handleLoadItems);
    return () => window.removeEventListener('admin_billing_load_items', handleLoadItems);
  }, []);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [includeGst, setIncludeGst] = useState<boolean>(true);

  // UI States
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalCategory, setModalCategory] = useState('All');
  const [cartCount, setCartCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('admin_pos_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {}
    return 0;
  });

  const refreshCartCount = () => {
    try {
      const raw = localStorage.getItem('admin_pos_cart');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCartCount(parsed.length);
          return;
        }
      }
    } catch (e) {}
    setCartCount(0);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      if (p.category && typeof p.category === 'string') set.add(p.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  const modalFilteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const q = modalSearch.trim().toLowerCase();
      const matchesSearch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchesCat = modalCategory === 'All' || p.category === modalCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, modalSearch, modalCategory]);

  // If a single product was clicked from "Buy Now / Bill" in catalog
  useEffect(() => {
    if (initialProduct) {
      const prodImg = (initialProduct.images && initialProduct.images.length > 0 ? initialProduct.images[0] : null) || initialProduct.image_url || initialProduct.image || '';
      setBillItems(prev => {
        const existingIdx = prev.findIndex(item => String(item.id) === String(initialProduct.id));
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx].quantity += 1;
          return updated;
        }
        return [
          ...prev,
          {
            id: String(initialProduct.id),
            name: initialProduct.name,
            category: initialProduct.category || 'Sarees',
            price: Number(initialProduct.price) || 0,
            quantity: 1,
            image: prodImg
          }
        ];
      });
      toast.success(`"${initialProduct.name}" added to bill items!`);
      if (onClearInitialProduct) onClearInitialProduct();
    }
  }, [initialProduct]);

  // If multiple products were passed from Catalog Checkout
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setBillItems(prev => {
        const next = [...prev];
        initialProducts.forEach(item => {
          const prodImg = (item.images && item.images.length > 0 ? item.images[0] : null) || item.image_url || item.image || '';
          const existingIdx = next.findIndex(bi => String(bi.id) === String(item.id));
          const addQty = Number(item.quantity) || 1;
          if (existingIdx >= 0) {
            next[existingIdx].quantity = Math.max(next[existingIdx].quantity, addQty);
          } else {
            next.push({
              id: String(item.id),
              name: item.name,
              category: item.category || 'General',
              price: Number(item.price) || 0,
              quantity: addQty,
              image: prodImg
            });
          }
        });
        return next;
      });
      toast.success(`${initialProducts.length} product(s) loaded into POS Billing invoice!`);
      if (onClearInitialProducts) onClearInitialProducts();
    }
  }, [initialProducts]);

  // Calculations
  const subtotal = billItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const calculatedDiscount = Math.min(discountAmount, subtotal);
  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const gstRate = 0.05;
  const gstAmount = taxableAmount > 0 ? (includeGst ? (taxableAmount * gstRate) / (1 + gstRate) : taxableAmount * gstRate) : 0;
  const grandTotal = taxableAmount > 0 ? (includeGst ? taxableAmount : taxableAmount + gstAmount) : 0;

  // Add Item
  const handleAddItem = (prod: any) => {
    const prodImg = (prod.images && prod.images.length > 0 ? prod.images[0] : null) || prod.image_url || prod.image || '';
    setBillItems(prev => {
      const idx = prev.findIndex(item => String(item.id) === String(prod.id));
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          id: String(prod.id),
          name: prod.name,
          category: prod.category || 'Sarees',
          price: Number(prod.price) || 0,
          quantity: 1,
          image: prodImg
        }
      ];
    });
    setProductSearch('');
    toast.success(`Added "${prod.name}"`);
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setBillItems(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx].quantity = newQty;
      return next;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setBillItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      try {
        if (next.length === 0) {
          localStorage.removeItem('admin_billing_items');
        } else {
          localStorage.setItem('admin_billing_items', JSON.stringify(next));
        }
      } catch (e) {}
      return next;
    });
  };

  const handleResetBill = () => {
    setInvoiceNo(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerAddress('');
    setCustomerState('');
    setBillItems([]);
    setDiscountAmount(0);
    try {
      localStorage.removeItem('admin_billing_items');
    } catch (e) {}
    toast.info('Bill cleared.');
  };

  const handleImportFromCart = () => {
    try {
      const raw = localStorage.getItem('admin_pos_cart');
      if (raw) {
        const cart = JSON.parse(raw);
        if (Array.isArray(cart) && cart.length > 0) {
          const imported = cart.map((i: any) => ({
            id: String(i.product?.id || i.id),
            name: i.product?.name || i.name,
            category: i.product?.category || i.category || 'General',
            price: Number(i.product?.price ?? i.price) || 0,
            quantity: Number(i.quantity) || 1,
            image: (i.product?.images && i.product.images.length > 0 ? i.product.images[0] : null) || i.product?.image_url || i.product?.image || i.image || ''
          }));
          setBillItems(imported);
          localStorage.setItem('admin_billing_items', JSON.stringify(imported));
          toast.success(`Imported ${imported.length} product(s) from catalog cart!`);
          return;
        }
      }
      toast.info('Catalog cart is empty. Add products from the Catalog tab first.');
    } catch (e) {
      toast.error('Failed to import cart');
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // 100% RELIABLE EXACT TEMPLATE PDF PRINT & DOWNLOAD
  // ════════════════════════════════════════════════════════════════════════
  const handlePrintPDF = () => {
    const formattedDate = new Date(invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const cleanCustomerName = customerName.trim() || 'Customer';
    const documentTitle = `${invoiceNo}-${cleanCustomerName.replace(/\s+/g, '_')}`;

    // Create isolated iframe
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Build the exact HTML layout from the inspiration image
    const rowsHtml = billItems.length === 0
      ? `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #94A3B8; font-style: italic;">No items added to invoice yet</td></tr>`
      : billItems.map((item, idx) => `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 10px 14px; font-weight: 700; color: #64748B; font-size: 11px;">${String(idx + 1).padStart(2, '0')}</td>
          <td style="padding: 10px 14px; font-weight: 700; color: #1E293B; font-size: 11px; text-transform: uppercase;">${item.name}</td>
          <td style="padding: 10px 14px; text-align: right; color: #334155; font-size: 11px;">${item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #1E293B; font-size: 11px;">${String(item.quantity).padStart(2, '0')}</td>
          <td style="padding: 10px 14px; text-align: right; font-weight: 800; color: #0F172A; font-size: 11px;">${(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${documentTitle}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
              background: #FFFFFF;
              color: #0F172A;
              padding: 24px 30px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            @media print {
              body { padding: 0; }
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              padding: 9px 14px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              color: #64748B;
              border-bottom: 2px solid #E2E8F0;
              background: #F8FAFC;
            }
          </style>
        </head>
        <body>
          <div style="position: relative; min-height: 980px; display: flex; flex-direction: column; justify-content: space-between;">
            
            <!-- Official Centered Brand Logo Watermark -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 360px; max-width: 80%; opacity: 0.08; pointer-events: none; text-align: center; z-index: 0;">
              <img src="/logo.png" alt="Aanya Fashions Watermark" style="width: 100%; height: auto; object-fit: contain; margin: 0 auto; display: block;" />
            </div>

            <div style="position: relative; z-index: 1;">
              
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h1 style="font-size: 32px; font-weight: 900; letter-spacing: 0.02em; color: #0F172A; text-transform: uppercase; line-height: 1;">
                      INVOICE
                    </h1>
                    <div style="display: flex; align-items: center; gap: 3px; margin-left: 4px;">
                      <div style="width: 14px; height: 14px; border-radius: 50%; background: #698156;"></div>
                      <div style="width: 10px; height: 10px; border-radius: 50%; background: #849E70; margin-left: -5px;"></div>
                    </div>
                  </div>
                  <div style="margin-top: 6px; font-size: 11px; font-weight: 700; color: #475569;">
                    Invoice No : <span style="color: #698156; font-weight: 800;">${invoiceNo}</span>
                  </div>
                </div>

                <div style="text-align: right;">
                  <img src="/logo.png" style="height: 38px; width: auto; object-fit: contain; margin-left: auto; display: block;" />
                  <div style="margin-top: 6px; font-size: 10px; color: #64748B; line-height: 1.4;">
                    <div>+91 91234 56789</div>
                    <div>care@aanyafashions.com</div>
                    <div>https://www.aanyafashions.com/</div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 22px; font-size: 11px;">
                <div>
                  <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">
                    INVOICE TO:
                  </div>
                  <div style="font-size: 13px; font-weight: 800; color: #0F172A;">
                    ${customerName.trim() || '—'}
                  </div>
                  ${customerAddress.trim() ? `<div style="color: #475569; margin-top: 2px;">${customerAddress.trim()}</div>` : ''}
                  ${customerState.trim() ? `<div style="color: #475569; margin-top: 1px;">${customerState.trim()}</div>` : ''}
                  ${customerPhone.trim() ? `<div style="color: #64748B; margin-top: 2px;">Phone: ${customerPhone.trim()}</div>` : ''}
                </div>

                <div style="text-align: right; line-height: 1.6; color: #475569;">
                  <div><span style="font-weight: 700; color: #0F172A;">Document Date:</span> ${formattedDate}</div>
                  <div><span style="font-weight: 700; color: #0F172A;">Payment Mode:</span> ${paymentMode} (${paymentStatus})</div>
                  <div><span style="font-weight: 700; color: #0F172A;">GSTIN:</span> 36AAHCA9482L1Z4</div>
                </div>
              </div>

              <div style="border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                <table>
                  <thead>
                    <tr>
                      <th style="text-align: left; width: 44px;">NO.</th>
                      <th style="text-align: left;">PRODUCT DESCRIPTION</th>
                      <th style="text-align: right; width: 110px;">PRICE (₹)</th>
                      <th style="text-align: center; width: 60px;">QTY</th>
                      <th style="text-align: right; width: 120px;">TOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 30px;">
                
                <div style="flex: 1.1;">
                  
                  <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px; font-size: 11px; color: #475569; line-height: 1.6;">
                    <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #1E293B; margin-bottom: 4px; font-size: 9px;">
                      PAYMENT METHOD
                    </div>
                    <div>Bank Account: <span style="font-weight: 700; color: #0F172A;">06410100042434</span></div>
                    <div>Bank: <span style="font-weight: 700; color: #0F172A;">HDFC Bank (IFSC: HDFC0001245)</span></div>
                    <div>UPI ID: <span style="font-weight: 700; color: #698156;">aanyafashions@okhdfcbank</span></div>
                  </div>

                  <div style="margin-top: 14px; font-size: 10px; color: #64748B; line-height: 1.5;">
                    <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #1E293B; font-size: 9px; margin-bottom: 3px;">
                      TERMS & CONDITION
                    </div>
                    <div>Payment completed. Goods once sold can be exchanged within 7 days of invoice date with intact tags.</div>
                  </div>

                  <div style="margin-top: 12px; display: inline-block; background: #F1F5F9; border: 1px solid #E2E8F0; border-radius: 6px; padding: 6px 14px; font-size: 10px; color: #334155;">
                    Amount in Words: <span style="font-weight: 800; color: #0F172A;">${billItems.length > 0 ? numberToWordsINR(grandTotal) : '—'}</span>
                  </div>

                </div>

                <div style="width: 250px;">
                  
                  <div style="background: #FFFFFF; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">
                      <span>Sub Total</span>
                      <span style="font-weight: 700; color: #1E293B;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    ${calculatedDiscount > 0 ? `
                      <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #059669; border-bottom: 1px solid #F1F5F9;">
                        <span>Discount</span>
                        <span style="font-weight: 700;">- ₹${calculatedDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; padding: 6px 0; color: #64748B; border-bottom: 1px solid #F1F5F9;">
                      <span>GST (5%)</span>
                      <span style="font-weight: 700; color: #1E293B;">₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0 6px 0;">
                      <span style="font-size: 13px; font-weight: 800; color: #0F172A;">Total</span>
                      <span style="font-size: 18px; font-weight: 900; color: #698156;">₹${Math.round(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div style="margin-top: 34px; text-align: center;">
                    <div style="display: flex; justify-content: center; height: 38px;">
                      <svg viewBox="0 0 160 50" style="width: 120px; height: 100%;" fill="none" stroke="#1E293B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 36 C 26 14, 32 4, 42 24 C 47 34, 57 40, 72 20 C 86 6, 96 28, 112 24 C 126 20, 136 14, 152 17 M66 26 Q 92 23 132 21 M36 34 Q 56 38 88 31" />
                      </svg>
                    </div>
                    <div style="font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase; margin-top: 4px;">
                      AANYA FASHIONS PVT LTD
                    </div>
                    <div style="font-size: 9px; color: #94A3B8; text-transform: capitalize;">
                      Authorized Signatory
                    </div>
                  </div>

                </div>

              </div>

            </div>

            <div style="position: relative; z-index: 1; padding-top: 24px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94A3B8;">
              <div>
                +91 91234 56789 | care@aanyafashions.com | Page 1 of 1
              </div>

              <div style="display: flex; align-items: center; gap: 6px; background: #698156; color: #FFFFFF; font-weight: 700; padding: 6px 14px; border-radius: 999px;">
                <span>Thank you for your Business!</span>
                <div style="width: 6px; height: 6px; border-radius: 50%; background: #A8BFA0;"></div>
              </div>
            </div>

          </div>
        </body>
      </html>
    `);
    doc.close();

    toast.info('Opening print dialog for PDF...');
    setTimeout(() => {
      try {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
      } catch (err) {
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 3000);
      }
    }, 600);
  };



  // Save to Database
  const handleSaveToOrders = async () => {
    if (billItems.length === 0) {
      toast.error('Please add at least 1 product to the bill');
      return;
    }
    setIsSaving(true);
    try {
      const orderPayload = {
        id: invoiceNo.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase(),
        total_amount: Math.round(grandTotal),
        status: paymentStatus === 'Paid' ? 'completed' : 'pending',
        payment_method: paymentMode,
        payment_status: paymentStatus.toLowerCase(),
        customer_name: customerName.trim() || 'In-Store Customer',
        shipping_address: {
          full_name: customerName.trim() || 'In-Store Customer',
          phone: customerPhone.trim() || '',
          email: customerEmail.trim() || '',
          address: customerAddress.trim() || 'In-Store Counter',
          city: customerState.trim() || 'Hyderabad',
          state: 'Telangana'
        },
        created_at: new Date().toISOString()
      };

      try {
        await supabaseAdmin.from('orders').insert(orderPayload);
      } catch (dbErr) {}

      try {
        const raw = localStorage.getItem('local_admin_orders');
        const existing = raw ? JSON.parse(raw) : [];
        localStorage.setItem('local_admin_orders', JSON.stringify([orderPayload, ...existing]));
      } catch (e) {}

      window.dispatchEvent(new Event('orders_updated'));
      window.dispatchEvent(new Event('storage'));

      if (onOrderCreated) {
        onOrderCreated(orderPayload);
      }

      try {
        localStorage.removeItem('admin_billing_items');
      } catch (e) {}

      toast.success(`Bill ${invoiceNo} recorded successfully!`);
    } catch (err: any) {
      toast.error('Failed to save order record: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Product Filter
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  ).slice(0, 6);

  const formattedScreenDate = new Date(invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4F6F2] border border-[#DCE4D7] flex items-center justify-center text-[#698156] flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-gray-900 leading-tight">
              Manual Retail Billing & POS
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Generate PDF invoice matching your brand theme with centered watermark and clear typography.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetBill}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Clear all fields"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Clear / New Bill
          </button>

          <button
            type="button"
            onClick={handleSaveToOrders}
            disabled={isSaving || billItems.length === 0}
            className="px-4 py-2 bg-[#1E293B] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
            title="Record this sale in orders"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-400" />}
            Save & Record Order
          </button>
        </div>
      </div>

      {/* ── TWO-COLUMN BILLING INTERFACE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ══ LEFT COLUMN: Input Form & Product Selector (5 cols) ══ */}
        <div className="xl:col-span-5 space-y-5">
          
          {/* 1. Customer Information Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#698156]" />
                Customer Information
              </h3>
              <span className="text-[10px] text-gray-400 font-medium">
                (Type to fill invoice)
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Customer Full Name</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Mrs Fathima Ali"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50/70 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9843888807"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50/70 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="e.g. customer@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50/70 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Area / Street</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder="e.g. SITHA, Road 10"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50/70 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">City / State</label>
                  <input
                    type="text"
                    value={customerState}
                    onChange={e => setCustomerState(e.target.value)}
                    placeholder="e.g. Tamil Nadu or Hyderabad"
                    className="w-full px-3 py-2 bg-gray-50/70 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs"
                  />
                </div>
              </div>

              {/* Payment Mode & Status */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-gray-50/70 rounded-xl border border-gray-200 outline-none text-xs text-gray-800"
                  >
                    <option value="UPI / QR">UPI / QR (GPay, PhonePe)</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Credit/Debit Card">Credit / Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-gray-50/70 rounded-xl border border-gray-200 outline-none text-xs text-gray-800"
                  >
                    <option value="Paid">Paid in Full</option>
                    <option value="Pending">Payment Pending</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Product Search & Selected Bill Items */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#698156]" />
                Add Products to Bill
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    refreshCartCount();
                    setIsCatalogModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-[#F4F6F2] hover:bg-[#E8EDE4] text-[#698156] border border-[#DCE4D7] text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                  title="Open Product Catalogue selector"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Browse Catalogue</span>
                </button>
                <span className="text-xs text-[#698156] font-bold bg-[#F4F6F2] px-2.5 py-0.5 rounded-full">
                  {billItems.length} {billItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type product name to search & add…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs"
                />
              </div>

              {/* Quick Search Dropdown */}
              {productSearch.trim() && (
                <div className="border border-gray-200 rounded-xl p-2 bg-white shadow-lg space-y-1.5 max-h-48 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-2">No matching products</p>
                  ) : (
                    filteredProducts.map(p => {
                      const img = (p.images && p.images.length > 0 ? p.images[0] : null) || p.image_url || p.image || '';
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleAddItem(p)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F4F6F2] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {img ? (
                              <img src={img} alt={p.name} className="w-8 h-10 object-cover rounded-md flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-10 bg-gray-100 rounded-md flex items-center justify-center text-[10px] text-gray-400">👗</div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                              <p className="text-[10px] text-gray-400">{p.category} • ₹{Number(p.price).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-[#698156] hover:bg-[#546944] text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* List of Added Line Items */}
            {billItems.length === 0 ? (
              <div className="p-6 border border-dashed border-[#DCE4D7] rounded-2xl text-center bg-[#F4F6F2]/40 space-y-3.5">
                <ShoppingBag className="w-8 h-8 text-[#698156]/60 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-gray-800">Bill is currently empty</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Select products from your catalogue to add to this invoice, or import your active cart.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      refreshCartCount();
                      setIsCatalogModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#698156] hover:bg-[#546944] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <Package className="w-4 h-4" />
                    <span>Import from Product Catalogue</span>
                  </button>

                  {cartCount > 0 && (
                    <button
                      type="button"
                      onClick={handleImportFromCart}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-[#698156]" />
                      <span>Import Cart ({cartCount})</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {billItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-8 h-10 object-cover rounded-md flex-shrink-0 border border-gray-200" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-[#698156] font-medium">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, -1)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(idx, 1)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[60px]">
                        <p className="text-xs font-bold text-gray-900">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Discount & Taxes Controls */}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Discount Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(Number(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="w-full px-2.5 py-1.5 bg-gray-50 rounded-xl border border-gray-200 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Garment GST (5%)</label>
                <button
                  type="button"
                  onClick={() => setIncludeGst(!includeGst)}
                  className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    includeGst
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {includeGst ? '✓ GST Included' : '+ Add 5% GST'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT COLUMN: Live Exact Template Preview with Centered Watermark (7 cols) ══ */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Action Bar */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-gray-800 text-sm">Invoice Preview</span>
              <span className="text-[11px] text-gray-400">· Real-time template view</span>
            </div>

            {/* Primary Download / Print PDF Button */}
            <button
              type="button"
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-[#698156] hover:bg-[#546944] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Download clean PDF invoice or print"
            >
              <Printer className="w-4 h-4" />
              Download / Print PDF
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              LIVE SCREEN PREVIEW MATCHING THE USER'S INSPIRATION TEMPLATE
              ══════════════════════════════════════════════════════════════════ */}
          <div className="relative shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-200/80">
            
            <div
              id="printable-invoice"
              className="relative p-7 sm:p-10 bg-white min-h-[820px] flex flex-col justify-between overflow-hidden"
              style={{ minHeight: '840px' }}
            >
              
              {/* 
                ════════════════════════════════════════════════════════════
                STRICTLY CENTERED LOGO WATERMARK IN THE MIDDLE OF THE BILL
                ════════════════════════════════════════════════════════════
              */}
              <div
                className="watermark-wrapper absolute pointer-events-none select-none z-0 flex items-center justify-center text-center"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '360px',
                  maxWidth: '80%',
                  opacity: 0.08,
                  pointerEvents: 'none'
                }}
              >
                <img
                  src="/logo.png"
                  alt="Aanya Fashions Watermark"
                  className="w-full h-auto object-contain"
                  style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
                />
              </div>

              {/* ── Bill Content (relative z-10 for sharp readability) ── */}
              <div className="relative z-10 space-y-6">
                
                {/* 1. TOP HEADER: INVOICE title with 2 modern accent circles & logo + contact */}
                <div className="flex items-start justify-between pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-black tracking-wide text-gray-900 uppercase leading-none font-sans">
                        INVOICE
                      </h1>
                      <div className="flex items-center gap-0.5 ml-1">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#698156]" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#849E70] -ml-1.5" />
                      </div>
                    </div>
                    <div className="mt-1.5 text-xs font-bold text-gray-600">
                      Invoice No : <span className="text-[#698156] font-extrabold">{invoiceNo}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <img
                      src="/logo.png"
                      alt="Aanya Fashions"
                      className="h-10 w-auto object-contain ml-auto"
                    />
                    <div className="mt-1.5 text-[10px] text-gray-500 leading-tight">
                      <div>+91 91234 56789</div>
                      <div>care@aanyafashions.com</div>
                      <div>https://www.aanyafashions.com/</div>
                    </div>
                  </div>
                </div>

                {/* 2. CLIENT & INVOICE METADATA ROW */}
                <div className="flex justify-between items-start pt-1 text-xs">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">
                      INVOICE TO:
                    </span>
                    <div className="font-extrabold text-gray-900 text-sm">
                      {customerName.trim() || <span className="text-gray-300 font-normal italic">—</span>}
                    </div>
                    {customerAddress.trim() && (
                      <div className="text-gray-600 mt-0.5">{customerAddress.trim()}</div>
                    )}
                    {customerState.trim() && (
                      <div className="text-gray-600">{customerState.trim()}</div>
                    )}
                    {customerPhone.trim() && (
                      <div className="text-gray-500 mt-0.5">Phone: {customerPhone.trim()}</div>
                    )}
                  </div>

                  <div className="text-right text-gray-600 leading-relaxed">
                    <div>
                      <span className="font-bold text-gray-900">Document Date:</span> {formattedScreenDate}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">Payment Mode:</span> {paymentMode} ({paymentStatus})
                    </div>
                    <div>
                      <span className="font-bold text-gray-900">GSTIN:</span> 36AAHCA9482L1Z4
                    </div>
                  </div>
                </div>

                {/* 3. TABLE */}
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b-2 border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3.5 w-12 text-left">NO.</th>
                        <th className="py-2.5 px-3.5 text-left">PRODUCT DESCRIPTION</th>
                        <th className="py-2.5 px-3.5 text-right w-28">PRICE (₹)</th>
                        <th className="py-2.5 px-3.5 text-center w-16">QTY</th>
                        <th className="py-2.5 px-3.5 text-right w-32">TOTAL (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {billItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-gray-400 italic">
                            No items added to invoice yet
                          </td>
                        </tr>
                      ) : (
                        billItems.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-3.5 text-gray-500 font-bold font-mono text-[11px]">
                              {String(i + 1).padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-gray-900 uppercase text-[11px]">
                              {item.name}
                            </td>
                            <td className="py-2.5 px-3.5 text-right text-gray-700 text-[11px]">
                              {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3.5 text-center font-bold text-gray-900 text-[11px]">
                              {String(item.quantity).padStart(2, '0')}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-extrabold text-gray-900 text-[11px]">
                              {(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. BOTTOM SECTION SPLIT */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-2">
                  
                  {/* LEFT: Payment details, Terms, Amount in Words */}
                  <div className="flex-1 max-w-sm space-y-3.5">
                    
                    {/* Payment Method Card */}
                    <div className="bg-[#F8FAFC] border border-gray-200/80 rounded-xl p-3.5 text-[11px] text-gray-600 leading-snug space-y-0.5">
                      <div className="font-extrabold uppercase tracking-wider text-gray-900 text-[9px] mb-1">
                        PAYMENT METHOD
                      </div>
                      <div>Bank Account: <span className="font-bold text-gray-900">06410100042434</span></div>
                      <div>Bank: <span className="font-bold text-gray-900">HDFC Bank (IFSC: HDFC0001245)</span></div>
                      <div>UPI ID: <span className="font-bold text-[#698156]">aanyafashions@okhdfcbank</span></div>
                    </div>

                    {/* Terms */}
                    <div className="text-[10px] text-gray-500 leading-normal">
                      <div className="font-extrabold uppercase tracking-wider text-gray-900 text-[9px] mb-0.5">
                        TERMS & CONDITION
                      </div>
                      <div>Payment completed. Goods once sold can be exchanged within 7 days of invoice date with intact tags.</div>
                    </div>

                    {/* Amount in words badge */}
                    <div className="inline-block bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] text-gray-700">
                      Amount in Words: <span className="font-extrabold text-gray-900">{billItems.length > 0 ? numberToWordsINR(grandTotal) : '—'}</span>
                    </div>

                  </div>

                  {/* RIGHT: Totals & Signature */}
                  <div className="w-full sm:w-64 space-y-6">
                    
                    {/* Totals Table */}
                    <div className="text-xs space-y-1.5">
                      <div className="flex justify-between py-1 text-gray-600 border-b border-gray-100">
                        <span>Sub Total</span>
                        <span className="font-bold text-gray-900">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {calculatedDiscount > 0 && (
                        <div className="flex justify-between py-1 text-emerald-600 border-b border-gray-100 font-bold">
                          <span>Discount</span>
                          <span>- ₹{calculatedDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-1 text-gray-600 border-b border-gray-100">
                        <span>GST (5%)</span>
                        <span className="font-bold text-gray-900">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between items-baseline pt-2">
                        <span className="text-sm font-extrabold text-gray-900">Total</span>
                        <span className="text-lg font-black text-[#698156]">
                          ₹{Math.round(grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Authorized Signatory */}
                    <div className="pt-2 text-center">
                      <div className="flex justify-center h-9">
                        <SignatureSVG className="w-28 h-full" />
                      </div>
                      <div className="text-[11px] font-extrabold text-gray-900 uppercase mt-1">
                        AANYA FASHIONS PVT LTD
                      </div>
                      <div className="text-[9px] text-gray-400 capitalize">
                        Authorized Signatory
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* ── FOOTER BAR AT BOTTOM ── */}
              <div className="relative z-10 pt-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-[10px] text-gray-400">
                <div>
                  +91 91234 56789 | care@aanyafashions.com | Page 1 of 1
                </div>

                <div className="flex items-center gap-1.5 bg-[#698156] text-white font-bold px-3.5 py-1 rounded-full text-[10px] shadow-2xs">
                  <span>Thank you for your Business!</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A8BFA0]" />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ─── MODAL: IMPORT FROM PRODUCT CATALOGUE ─── */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F4F6F2] border border-[#DCE4D7] flex items-center justify-center text-[#698156]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-gray-900">
                    Product Catalogue
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select products from your catalogue to add to the invoice
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToCatalog && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCatalogModalOpen(false);
                      onNavigateToCatalog();
                    }}
                    className="hidden sm:flex items-center gap-1 text-xs text-[#698156] hover:text-[#546944] font-bold px-3 py-1.5 rounded-lg hover:bg-[#F4F6F2] transition cursor-pointer"
                  >
                    <span>Full Catalog Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 bg-gray-50/70 border-b border-gray-100 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by product name, category, or style..."
                    value={modalSearch}
                    onChange={e => setModalSearch(e.target.value)}
                    className="w-full pl-10 pr-12 py-2 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-[#698156]/20 text-xs sm:text-sm text-gray-800 placeholder-gray-400"
                    autoFocus
                  />
                  {modalSearch && (
                    <button
                      type="button"
                      onClick={() => setModalSearch('')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {cartCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleImportFromCart();
                      refreshCartCount();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#F4F6F2] hover:bg-[#E8EDE4] text-[#698156] border border-[#DCE4D7] rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Import Cart Items ({cartCount})</span>
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {categories.map(cat => {
                  const isActive = modalCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setModalCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#698156] text-white shadow-2xs'
                          : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50/40">
              {modalFilteredProducts.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Package className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-gray-700">No products found</p>
                  <p className="text-xs text-gray-400">Try changing your search term or category filter</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {modalFilteredProducts.map((p: any) => {
                    const prodImg = (p.images && p.images.length > 0 ? p.images[0] : null) || p.image_url || p.image || '';
                    const itemInBill = billItems.find(item => String(item.id) === String(p.id));
                    const inBillQty = itemInBill ? itemInBill.quantity : 0;

                    return (
                      <div
                        key={p.id}
                        className={`bg-white rounded-2xl border transition-all p-3 flex flex-col justify-between gap-3 shadow-2xs ${
                          inBillQty > 0 ? 'border-[#698156] ring-1 ring-[#698156]/20 bg-[#F4F6F2]/30' : 'border-gray-200 hover:border-[#698156]/40 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex gap-3 items-start">
                          <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {prodImg ? (
                              <img src={prodImg} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl text-gray-400">👗</div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="inline-block text-[10px] font-bold text-[#698156] bg-[#F4F6F2] px-2 py-0.5 rounded-md mb-1">
                              {p.category || 'General'}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug" title={p.name}>
                              {p.name}
                            </h4>
                            <div className="mt-1.5 flex items-baseline gap-2">
                              <span className="text-xs sm:text-sm font-extrabold text-[#698156]">
                                ₹{Number(p.price || 0).toLocaleString('en-IN')}
                              </span>
                              {p.compare_at_price && (
                                <span className="text-[10px] text-gray-400 line-through">
                                  ₹{Number(p.compare_at_price).toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Stock: {p.stock_quantity ?? 25} units
                            </p>
                          </div>
                        </div>

                        {/* Action inside card */}
                        <div>
                          {inBillQty > 0 ? (
                            <div className="flex items-center justify-between bg-[#F4F6F2] border border-[#DCE4D7] rounded-xl p-1 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = billItems.findIndex(i => String(i.id) === String(p.id));
                                  if (idx >= 0) handleUpdateQty(idx, -1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-[#698156] hover:bg-[#698156]/15 font-bold text-xs transition cursor-pointer shadow-2xs"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-[#2F3C25] flex items-center gap-1">
                                <Check className="w-3 h-3 text-[#698156]" />
                                {inBillQty} in Invoice
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const idx = billItems.findIndex(i => String(i.id) === String(p.id));
                                  if (idx >= 0) handleUpdateQty(idx, 1);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-[#698156] hover:bg-[#698156]/15 font-bold text-xs transition cursor-pointer shadow-2xs"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddItem(p)}
                              className="w-full py-2 px-3 bg-[#698156] hover:bg-[#546944] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Invoice</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-600">
                  <span className="font-bold text-gray-900">{billItems.length}</span> {billItems.length === 1 ? 'product' : 'products'} on invoice
                  <span className="mx-2 text-gray-300">•</span>
                  Total: <span className="font-extrabold text-[#698156] text-sm">₹{Math.round(grandTotal).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#698156] hover:bg-[#546944] text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Done & View Invoice</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
