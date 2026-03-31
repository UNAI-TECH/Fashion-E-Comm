import React, { useState } from 'react';
import { User, Lock, Store, Link as LinkIcon, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h1>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden">
        
        {/* Settings Sidebar */}
        <div className="md:w-64 bg-gray-50 border-r border-gray-100 p-4 shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'profile', label: 'Admin Profile', icon: User },
              { id: 'security', label: 'Security & Auth', icon: Lock },
              { id: 'store', label: 'Store Defaults', icon: Store },
              { id: 'socials', label: 'Social Links', icon: LinkIcon }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === item.id 
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                    : 'text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="p-6 md:p-8 flex-1">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-6"
             >
                {activeTab === 'profile' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Admin Profile</h2>
                      <p className="text-sm text-gray-500 mb-6">Update your account information and email.</p>
                      
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input type="text" defaultValue="Super Admin" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <input type="email" defaultValue="admin@afforx.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37] focus:border-[#D4AF37]" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Security & Authentication</h2>
                      <p className="text-sm text-gray-500 mb-6">Manage your password and active sessions.</p>
                      
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                          <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input type="password" placeholder="••••••••" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'store' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Store Defaults</h2>
                      <p className="text-sm text-gray-500 mb-6">Configure platform-wide settings like currency and tax.</p>
                      
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                          <input type="text" defaultValue="AfforX Fashion" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                          <input type="text" defaultValue="₹" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Flat Delivery Fee (₹)</label>
                          <input type="number" defaultValue="49" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'socials' && (
                  <>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Social Links</h2>
                      <p className="text-sm text-gray-500 mb-6">Update links to your social media profiles.</p>
                      
                      <div className="space-y-4 max-w-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                          <input type="url" placeholder="https://instagram.com/..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                          <input type="url" placeholder="https://facebook.com/..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#D4AF37]" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-6 border-t border-gray-100 flex justify-end">
                   <button className="flex items-center gap-2 px-6 py-2 bg-[#1A1A1A] text-white rounded-lg hover:bg-black transition-colors font-medium">
                     <Save className="w-4 h-4" />
                     Save Changes
                   </button>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
