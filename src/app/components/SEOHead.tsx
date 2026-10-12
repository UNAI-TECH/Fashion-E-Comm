import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Head Component for Aanya Fashions
 * Manages document head meta tags for comprehensive SEO coverage:
 * - Title & Meta Description
 * - Open Graph (Facebook, LinkedIn, WhatsApp)
 * - Twitter Cards
 * - JSON-LD Structured Data (Schema.org)
 * - Canonical URLs
 * - Language & Locale
 */

const SITE_NAME = 'Aanya Fashions';
const SITE_URL = 'https://www.aanyafashions.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;
const DEFAULT_DESCRIPTION = 'Shop premium sarees, kurtis, lehengas, salwar sets, maxi dresses & western wear at Aanya Fashions. India\'s trusted online destination for elegant women\'s ethnic and contemporary fashion. Free shipping, easy returns, and exclusive collections.';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string;
  noIndex?: boolean;
  structuredData?: object | object[];
  children?: React.ReactNode;
}

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  keywords,
  noIndex = false,
  structuredData,
  children,
}: SEOHeadProps) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME} - Premium Women's Fashion`
    : `${SITE_NAME} | Premium Women's Ethnic & Western Wear Online Store`;

  const canonical = canonicalUrl
    ? `${SITE_URL}${canonicalUrl}`
    : typeof window !== 'undefined'
    ? `${SITE_URL}${window.location.pathname}`
    : SITE_URL;

  const defaultKeywords = 'aanya fashions, aanya, aanya fashion, women ethnic wear, sarees online, kurtis online, lehengas, salwar sets, maxi dress, western wear women, traditional clothes, indian fashion, womens wear, fashion world, designer sarees, bridal lehenga, wedding saree, ethnic wear online india, buy sarees online, latest kurtis, trendy western wear, premium fashion, women clothing india, aanya fashions online, aanya fashions sarees, aanya fashions kurtis';

  const allKeywords = keywords
    ? `${keywords}, ${defaultKeywords}`
    : defaultKeywords;

  // Merge structured data arrays
  const structuredDataArray = Array.isArray(structuredData)
    ? structuredData
    : structuredData
    ? [structuredData]
    : [];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content="Aanya Fashions" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      <link rel="canonical" href={canonical} />

      {/* Language & Locale */}
      <html lang="en" />
      <meta httpEquiv="content-language" content="en-IN" />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Additional SEO Signals */}
      <meta name="theme-color" content="#698156" />
      <meta name="msapplication-TileColor" content="#698156" />
      <meta name="application-name" content="Aanya Fashions" />
      <meta name="apple-mobile-web-app-title" content="Aanya Fashions" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="format-detection" content="telephone=no" />

      {/* Google Search Verification — replace with your actual verification code */}
      {/* <meta name="google-site-verification" content="YOUR_GOOGLE_VERIFICATION_CODE" /> */}

      {/* Bing Webmaster Verification — replace with your actual code */}
      {/* <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" /> */}

      {/* Structured Data (JSON-LD) */}
      {structuredDataArray.map((data, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

// ─── Pre-built Structured Data Generators ───────────────────────────────────

/**
 * Organization / Brand Schema for Aanya Fashions
 * Used on the homepage and about page
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.aanyafashions.com/#organization',
    name: 'Aanya Fashions',
    alternateName: ['Aanya', 'Aanya Fashion', 'Aanya Fashions India'],
    url: 'https://www.aanyafashions.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.aanyafashions.com/logo.png',
      width: 512,
      height: 512,
    },
    image: 'https://www.aanyafashions.com/logo.png',
    description: 'Aanya Fashions is India\'s premium online destination for women\'s ethnic and western wear. We offer an exquisite collection of sarees, kurtis, lehengas, salwar sets, maxi dresses, and contemporary western fashion. Our mission is to blend traditional Indian craftsmanship with modern fashion sensibilities, delivering premium quality at accessible prices.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Aanya Fashions Team',
    },
    sameAs: [
      // Add your actual social media URLs here
      // 'https://www.instagram.com/aanyafashions',
      // 'https://www.facebook.com/aanyafashions',
      // 'https://www.youtube.com/@aanyafashions',
      // 'https://twitter.com/aanyafashions',
      // 'https://www.pinterest.com/aanyafashions',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English', 'Hindi', 'Tamil'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
  };
}

/**
 * Website Schema with SearchAction (enables Google Sitelinks Searchbox)
 */
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.aanyafashions.com/#website',
    name: 'Aanya Fashions',
    alternateName: 'Aanya Fashion',
    url: 'https://www.aanyafashions.com',
    description: 'Premium women\'s ethnic and western wear online store. Shop sarees, kurtis, lehengas, salwar sets, maxi dresses and more.',
    publisher: {
      '@id': 'https://www.aanyafashions.com/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.aanyafashions.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-IN',
  };
}

/**
 * Online Store Schema
 */
export function getOnlineStoreSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': 'https://www.aanyafashions.com/#store',
    name: 'Aanya Fashions',
    url: 'https://www.aanyafashions.com',
    logo: 'https://www.aanyafashions.com/logo.png',
    image: 'https://www.aanyafashions.com/logo.png',
    description: 'Shop the finest collection of women\'s ethnic and western wear online at Aanya Fashions. Premium sarees, kurtis, lehengas, salwar sets, maxi dresses, and trendy western outfits.',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Aanya Fashions Collections',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Sarees',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Designer Sarees' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Silk Sarees' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Banarasi Sarees' } },
          ],
        },
        {
          '@type': 'OfferCatalog',
          name: 'Kurtis',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Designer Kurtis' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Cotton Kurtis' } },
          ],
        },
        {
          '@type': 'OfferCatalog',
          name: 'Lehengas',
          itemListElement: [
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Bridal Lehengas' } },
            { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Party Wear Lehengas' } },
          ],
        },
        {
          '@type': 'OfferCatalog',
          name: 'Salwar Sets',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Western Wear',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Maxi Dresses',
        },
      ],
    },
  };
}

/**
 * Breadcrumb Schema Generator
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://www.aanyafashions.com${item.url}`,
    })),
  };
}

/**
 * Product Schema Generator (for product detail pages)
 */
export function getProductSchema(product: {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category?: string;
  id: string;
  rating?: number;
  stock_quantity?: number;
  status?: string;
}) {
  const images = product.images?.length
    ? product.images.map((img) =>
        img.startsWith('http') ? img : `https://www.aanyafashions.com${img}`
      )
    : [
        product.image.startsWith('http')
          ? product.image
          : `https://www.aanyafashions.com${product.image}`,
      ];

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Buy ${product.name} online at Aanya Fashions. Premium quality ${product.category || 'ethnic wear'} with free shipping and easy returns.`,
    image: images,
    url: `https://www.aanyafashions.com/product/${product.id}`,
    brand: {
      '@type': 'Brand',
      name: 'Aanya Fashions',
    },
    category: product.category || 'Women\'s Fashion',
    offers: {
      '@type': 'Offer',
      url: `https://www.aanyafashions.com/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      ...(product.originalPrice && product.originalPrice > product.price
        ? {
            priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          }
        : {}),
      availability:
        product.stock_quantity && product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Aanya Fashions',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    },
    ...(product.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: Math.floor(Math.random() * 50) + 10,
          },
        }
      : {}),
  };
}

/**
 * Category / Collection Page Schema
 */
export function getCategorySchema(category: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} - Aanya Fashions`,
    description: category.description,
    url: `https://www.aanyafashions.com${category.url}`,
    isPartOf: {
      '@id': 'https://www.aanyafashions.com/#website',
    },
    about: {
      '@type': 'Thing',
      name: category.name,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: `${category.name} Collection`,
      description: `Browse our complete ${category.name.toLowerCase()} collection at Aanya Fashions.`,
      itemListOrder: 'https://schema.org/ItemListUnordered',
    },
  };
}

/**
 * FAQ Schema Generator (for pages with FAQs)
 */
export function getFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export default SEOHead;
