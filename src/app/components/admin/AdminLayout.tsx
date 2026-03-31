import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, LayoutDashboard, ShoppingBag, Tags, ShoppingCart, 
  Users, CreditCard, Warehouse, LineChart, Ticket, Star, 
  Image as ImageIcon, Settings, LogOut, Bell, Search
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

export function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { logout, adminName } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Inventory', path: '/admin/inventory', icon: Warehouse },
    { name: 'Analytics', path: '/admin/analytics', icon: LineChart },
    { name: 'Discounts', path: '/admin/discounts', icon: Ticket },
    { name: 'Reviews', path: '/admin/reviews', icon: Star },
    { name: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const filteredItems = searchQuery 
    ? navItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const notifications = [
    { id: 1, text: 'New Order #1234 received', time: '5m ago', unread: true },
    { id: 2, text: 'Inventory low: Maroon Silk Saree', time: '1h ago', unread: true },
    { id: 3, text: 'Customer review received ★★★★☆', time: '3h ago', unread: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] text-white shadow-xl transform transition-transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <span className="text-xl font-serif text-[#D4AF37] font-bold">AfforX Admin</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)] custom-scrollbar">
          {navItems.map((item) => (
             <NavLink
               key={item.name}
               to={item.path}
               onClick={() => setIsMobileMenuOpen(false)}
               className={({ isActive }) => `
                 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                 ${isActive ? 'bg-[#D4AF37] text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}
               `}
             >
               <item.icon className="w-5 h-5 flex-shrink-0" />
               <span className="font-medium">{item.name}</span>
             </NavLink>
          ))}

          <div className="pt-8 mt-8 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </motion.div>

      {/* Main Content wrapper */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative hidden sm:block">
              <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-[#D4AF37] focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search menus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm w-64"
                />
              </div>
              
              <AnimatePresence>
                {searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-2"
                  >
                    {filteredItems.length > 0 ? (
                      filteredItems.map(item => (
                        <NavLink
                          key={item.name}
                          to={item.path}
                          onClick={() => setSearchQuery('')}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-[#D4AF37]" />
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        </NavLink>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-400">No results found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-full transition-colors ${isNotificationsOpen ? 'bg-gray-100 text-[#D4AF37]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[60]"
                  >
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                      <span className="font-bold text-sm">Notifications</span>
                      <button className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${n.unread ? 'bg-blue-50/30' : ''}`}>
                          <p className="text-sm text-gray-800">{n.text}</p>
                          <span className="text-[10px] text-gray-400">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavLink 
              to="/admin/settings"
              className="flex items-center gap-3 pl-4 border-l border-gray-200 group"
            >
              <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                SA
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none">{adminName}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Administrator</p>
              </div>
            </NavLink>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
