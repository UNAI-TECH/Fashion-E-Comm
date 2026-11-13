import { toast } from 'sonner';

export interface InvoiceItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  sku?: string;
}

export interface InvoiceOrderData {
  orderId: string;
  trackingNumber?: string;
  date?: string | Date;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    full_name?: string;
    phone?: string;
  } | string;
  paymentMethod: string;
  paymentStatus?: string;
  transactionId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  deliveryCharge?: number;
  totalAmount: number;
}

/**
 * Generates an official, luxury branded A4 PDF Invoice matching Aanya Fashions brand standards
 * Uses off-screen iframe print dialog so it works natively on Desktop, iOS, and Android
 */
export function generateCustomerInvoicePDF(order: InvoiceOrderData): void {
  try {
    toast.info('Preparing your official invoice for download...');

    const orderId = order.orderId || `ORD-${Date.now().toString().slice(-6)}`;
    const formattedDate = order.date 
      ? new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const customerName = order.customerName?.trim() || 'Valued Customer';
    const customerPhone = order.customerPhone || '';
    const customerEmail = order.customerEmail || '';

    let formattedAddress = '';
    let formattedCityState = '';
    if (typeof order.shippingAddress === 'string') {
      formattedAddress = order.shippingAddress;
    } else if (order.shippingAddress) {
      formattedAddress = order.shippingAddress.address || '';
      const parts = [
        order.shippingAddress.city,
        order.shippingAddress.state,
        order.shippingAddress.pincode
      ].filter(Boolean);
      formattedCityState = parts.join(', ');
    }

    const paymentMethod = order.paymentMethod || 'Online (UPI / Cards)';
    const paymentStatus = order.paymentStatus || 'PAID';

    // GST Breakdown (5% GST inclusive for apparel)
    const grandTotal = Math.round(Number(order.totalAmount || 0));
    const subtotal = Math.round(Number(order.subtotal || grandTotal));
    const discount = Math.round(Number(order.discount || 0));
    const delivery = Math.round(Number(order.deliveryCharge || 0));

    // Calculate 5% GST portion
    const taxableAmount = grandTotal > 0 ? (grandTotal / 1.05) : 0;
    const gstTotal = grandTotal - taxableAmount;
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;

    const items = order.items && order.items.length > 0 ? order.items : [
      { name: 'Apparel Item', price: grandTotal, quantity: 1 }
    ];

    const itemsRowsHtml = items.map((item, idx) => {
      const itemTotal = (item.price * (item.quantity || 1)).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      const itemPrice = item.price.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      return `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 10px 12px; font-weight: 700; color: #64748B; font-family: monospace; font-size: 11px;">
            ${String(idx + 1).padStart(2, '0')}
          </td>
          <td style="padding: 10px 12px; font-weight: 700; color: #0F172A; font-size: 11px;">
            <div style="text-transform: uppercase;">${item.name}</div>
            ${item.size || item.color ? `<div style="font-size: 9.5px; color: #64748B; font-weight: 500; margin-top: 2px;">Variant: ${[item.size, item.color].filter(Boolean).join(' / ')}</div>` : ''}
          </td>
          <td style="padding: 10px 12px; text-align: right; color: #334155; font-size: 11px;">
            ₹${itemPrice}
          </td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0F172A; font-size: 11px;">
            ${item.quantity || 1}
          </td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 800; color: #0F172A; font-size: 11px;">
            ₹${itemTotal}
          </td>
        </tr>
      `;
    }).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice #${orderId} - Aanya Fashions</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            background-color: #FFFFFF;
            color: #0F172A;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-container {
            width: 210mm;
            min-height: 297mm;
            padding: 18mm 16mm;
            margin: 0 auto;
            position: relative;
            background: #FFFFFF;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            max-width: 80%;
            opacity: 0.06;
            pointer-events: none;
            z-index: 0;
          }
          .content-layer {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 260mm;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- Background Watermark -->
          <img class="watermark" src="/logo.png" alt="" />

          <div class="content-layer">
            <div>
              <!-- Header -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #E2E8F0;">
                <div>
                  <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #698156; margin-bottom: 4px;">
                    ORIGINAL TAX INVOICE
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h1 style="font-size: 32px; font-weight: 900; letter-spacing: 0.02em; color: #0F172A; text-transform: uppercase; line-height: 1;">
                      INVOICE
                    </h1>
                    <div style="display: flex; align-items: center; gap: 3px; margin-left: 4px;">
                      <div style="width: 12px; height: 12px; border-radius: 50%; background: #698156;"></div>
                      <div style="width: 8px; height: 8px; border-radius: 50%; background: #849E70; margin-left: -4px;"></div>
                    </div>
                  </div>
                  <div style="margin-top: 8px; font-size: 11.5px; font-weight: 700; color: #475569;">
                    Invoice Ref: <span style="color: #698156; font-weight: 800;">${orderId}</span>
                  </div>
                  ${order.trackingNumber ? `
                    <div style="margin-top: 2px; font-size: 10.5px; color: #64748B;">
                      Tracking No: <span style="font-family: monospace; font-weight: 700; color: #0F172A;">${order.trackingNumber}</span>
                    </div>
                  ` : ''}
                </div>

                <div style="text-align: right;">
                  <img src="/logo.png" alt="Aanya Fashions" style="height: 52px; width: auto; object-fit: contain; margin-left: auto; display: block;" />
                  <div style="margin-top: 6px; font-size: 10px; color: #475569; line-height: 1.45;">
                    <div style="font-weight: 700; color: #0F172A; font-size: 11px;">Aanya Fashions Pvt Ltd</div>
                    <div>36/11 Bose Street, Kodungaiyur,</div>
                    <div>Vyasarpadi, Chennai - 600 118, Tamil Nadu.</div>
                    <div style="font-weight: 700; color: #0F172A; margin-top: 2px;">GSTIN: 33THXPS7636R1ZH</div>
                    <div style="color: #64748B;">Support: +91 90430 88697</div>
                  </div>
                </div>
              </div>

              <!-- Metadata Grid -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 0; font-size: 11px;">
                <div style="max-width: 50%;">
                  <div style="font-size: 9px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #94A3B8; margin-bottom: 4px;">
                    BILLED & SHIPPED TO:
                  </div>
                  <div style="font-size: 13px; font-weight: 800; color: #0F172A;">
                    ${customerName}
                  </div>
                  ${customerEmail ? `<div style="color: #475569; margin-top: 2px;">${customerEmail}</div>` : ''}
                  ${customerPhone ? `<div style="color: #475569; margin-top: 1px;">Phone: ${customerPhone}</div>` : ''}
                  ${formattedAddress ? `<div style="color: #475569; margin-top: 3px; line-height: 1.4;">${formattedAddress}</div>` : ''}
                  ${formattedCityState ? `<div style="color: #0F172A; font-weight: 600; margin-top: 1px;">${formattedCityState}</div>` : ''}
                </div>

                <div style="text-align: right; line-height: 1.6; color: #475569;">
                  <div><span style="font-weight: 700; color: #0F172A;">Invoice Date:</span> ${formattedDate}</div>
                  <div><span style="font-weight: 700; color: #0F172A;">Payment Method:</span> ${paymentMethod}</div>
                  <div>
                    <span style="font-weight: 700; color: #0F172A;">Payment Status:</span>
                    <span style="display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 9.5px; font-weight: 800; background: #ECFDF5; color: #047857; margin-left: 4px;">
                      ${paymentStatus}
                    </span>
                  </div>
                  ${order.transactionId ? `
                    <div><span style="font-weight: 700; color: #0F172A;">Transaction ID:</span> <span style="font-family: monospace;">${order.transactionId}</span></div>
                  ` : ''}
                  <div><span style="font-weight: 700; color: #0F172A;">Place of Supply:</span> Tamil Nadu (33)</div>
                </div>
              </div>

              <!-- Line Items Table -->
              <table style="margin-top: 8px;">
                <thead>
                  <tr style="background: #F8FAFC; border-top: 2px solid #0F172A; border-bottom: 2px solid #E2E8F0;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; width: 48px;">#</th>
                    <th style="padding: 10px 12px; text-align: left; font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Item Description</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; width: 90px;">Price</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; width: 55px;">Qty</th>
                    <th style="padding: 10px 12px; text-align: right; font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #475569; width: 100px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRowsHtml}
                </tbody>
              </table>

              <!-- Financial Summary Calculation Table -->
              <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
                <table style="width: 290px; font-size: 11px;">
                  <tr>
                    <td style="padding: 5px 8px; color: #64748B;">Subtotal:</td>
                    <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #0F172A;">₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  ${discount > 0 ? `
                    <tr>
                      <td style="padding: 5px 8px; color: #059669;">Promo Discount:</td>
                      <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #059669;">-₹${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 5px 8px; color: #64748B;">Estimated Taxable Value:</td>
                    <td style="padding: 5px 8px; text-align: right; color: #334155;">₹${taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 8px; color: #64748B;">CGST (2.5%):</td>
                    <td style="padding: 5px 8px; text-align: right; color: #334155;">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 8px; color: #64748B;">SGST (2.5%):</td>
                    <td style="padding: 5px 8px; text-align: right; color: #334155;">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 8px; color: #64748B;">Shipping / Delivery:</td>
                    <td style="padding: 5px 8px; text-align: right; font-weight: 700; color: #059669;">
                      ${delivery === 0 ? 'FREE' : `₹${delivery.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                  <tr style="border-top: 2px solid #0F172A; border-bottom: 2px solid #0F172A;">
                    <td style="padding: 8px 8px; font-weight: 800; font-size: 13px; color: #0F172A;">Grand Total:</td>
                    <td style="padding: 8px 8px; text-align: right; font-weight: 900; font-size: 15px; color: #698156;">₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>
              </div>
            </div>

            <!-- Footer / Terms / Signatory -->
            <div style="border-top: 1px solid #E2E8F0; padding-top: 16px; margin-top: 28px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="font-size: 9.5px; color: #64748B; line-height: 1.5; max-width: 60%;">
                  <div style="font-weight: 700; color: #0F172A; text-transform: uppercase; margin-bottom: 2px;">Terms & Conditions:</div>
                  <div>1. All goods sold are covered under Aanya Fashions' standard 7-day easy exchange policy.</div>
                  <div>2. Handloom and pure zari silks require professional dry-cleaning only.</div>
                  <div>3. This is a computer-generated tax invoice verified under Indian GST Law.</div>
                </div>

                <div style="text-align: right;">
                  <div style="font-family: serif; font-style: italic; font-size: 17px; color: #698156; font-weight: bold;">Aanya Fashions</div>
                  <div style="height: 1px; width: 140px; background: #94A3B8; margin: 4px 0 3px auto;"></div>
                  <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #475569;">
                    Authorized Signatory
                  </div>
                </div>
              </div>

              <div style="text-align: center; font-size: 9.5px; color: #94A3B8; margin-top: 16px; border-top: 1px dashed #E2E8F0; padding-top: 8px;">
                Thank you for your patronage! Visit us again at <span style="color: #698156; font-weight: 700;">www.aanyafashions.com</span>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Off-screen iframe printer (reliably triggers native PDF save on Chrome, Safari, Edge, Mobile)
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(invoiceHtml);
      doc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          toast.success('Invoice dialog opened! You can Save as PDF or Print.');
        } catch (err) {
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 2000);
        }
      }, 500);
    }
  } catch (err: any) {
    console.error('Invoice generation error:', err);
    toast.error('Failed to generate invoice: ' + err.message);
  }
}

