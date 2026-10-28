# Aanya Fashions E-Commerce & Omnichannel Retail Platform
## Comprehensive Master Implementation Plan (UT-FEC-2026-01)

---

### Document Control & Metadata

| Field | Detail |
| :--- | :--- |
| **Project Name** | Aanya Fashions Omnichannel E-Commerce & Retail Platform |
| **Project Code** | `UT-FEC-2026-01` |
| **Document Version** | `2.0 (Master Implementation Baseline)` |
| **Release State** | Production-Ready Architecture & Execution Baseline |
| **Date of Baseline** | October 06, 2026 |
| **Executive Sponsor** | Rajesh Sharma (*VP, E-Commerce & Retail, UNAI TECH PVT LTD*) |
| **Technical PMO & Architecture** | Antigravity PMO & Engineering Group |
| **Target Launch Window** | August 15, 2026 – October 20, 2026 |
| **Total Capital Expenditure** | $99,000 USD (Approved Budget Baseline) |

---

## 1. Executive Summary & Project Charter Alignment

### 1.1 Business Case & Strategic Vision
Aanya Fashions is an esteemed Indian ethnic apparel fashion house celebrated for master-weaver silk sarees, designer kurtis, bridal lehengas, and contemporary fusion wear. Despite strong brand resonance, the business previously suffered from fragmented operations: boutique stores operated on disconnected physical point-of-sale registers, stock was tracked manually in spreadsheets, and digital sales were restrained by an incomplete web prototype.

The primary objective of project **`UT-FEC-2026-01`** is to architect, engineer, and deploy an omnichannel, cloud-native commerce ecosystem that bridges the luxury digital storefront with in-store physical retail boutique operations. By deploying a unified inventory and transaction backend, Aanya Fashions eliminates multi-channel stockouts, delivers a luxury mobile-first shopping experience tailored for Indian consumers, and equips retail staff with a high-speed Point of Sale (POS) counter billing terminal.

```
                           ┌───────────────────────────────────────────────┐
                           │            Aanya Fashions Platform            │
                           └──────────────────────┬────────────────────────┘
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
    ┌───────────────────────────┐                                   ┌───────────────────────────┐
    │     Digital Storefront    │                                   │    In-Store Retail POS    │
    │  (React 18 / Tailwind /   │                                   │    & Admin Control Hub    │
    │   Motion / Lucide Web)    │                                   │ (AdminAanyaPage/Billing)  │
    └─────────────┬─────────────┘                                   └─────────────┬─────────────┘
                  │                                                               │
                  │     REST API / JSON & Supabase Client (JWT Auth)              │
                  └───────────────────────────────┬───────────────────────────────┘
                                                  ▼
                                ┌───────────────────────────────────┐
                                │       Node.js / Express 5 API     │
                                │   + Supabase PostgreSQL Database  │
                                │   - RLS Security Policies         │
                                │   - Realtime Broadcast Channels   │
                                └─────────────────┬─────────────────┘
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
    ┌───────────────────────────┐                                   ┌───────────────────────────┐
    │    Indian Payment Rail    │                                   │   Media & Catalog AI      │
    │  - UPI (GPay, PhonePe)    │                                   │ - @imgly WebAssembly BGR  │
    │  - RuPay, Visa, MC        │                                   │ - Instagram Graph Sync    │
    │  - Net Banking & COD      │                                   │ - Thermal ESC/POS Print   │
    └───────────────────────────┘                                   └───────────────────────────┘
```

### 1.2 Core Scope Boundaries

#### In-Scope Deliverables
1. **Consumer Storefront Web App**: High-performance single page application built on React 18, TypeScript, and Vite with luxury Indian fashion design (Bromello typography, `#698156` brand palette, gold accents).
2. **Indian Payment Ecosystem**: Multi-tier checkout supporting Unified Payments Interface (UPI via Google Pay, PhonePe, Paytm), RuPay/Visa/MasterCard credit/debit cards, 50+ domestic net banking institutions, and Cash on Delivery (COD).
3. **Omnichannel Admin Control Suite (`AdminAanyaPage.tsx`)**: Unified administrative cockpit providing catalog lifecycle management, dynamic category classification, customer CRM, order fulfillment, and analytical reporting.
4. **Boutique In-Store Point of Sale Billing Counter (`AdminBillingSection.tsx`)**: High-speed cashier counter with SKU lookup, barcode reader support, tax calculations (CGST/SGST/IGST), number-to-words INR converter, and instant 58mm/80mm thermal receipt & A4 invoice generation.
5. **Real-Time Synchronized Inventory (`AdminInventorySection.tsx`)**: Multi-channel stock synchronization ensuring that items sold in the retail boutique immediately deduct from online availability with zero delay.
6. **AI Media Processing & Social Integration**: In-browser client-side WebAssembly background removal (`@imgly/background-removal`) for rapid apparel photo cataloging and automated Instagram feed syndication (`scripts/sync_instagram.js`).

#### Out-of-Scope (Phase 1)
1. Native compiled binary mobile applications for Apple App Store or Google Play Store (mobile users are served via mobile-first Progressive Web App responsive design).
2. Cross-border customs, duties, and foreign exchange processing (limited strictly to domestic Indian Rupee `INR` currency).
3. Open third-party marketplace seller onboarding (the platform is dedicated solely to Aanya Fashions brand collections and official boutique outlets).

### 1.3 Key Success Metrics (KPIs)
* **Digital Sales Conversion**: Increase online conversion rates by >= 35% within the first 90 days.
* **Inventory Integrity**: Attain 100% stock accuracy across physical boutique stores and online channels with zero overselling incidents.
* **Checkout Velocity**: Maintain an average digital checkout completion duration of under 60 seconds.
* **Front-end Performance**: Sub-1.8 second Largest Contentful Paint (LCP) and Lighthouse performance audit rating >= 90.
* **Boutique Cashier Productivity**: Under 30 seconds average transaction time for in-store walk-in customer billing.

---

## 2. Technical Architecture & Technology Stack

### 2.1 Stack Blueprint

| Layer | Selected Technology | Version / Specification | Rationale & Strategic Value |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | React 18.3.1 / TS 5.x | High-efficiency component tree, type safety, and rich ecosystem support. |
| **Build & Bundling** | Vite | Vite 6.3.5 | Instant Hot Module Replacement (HMR) and optimized Rollup asset chunking. |
| **Styling & Design Tokens** | Tailwind CSS + Vanilla CSS | Tailwind v4.1 / Theme CSS | Standardized typography, fluid layouts, responsive breakpoints (`sm` through `xl`). |
| **Motion & Micro-interactions** | Motion (`motion/react`) | 12.23.24 | Smooth hardware-accelerated animations for drawer transitions, modals, and hover zooms. |
| **Icons & Visual Assets** | Lucide React | 0.487.0 | Clean, lightweight SVG vector icons matching minimal luxury fashion styling. |
| **UI Primitive Components** | Radix UI | Latest primitives | Accessible keyboard navigation, focus management, dialogs, dropdowns, and accordions. |
| **Client-Side AI Engine** | `@imgly/background-removal` | 1.7.0 (WebAssembly) | Client-side neural network execution to strip photo backgrounds without external API bills. |
| **Backend API Runtime** | Node.js + Express | Express 5.2.1 / Node 20 LTS | Lightweight RESTful microservice layer handling authenticated endpoints and static uploads. |
| **Database & Identity Engine**| Supabase PostgreSQL | PostgreSQL 15+ Managed | Enterprise relational database with Row-Level Security, real-time triggers, and Auth JWTs. |
| **Image Processing (Node)** | Jimp | 1.6.1 | Server-side image manipulation and asset scaling. |
| **Hosting & CDN** | Vercel (Front) + Supabase (DB)| Cloud Multi-Zone | Edge routing, global asset distribution, automated SSL, and sub-15ms DNS latency. |

### 2.2 Visual Identity & Design System

The application design mirrors luxury Indian fashion houses, balancing traditional heritage aesthetics with contemporary minimalism:

* **Primary Palette**:
  * `--primary`: `#698156` (Deep Royal Olive / Pistachio Green)
  * `--primary-hover`: `#546944`
  * `--primary-light`: `#F4F6F2` (Soft Sage Tint)
  * `--accent`: `#EBF0E6`
* **Neutrals & Backdrops**:
  * `--background`: `#FFFFFF` (Pure Studio White)
  * `--foreground`: `#1C2218` (High-contrast charcoal slate)
  * `--card`: `#FFFFFF` with soft borders (`rgba(105, 129, 86, 0.18)`)
  * `--muted`: `#F4F6F2`
* **Typography Hierarchy**:
  * **Brand Script / Luxury Accents**: `Bromello` custom web font (`/fonts/bromello.ttf`) for signature hero banners and luxury badges.
  * **Headings & Body Copy**: Inter / Outfit / Sans-serif system font stack with crisp tracking and high readability.
* **Pricing Standard**:
  * Formatted consistently in Indian Rupee notation: `₹` symbol prefix with commas matching Indian standards (`₹1,499`, `₹12,999`, `₹1,25,000`).

---

## 3. Database Architecture & Data Models

The persistence layer is architected in Supabase PostgreSQL, employing strict relational foreign keys, cascade logic, constraint checks, and Row-Level Security (RLS) policies.

```
                    ┌─────────────────────────┐
                    │     auth.users (Auth)   │
                    └────────────┬────────────┘
                                 │ 1:1
                                 ▼
                    ┌─────────────────────────┐
                    │     public.profiles     │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │ 1:N                   │ 1:N                   │ 1:N
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  public.orders  │     │ public.wishlist │     │  public.reviews │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ├───────────────────────┐
         │ 1:N                   │ 1:N
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│public.order_items│    │ public.payments │
└────────┬────────┘     └─────────────────┘
         │ N:1
         ▼
┌─────────────────┐     N:1     ┌─────────────────┐
│ public.products │────────────►│public.categories│
└─────────────────┘             └─────────────────┘
```

### 3.1 Relational Schema Definitions

#### 1. `profiles` (User & Staff Directory)
```sql
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'admin')),
  status text default 'Active' check (status in ('Active', 'Blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 2. `categories` (Taxonomy Hierarchy)
```sql
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null,
  description text,
  image_url text,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```
*Core Initial Categories*: `Sarees`, `Kurtis`, `Lehengas`, `Salwar Sets`, `Western`, `Tradition`, `Maxi`.

#### 3. `products` (Master Apparel Catalog)
```sql
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  price numeric(10, 2) not null default 0,
  compare_at_price numeric(10, 2),
  category text not null default 'Sarees',
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  images text[] default '{}',
  stock_quantity integer default 25 not null,
  low_stock_threshold integer default 5 not null,
  status text default 'Published' check (status in ('Draft', 'Published', 'Archived')),
  rating numeric(3, 2) default 4.8,
  colors text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 4. `orders` & `order_items` (Unified Transaction Core)
```sql
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  order_number text unique,
  total_amount numeric(10, 2) not null,
  discount_amount numeric(10, 2) default 0,
  final_amount numeric(10, 2) not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_status text default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed', 'Refunded')),
  payment_method text not null,
  shipping_address jsonb,
  billing_address jsonb,
  tracking_number text,
  notes text,
  is_pos_sale boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(10, 2) not null,
  quantity integer default 1 not null,
  subtotal numeric(10, 2) not null,
  size text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 5. `payments` (Reconciliation & Audit Trail)
```sql
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  transaction_id text unique,
  payment_method text not null,
  amount numeric(10, 2) not null,
  status text default 'Pending' check (status in ('Pending', 'Success', 'Failed')),
  gateway_response jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

#### 6. Supporting Entities
* `coupons`: Promotional codes, percentage or flat discounts, expiry bounds, usage limits.
* `reviews`: Star ratings (1-5), verified buyer badges, textual reviews, administrative moderation.
* `wishlist`: Customer-saved apparel items synchronized across authenticated sessions.
* `carts` & `cart_items`: Cross-device shopping carts.
* `banners`: Dynamic promotional banners and countdown sale alerts.

### 3.2 Row-Level Security (RLS) Matrix

| Table | Anonymous Customer (`anon`) | Authenticated Customer (`authenticated`) | Administrator (`role = 'admin'`) |
| :--- | :--- | :--- | :--- |
| `products` | `SELECT` where `status = 'Published'` | `SELECT` where `status = 'Published'` | Full Access (`ALL`) |
| `categories` | `SELECT` where `status = 'Active'` | `SELECT` where `status = 'Active'` | Full Access (`ALL`) |
| `profiles` | None | `SELECT`, `UPDATE` own profile (`id = auth.uid()`) | Full Access (`ALL`) |
| `orders` | `INSERT` (Guest checkout) | `SELECT`, `INSERT` own orders (`user_id = auth.uid()`) | Full Access (`ALL`) |
| `order_items` | `INSERT` (via Order creation) | `SELECT` if parent order belongs to user | Full Access (`ALL`) |
| `wishlist` | None (Stored in local storage) | `SELECT`, `INSERT`, `DELETE` own records | Full Access (`ALL`) |
| `reviews` | `SELECT` approved reviews | `SELECT` + `INSERT` own review | Full Access (`ALL`) |

---

## 4. Digital Storefront Implementation Blueprint

### 4.1 Route Map & Application Navigation (`src/app/routes.ts`)

The application router is structured using React Router with nested layout trees and role-protected administrative guards:

```
/ (RootLayout)
├── / (Home)
├── /product/:id (Product Details)
├── /cart (Cart Page)
├── /checkout (Multi-Step Checkout)
├── /orders (Customer Order History)
├── /search (AI-Powered Search Results)
├── /category/:category (Dynamic Collection Grid)
│   ├── /new-arrivals
│   ├── /sarees
│   ├── /kurtis
│   ├── /lehengas
│   ├── /salwar-sets
│   ├── /western
│   ├── /tradition
│   └── /maxi
├── /about (Brand Heritage & Artisan Story)
├── /contact (Customer Support & Inquiries)
├── /privacy & /terms (Compliance & Legal)
├── /payment-methods (Payment FAQs & Security)
├── /login | /admin/login (Admin Sign-In)
└── /admin (AdminRoute Guard -> AdminAanyaPage)
    ├── ?tab=overview (Executive KPI Dashboard)
    ├── ?tab=hero-models (Editorial Model Management)
    ├── ?tab=products (Catalog Products CRUD)
    ├── ?tab=inventory (Stock Ledger & Reorder Alerts)
    ├── ?tab=categories (Category Hierarchy Manager)
    ├── ?tab=billing (Boutique In-Store POS Terminal)
    ├── ?tab=orders (Order Fulfillment Tracking)
    ├── ?tab=customers (Customer CRM Directory)
    └── ?tab=payments (Financial Ledger & Reconciliation)
```

### 4.2 Key Storefront Components & User Journeys

#### A. Header, Navigation & Micro-Interactions (`Navigation.tsx`)
* **Responsive Layout**: Desktop sticky navigation featuring category dropdowns, search trigger, wishlist indicator with badge count, and shopping bag counter. On mobile screens (`< 768px`), smoothly transforms into a slide-over navigation drawer.
* **Customer Profile Modal (`ProfileModal.tsx`)**: Quick-access modal enabling customers to review saved addresses, check past order shipments, and update contact details without navigating away from their current shopping context.

#### B. Homepage Merchandising (`Home.tsx`)
1. **Announcement Bar**: Top ribbon broadcasting promo coupon codes (`AANYA10` for 10% off) and free domestic shipping notices.
2. **Hero Section (`HeroSection.tsx`)**: Editorial brand showcase featuring Bromello signature typography, dynamic featured model banners, and high-impact "Explore Collection" call-to-actions.
3. **Circular Category Bar (`FeaturedCategories.tsx`)**: Instant circular category shortcuts (Sarees, Kurtis, Lehengas, Salwars, Western, Tradition, Maxi) with active micro-scale animations.
4. **Curated Trending Collections (`TrendingCollection.tsx`)**: Dynamic grid highlighting highest-rated ethnic ensembles with real-time quick view modals (`QuickViewModal.tsx`).
5. **Flash Sale & Promotional Banners (`FlashSale.tsx`, `MotionBanner.tsx`)**: Time-sensitive seasonal promotions with countdown timers and instant coupon copy actions.
6. **Instagram Social Showcase (`InstagramGallery.tsx`)**: Direct visual proof syndicating curated Instagram fashion shoots (`@aanya.style`) with direct links to authentic posts.

#### C. Comprehensive Product Detail Page (`ProductPage.tsx`)
* **Gallery & Zoom**: High-resolution primary viewport with thumbnail strip and interactive modal magnification (`ZoomIn`).
* **Indian Apparel Attributes**: Dynamic attribute extractor displaying fabric blend, weave style, zari grade, care instructions, and pairing recommendations.
* **Variant & Size Selection**: Comprehensive size selection (`XS`, `S`, `M`, `L`, `XL`, `XXL`, `Free Size`) with interactive Indian size measurement guide.
* **Instant Conversion Controls**: Dual action buttons: "Add to Bag" (slides in cart confirmation) and "Buy Now" (bypasses cart to immediately launch checkout).

#### D. AI Search Engine (`src/lib/aiSearchEngine.ts`)
* Implements client-side phonetic and semantic token analysis.
* Matches traditional ethnic apparel terminology (e.g., searching "Banarasi" returns Banarasi silk sarees; searching "Choli" directs to lehenga ensembles).
* Supports instant autocomplete, fuzzy matching, and price range filtering.

---

## 5. Indian Localization & Checkout Engineering

### 5.1 Multi-Mode Domestic Payment Architecture

The checkout system (`CheckoutPage.tsx`) is designed specifically around Indian consumer purchase behaviors, where over 70% of consumer transactions occur via UPI and COD:

```
                          ┌───────────────────────────┐
                          │    CheckoutPage.tsx       │
                          │ (Step 1: Shipping Details │
                          │  Step 2: Payment Rail)    │
                          └─────────────┬─────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│     UPI Payments      │    │  Net Banking & Cards  │    │   Cash on Delivery    │
│  - Google Pay         │    │  - RuPay Debit Cards  │    │  - Doorstep Cash/UPI  │
│  - PhonePe            │    │  - Visa / MasterCard  │    │  - Address & Phone    │
│  - Paytm QR & VPA     │    │  - 50+ Domestic Banks │    │    Validation Checks  │
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

1. **UPI Rail (Unified Payments Interface)**:
   * Direct deep linking for mobile web (launches GPay, PhonePe, or Paytm app directly).
   * Dynamic QR Code rendering on desktop browsers allowing instant scan-and-pay from any UPI application.
2. **Card Infrastructure**:
   * Native support for RuPay (India's domestic card payment network) alongside Visa, MasterCard, and American Express.
3. **Net Banking Infrastructure**:
   * Direct integration presets for major Indian commercial and public sector banking institutions (State Bank of India, HDFC Bank, ICICI Bank, Axis Bank, Punjab National Bank).
4. **Cash on Delivery (COD)**:
   * Designed for customer trust in Tier-2 and Tier-3 cities; requires verified mobile telephone numbers and full postal address validation before dispatch creation.

### 5.2 Indian Tax & Number Formatting Standards
* **Currency Formatting**: Number formatting adheres to the Indian numbering system using commas at thousands, lakhs, and crores:
  $$\text{Amount: ₹} 1,25,000.00$$
* **Number to Words Invoicing Algorithm (`numberToWordsINR`)**: Built into the billing system to generate legally compliant tax invoices required by Indian commercial tax mandates (e.g., converts `₹12,499` to *"Rupees Twelve Thousand Four Hundred Ninety-Nine Only"*).

---

## 6. Boutique In-Store POS & Admin Suite Blueprint

### 6.1 Unified Admin Cockpit (`AdminAanyaPage.tsx`)

The administrative portal serves as the single source of truth for both online operations and in-store boutique management. It features persistent tab navigation synchronized across URL parameters (`?tab=...`), state, and local storage:

```
Admin Navigation Tabs:
[ Dashboard ] [ Hero Models ] [ Catalog Products ] [ Inventory Stock ]
[ Categories ] [ Boutique POS Counter ] [ Orders ] [ Customers ] [ Payments ]
```

### 6.2 Boutique POS Billing Counter (`AdminBillingSection.tsx`)

The POS counter is engineered for rapid execution by boutique cashiers during peak retail shopping hours:

* **Instant SKU & Barcode Lookup**: Cashiers can scan garments using standard USB/HID barcode scanners or search catalog products by name, SKU, or category.
* **Custom Line Items**: Option to enter bespoke boutique tailoring, custom alterations, or unlisted boutique accessories on-the-fly.
* **Multi-Modal Payment Tender**: Cashiers can record payments as Cash, UPI/QR, Credit/Debit Card, or Net Banking.
* **Dual Invoice Printing Formats**:
  1. **58mm / 80mm Thermal Receipt**: Styled via CSS `@media print` rules for instant output to point-of-sale thermal receipt printers with compact layout, store address, GSTIN number, and barcode.
  2. **Standard A4 Formal Tax Invoice**: Complete GST-compliant invoice detailing HSN codes, SGST (2.5%), CGST (2.5%), vendor signature SVG, and amount in words.
* **Persistent Billing Session**: Cashier cart state is saved to local storage so inadvertent browser refreshes do not lose an in-progress transaction.

```
+-------------------------------------------------------------------------+
|                         AANYA FASHIONS BOUTIQUE                         |
|                 GSTIN: 29AAAAA0000A1Z5 | Ph: +91 98765 43210            |
|-------------------------------------------------------------------------|
| Invoice: INV-7482                                   Date: 2026-10-06    |
| Cashier: Counter #01                                Payment: UPI / QR   |
| Customer: Ananya Sharma (+91 98123 45678)                               |
|-------------------------------------------------------------------------|
| Item                          Qty      Rate         Total (INR)         |
| Royal Maroon Silk Saree         1      4,999.00        4,999.00         |
| Banarasi Dupatta Alteration     1        500.00          500.00         |
|-------------------------------------------------------------------------|
| Subtotal:                                              5,499.00         |
| Store Discount (PROMO10 - 10%):                         -549.90         |
| Taxable Value:                                         4,949.10         |
| CGST (2.5%):                                             123.73         |
| SGST (2.5%):                                             123.73         |
|-------------------------------------------------------------------------|
| TOTAL PAYABLE:                                      INR 5,196.56        |
| Amount in Words: Rupees Five Thousand One Hundred Ninety-Six Only        |
+-------------------------------------------------------------------------+
```

### 6.3 Real-Time Multi-Channel Inventory Synchronization

To prevent overselling when a walk-in retail customer buys the last piece in a boutique store:
1. When a POS invoice is settled in `AdminBillingSection`, the system immediately executes an atomic decrement in the Supabase `products` table:
   $$\text{stock\_quantity} = \text{stock\_quantity} - \text{purchased\_quantity}$$
2. The transaction broadcasts an instant message over the Web `BroadcastChannel('products_channel')`.
3. All active customer storefront windows receive the update in real time and refresh their availability state without requiring manual page reload.

---

## 7. Media Automation & Social Commerce Pipeline

```
                               ┌─────────────────────────────────┐
                               │     Raw Apparel Photography     │
                               │  (Mobile Phone / DSLR Upload)   │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Client-Side WebAssembly AI     │
                               │  (@imgly/background-removal)    │
                               │  - Strips studio backdrops      │
                               │  - Generates transparent PNG    │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Automated Canvas Compositor    │
                               │  - Adds luxury studio lighting  │
                               │  - Formats to 4:5 aspect ratio  │
                               │  - Encodes to optimized WebP    │
                               └────────────────┬────────────────┘
                                                │
                                                ▼
                               ┌─────────────────────────────────┐
                               │  Supabase Storage / Public CDN  │
                               │  + Live Catalog Deployment      │
                               └─────────────────────────────────┘
```

### 7.1 Client-Side WebAssembly Background Removal
* Employs `@imgly/background-removal` running neural network inferences directly in the administrative user's browser via WebAssembly (WASM).
* Eliminates the need for expensive third-party background removal subscriptions (e.g., Cloudinary or Remove.bg APIs), saving thousands of dollars in monthly operational costs.
* Enables store managers to snap photos of new boutique inventory on a smartphone, upload them, and have catalog-ready transparent PNGs generated in under 5 seconds.

### 7.2 Instagram Shop Syndication (`scripts/sync_instagram.js`)
* Periodically crawls the official `@aanya.style` Instagram brand profile.
* Translates Instagram post media primary keys into canonical shortcodes using the base-64 conversion algorithm:
  $$\text{pkToShortcode}(pk) \rightarrow \text{Shortcode (e.g., DW\_JN3rESIG)}$$
* Downloads and caches recent editorial photography to `public/instagram/` with structured metadata saved to `posts.json` to guarantee ultra-fast storefront rendering without rate limiting.

---

## 8. Work Breakdown Structure (WBS) & Sprint Schedule

The execution timeline spans 10 weeks across 5 distinct phases:

```
2026          AUG                  SEP                       OCT
Week:      | W1 | W2 |   | W3 | W4 | W5 | W6 |   | W7 | W8 | W9 | W10 |
Phase 1:   [ Baseline ]
Phase 2:               [ Sprint 1: Storefront ]
Phase 3:                            [ Sprint 2: POS/Admin ]
Phase 4:                                         [ Sprint 3: Pay/AI ]
Phase 5:                                                    [ Hardening/Launch ]
```

### 8.1 Phase-by-Phase Roadmap

#### Phase 1: Inception & Architecture Baseline (August 15 – August 25, 2026)
* **Goal**: Establish technical foundations, database models, and design system tokens.
* **Deliverables**:
  - Sign-off on BRD, SRS, and Project Charter.
  - Setup Supabase Cloud instance; execute extensions (`uuid-ossp`, `pgcrypto`).
  - Deploy base schema (`supabase_complete_schema.sql`) with tables, triggers, and foreign keys.
  - Establish Vite + React 18 + TypeScript repository structure.
  - Configure design tokens in `theme.css` (`#698156`, neutrals, Bromello font assets).

#### Phase 2: Sprint 1 – Customer Storefront & Navigation (August 26 – September 12, 2026)
* **Goal**: Deliver a responsive digital storefront with rich catalog exploration.
* **Deliverables**:
  - Implement `Navigation.tsx` (sticky navbar, mobile drawer, search dialog).
  - Build `Home.tsx` with hero model carousel, category bar, trending products, and flash sale cards.
  - Implement `CategoryPage.tsx` supporting dynamic filtering by price, color, fabric, and availability.
  - Build `ProductPage.tsx` with image magnification, size matrix, and pairing recommendations.
  - Setup `CartContext.tsx` and `WishlistContext.tsx` with localStorage persistence.

#### Phase 3: Sprint 2 – Admin Suite & Boutique POS Billing (September 13 – September 28, 2026)
* **Goal**: Equip store staff with admin management and high-speed in-store billing.
* **Deliverables**:
  - Build `AdminRoute.tsx` and `AdminAuthContext.tsx` with secure JWT session handling.
  - Implement `AdminAanyaPage.tsx` tabbed dashboard (Overview, Catalog, Inventory, Customers, Orders).
  - Engineer `AdminBillingSection.tsx` POS cashier counter with SKU search and barcode reader listener.
  - Build GST tax breakdown engine and `numberToWordsINR` currency translator.
  - Design `@media print` thermal receipt (58mm/80mm) and A4 invoice formats with vector signatures.
  - Build `AdminInventorySection.tsx` with low-stock alerts and atomic stock decrement logic.

#### Phase 4: Sprint 3 – Payments, Media Pipeline & Social Sync (September 29 – October 08, 2026)
* **Goal**: Implement multi-tier checkout, AI background removal, and social commerce feeds.
* **Deliverables**:
  - Build `CheckoutPage.tsx` multi-step wizard (customer address capture, order review, payment mode).
  - Integrate domestic payment rails: UPI QR code generator, RuPay/Cards, Net Banking, and COD.
  - Implement client-side `@imgly/background-removal` WebAssembly pipeline in `AdminProducts.tsx`.
  - Finalize `scripts/sync_instagram.js` for automated `@aanya.style` catalog sync.
  - Implement real-time cross-tab inventory synchronization via `BroadcastChannel`.

#### Phase 5: UAT, Hardening & Production Go-Live (October 09 – October 20, 2026)
* **Goal**: Conduct rigorous security audits, POS hardware testing, staff training, and public launch.
* **Deliverables**:
  - End-to-end integration and smoke testing across mobile (iOS Safari, Android Chrome) and desktop.
  - In-store POS acceptance testing with USB barcode scanners and thermal receipt printers.
  - Security and compliance audit (DPDP Act, OWASP Top 10, Supabase RLS policy audit).
  - Final seed data verification (`seed_products.sql`, `fix_categories.sql`).
  - Production deployment to Vercel CDN with SPA rewrites (`vercel.json`, `_redirects`).
  - Formal sign-off and operational handover to retail store operations.

### 8.2 RACI Governance Matrix

| Milestone / Workstream | Rajesh Sharma (Sponsor) | Tech Lead / PMO | Frontend Dev | Backend Dev | Sneha Patel (Retail POS) | Vikram Desai (QA/Sec) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **BRD & SRS Sign-Off** | **A** | **R** | C | C | C | I |
| **Database & Schema Baseline** | I | **A** | I | **R** | I | C |
| **Storefront UI & Cart Flow** | I | **A** | **R** | C | I | C |
| **Boutique POS Counter Suite** | I | **A** | **R** | **R** | **C** | C |
| **Payment & Checkout Rails** | **A** | **R** | **R** | **R** | I | **C** |
| **Security & Compliance Audit** | I | **A** | I | I | I | **R** |
| **Final Production Go-Live** | **A** | **R** | C | C | C | C |

*Legend*: **R** = Responsible, **A** = Accountable, **C** = Consulted, **I** = Informed.

---

## 9. Security, Compliance & Non-Functional Architecture

### 9.1 Data Protection & DPDP Act Compliance
* **Data Minimization**: The customer registration and guest checkout forms collect only data necessary for fulfillment (recipient name, shipping address, telephone number, email).
* **Encryption Standards**:
  - All network traffic is enforced over TLS 1.3 with HSTS headers.
  - Database passwords and user secrets are hashed using `pgcrypto` (`blowfish`/`bcrypt` salt cost >= 10).
  - Supabase database instances operate with encrypted-at-rest volumes (AES-256).
* **Right to Erasure & Privacy Policy**: The platform provides a dedicated Privacy Policy page (`/privacy`) and user profile deletion controls honoring the Indian Digital Personal Data Protection (DPDP) Act.

### 9.2 Financial Security & PCI-DSS Scope Reduction
* **Card Data Handling**: Credit/debit card numbers and CVV codes are never stored on application servers or database tables. All card fields utilize direct tokenization with PCI-DSS Level 1 certified gateways.
* **Webhook Idempotency**: All payment gateway callbacks verify cryptographic HMAC signatures and maintain an idempotent ledger in the `payments` table to prevent duplicate transaction recording.

### 9.3 Performance & Reliability Benchmarks
* **Page Speed Optimization**:
  - All static photography is compressed into modern WebP format with dimensions tailored for high-DPI displays.
  - Non-critical components are code-split via React lazy loading and dynamic imports.
  - Client state uses optimistic UI updates to ensure instant visual feedback on cart and wishlist actions.
* **System High Availability**:
  - Platform runs across Supabase multi-availability zone infrastructure with automated daily snapshots.
  - Recovery Time Objective (RTO): $< 15$ minutes.
  - Recovery Point Objective (RPO): $< 5$ minutes.

---

## 10. Environment Configuration & Deployment Runbook

### 10.1 Environment Variables Matrix

The platform requires the following environment configuration variables defined across development, staging, and production environments:

#### Frontend (`.env` in Project Root)
```ini
# Supabase Cloud Project Configuration
VITE_SUPABASE_URL=https://cvhofhdwedszssqcngxb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aG9maGR3ZWRzenNxY25neGJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzcyMDgsImV4cCI6MjEwNjE1MzIwOH0.xxxxxxxxxxxx
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aG9maGR3ZWRzenNxY25neGJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU3NzIwOCwiZXhwIjoyMTA2MTUzMjA4fQ.xxxxxxxxxxxx

# Application Metadata
VITE_APP_TITLE="Aanya Fashions | Premium Ethnic Wear"
VITE_STORE_CURRENCY="INR"
```

#### Backend API (`server/.env`)
```ini
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://cvhofhdwedszssqcngxb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=super_secret_jwt_signing_key_aanya_2026
```

### 10.2 Database Provisioning & Script Sequence

When standing up new environments or disaster recovery targets, execute the SQL migration scripts in this exact sequential order:

1. **Master Schema Baseline**:
   `supabase_complete_schema.sql` (Creates extensions, 12 core tables, foreign keys, triggers, and RLS policies).
2. **Category Hierarchy Baseline**:
   `fix_categories.sql` (Inserts canonical categories: Sarees, Kurtis, Lehengas, Salwar Sets, Western, Tradition, Maxi).
3. **Core Apparel Catalog Seeds**:
   `seed_products.sql` & `seed_more_products.sql` (Populates authentic apparel catalog with descriptions, pricing, and image URLs).
4. **Media Path Normalization**:
   `fix_images.sql` (Ensures all product records link to high-resolution assets in `public/` or Supabase storage).
5. **Storage Bucket & Security Policies**:
   `setup_storage.sql` (Initializes `products`, `banners`, and `receipts` public buckets with read-write RLS rules).
6. **Administrator Account Elevation**:
   `setup_admin.sql` (Creates or promotes administrative accounts with full privileges).

### 10.3 Frontend Production Build & SPA Deployment

The Vite single-page application is configured with routing rules for edge CDN deployments:

* **Vercel Configuration (`vercel.json`)**:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```
* **Static Fallback (`public/_redirects`)**:
  ```text
  /*    /index.html   200
  ```

#### Build Execution Commands
```bash
# 1. Install all dependencies
npm install

# 2. Synchronize Instagram media cache
npm run sync:instagram

# 3. Compile TypeScript and build production bundle
npm run build

# 4. Preview compiled bundle locally
npm run preview
```

---

## 11. Quality Assurance, Testing & Validation Protocols

### 11.1 Test Case Matrix

| Module | Test ID | Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **Storefront** | `TC-SF-01` | Category Navigation & Filtering | Selecting "Sarees" displays only saree products; filtering by ₹5000+ returns valid items. |
| **Storefront** | `TC-SF-02` | Dynamic Search & Fuzzy Match | Searching "Banarasi" or "Silk" returns matching sarees with zero layout shifts. |
| **Cart** | `TC-CR-01` | Multi-Item Persistence | Items added to cart persist across page reloads and tab navigation. |
| **Checkout** | `TC-CO-01` | Complete UPI Flow | Customer can select UPI, view QR or open intent app, and place order successfully. |
| **Checkout** | `TC-CO-02` | Cash on Delivery (COD) | Placing order via COD marks order status as 'Pending' and payment_status as 'Pending'. |
| **Boutique POS**| `TC-POS-01`| Barcode Scanner / SKU Entry | Scanning/typing garment SKU instantly adds line item to cashier billing ledger. |
| **Boutique POS**| `TC-POS-02`| GST & Tax Calculations | Bill calculates 2.5% CGST + 2.5% SGST accurately; amount in words matches gross total. |
| **Boutique POS**| `TC-POS-03`| Thermal Receipt Printing | Clicking "Print Receipt" renders 58mm/80mm format without breaking layout. |
| **Inventory** | `TC-INV-01` | Atomic Stock Depletion | Completing a sale immediately decrements stock quantity in both DB and storefront. |
| **Media AI** | `TC-AI-01` | Client WebAssembly BGR | Uploading a raw fashion photo strips background and produces transparent PNG. |

### 11.2 Cross-Device & Browser Certification
* **Desktop**: Chrome 120+, Safari 17+, Firefox 120+, Microsoft Edge.
* **Mobile & Tablet**: iOS Safari 16+, Chrome on Android 12+, Samsung Internet.
* **Hardware**: Tested on POS receipt printers (Epson TM-T82, TVS RP-3200) and Honeywell USB barcode scanners.

---

## 12. Operational Governance & Post-Launch Roadmap

### 12.1 Operational Handover & Cashier Training Runbook
1. **Store Manager Onboarding**: Conduct 2-hour interactive training with boutique managers on `AdminAanyaPage.tsx`, covering inventory adjustments, discount codes, and order dispatch workflows.
2. **Cashier Quick-Start Card**: Laminate a 1-page quick-reference guide placed at each boutique billing counter detailing barcode scanner shortcuts, manual item entries, and thermal printer paper roll replacements.
3. **Daily Cash Reconciliation**: Store cashiers execute the end-of-day settlement report under `AdminAanyaPage.tsx?tab=payments` to cross-verify physical cash in the till against recorded POS transactions.

### 12.2 Post-Launch Feature Roadmap (Phase 2 & Beyond)
* **Native Mobile Apps (PWA to Capacitor / React Native)**: Wrap the responsive storefront into native iOS and Android apps with push notifications for flash sales.
* **Artisan Video Stories**: Embed short vertical videos on product pages showcasing master silk weavers handcrafting the garments.
* **International Expansion**: Enable multi-currency toggle (USD, GBP, AED, EUR) with DHL/FedEx automated international customs declarations.
* **WhatsApp Order Updates**: Integrate official WhatsApp Business API to deliver automated dispatch tracking and delivery confirmation messages to customers.

---

### Executive Sign-Off & Approvals

| Role | Name | Title | Signature / Status | Date |
| :--- | :--- | :--- | :--- | :--- |
| **Executive Project Sponsor** | Rajesh Sharma | VP, E-Commerce & Retail | **APPROVED** | 2026-10-06 |
| **Solutions Architect & PMO** | Lead PMO Architect | Antigravity PMO, UNAI TECH | **APPROVED** | 2026-10-06 |
| **Retail Operations Lead** | Sneha Patel | Boutique Store Operations | **APPROVED** | 2026-10-06 |
| **Quality & Security Lead** | Vikram Desai | Senior InfoSec & QA Lead | **APPROVED** | 2026-10-06 |
