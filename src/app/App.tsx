import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

export default function App() {
  return (
    <AdminAuthProvider>
      <CustomerAuthProvider>
        <WishlistProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </WishlistProvider>
      </CustomerAuthProvider>
    </AdminAuthProvider>
  );
}
