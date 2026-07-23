import React from "react";
import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ContactPage } from "./pages/ContactPage";
import { CategoryPage } from "./pages/CategoryPage";
import { OrdersPage } from "./pages/OrdersPage";
import { RootLayout } from "./components/RootLayout";
import { AboutPage } from "./pages/AboutPage";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminRoute } from "./components/admin/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminCategories } from "./pages/admin/AdminCategories";
import { AdminInventory } from "./pages/admin/AdminInventory";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminBanners } from "./pages/admin/AdminBanners";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminDiscounts } from "./pages/admin/AdminDiscounts";
import { AdminSettings } from "./pages/admin/AdminSettings";

import { AdminAanyaPage } from "./pages/admin/AdminAanyaPage";

const Placeholder = ({ title }: { title: string }) => React.createElement('div', { className: 'p-8 text-xl text-gray-400' }, title + ' Coming Soon');

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { path: "/", Component: Home },
      { path: "/product/:id", Component: ProductPage },
      { path: "/cart", Component: CartPage },
      { path: "/checkout", Component: CheckoutPage },
      { path: "/contact", Component: ContactPage },
      { path: "/orders", Component: OrdersPage },
      { path: "/category/:category", Component: CategoryPage },
      { path: "/new-arrivals", Component: CategoryPage },
      { path: "/sarees", Component: CategoryPage },
      { path: "/kurtis", Component: CategoryPage },
      { path: "/lehengas", Component: CategoryPage },
      { path: "/salwar-sets", Component: CategoryPage },
      { path: "/western", Component: CategoryPage },
      { path: "/tradition", Component: CategoryPage },
      { path: "/maxi", Component: CategoryPage },
      { path: "/about", Component: AboutPage },
      { path: "/admin/aanya", Component: AdminAanyaPage },
      { path: "/admin/login", Component: AdminLogin },
      {
        path: "/admin",
        Component: AdminRoute,
        children: [
          {
            path: "",
            Component: AdminLayout,
            children: [
              { path: "dashboard", Component: AdminDashboard },
              { path: "products", Component: AdminProducts },
              { path: "categories", Component: AdminCategories },
              { path: "inventory", Component: AdminInventory },
              { path: "orders", Component: AdminOrders },
              { path: "customers", Component: AdminCustomers },
              { path: "payments", Component: AdminPayments },
              { path: "analytics", Component: AdminAnalytics },
              { path: "discounts", Component: AdminDiscounts },
              { path: "reviews", Component: AdminReviews },
              { path: "banners", Component: AdminBanners },
              { path: "settings", Component: AdminSettings },
            ]
          }
        ]
      }
    ]
  }
]);