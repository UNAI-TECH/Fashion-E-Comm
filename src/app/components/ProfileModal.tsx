import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, User, ArrowRight, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
  UserProfileDetails,
  getUserProfileDetails,
  getUserProfileImage,
  saveUserProfileDetails
} from '../../lib/userProfile';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess?: (details: UserProfileDetails) => void;
  title?: string;
  subtitle?: string;
  actionButtonText?: string;
}

export function ProfileModal({
  isOpen,
  onClose,
  onSaveSuccess,
  title = 'My Profile',
  subtitle = 'Please enter your profile information to continue',
  actionButtonText = 'Save Details & Continue'
}: ProfileModalProps) {
  const { user, profile, signOut } = useCustomerAuth();
  const [profileDetails, setProfileDetails] = useState<UserProfileDetails>(getUserProfileDetails());
  const [profileImage, setProfileImage] = useState<string>(getUserProfileImage());

  // Re-sync with auth profile & storage when modal opens
  useEffect(() => {
    if (isOpen) {
      const stored = getUserProfileDetails();
      const meta = (user?.user_metadata || {}) as any;
      setProfileDetails({
        name: stored.name || profile?.full_name || meta.full_name || meta.name || '',
        phone: stored.phone || profile?.phone || meta.phone || '',
        gender: stored.gender || profile?.gender || meta.gender || '',
        email: stored.email || profile?.email || user?.email || '',
        address: stored.address || '',
        city: stored.city || '',
        pincode: stored.pincode || '',
        state: stored.state || '',
      });
      setProfileImage(getUserProfileImage());
    }
  }, [isOpen, user, profile]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result as string;
        setProfileImage(resultStr);
        toast.success('Profile photo selected!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Validation
    if (!profileDetails.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    const cleanPhone = profileDetails.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!profileDetails.address.trim()) {
      toast.error('Please enter your complete shipping address');
      return;
    }

    // Save
    saveUserProfileDetails(profileDetails, profileImage);
    toast.success('Profile details saved successfully!');

    if (onSaveSuccess) {
      onSaveSuccess(profileDetails);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center overflow-y-auto overflow-x-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full min-h-screen sm:min-h-0 sm:max-w-xl sm:my-8 bg-[#FFFFFF] sm:rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden border border-gray-100"
          >
            {/* Top Navigation Bar with Back button & Close button */}
            <div className="sticky top-0 z-20 px-5 sm:px-8 py-3.5 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shadow-xs">
              {/* Left: Back Button */}
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors border border-gray-200 cursor-pointer text-xs font-semibold"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
                <span className="hidden xs:inline">Back</span>
              </button>

              {/* Center: Title / Logo */}
              <div className="flex items-center gap-2">
                <img
                  src="/logo.png"
                  alt="Aanya Fashions"
                  className="h-7 w-auto object-contain mix-blend-multiply"
                />
                <span className="font-serif font-bold text-gray-900 text-sm hidden sm:inline">
                  Aanya Fashions
                </span>
              </div>

              {/* Right: Balance Spacer */}
              <div className="w-12 sm:w-16" aria-hidden="true" />
            </div>

            {/* Modal Body */}
            <div className="flex-1 px-6 sm:px-10 py-6 sm:py-8 overflow-y-auto">
              <div className="w-full max-w-md mx-auto space-y-6">
                {/* Heading & Subtitle */}
                <div className="text-center space-y-1">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">{title}</h3>
                  <p className="text-xs text-gray-500 font-medium">{subtitle}</p>
                </div>

                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center justify-center space-y-2 pb-1">
                  <div className="relative group w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#698156] shadow-xl bg-gray-100 flex items-center justify-center cursor-pointer">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt={profileDetails.name || 'User Profile'}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <User className="w-14 h-14 sm:w-16 sm:h-16 text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity duration-300">
                      <Camera className="w-4 h-4 mb-1" />
                      <span>{profileImage ? 'CHANGE' : 'UPLOAD'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageUpload}
                      />
                    </label>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400">Click photo to upload</span>
                </div>

                {/* Form Details */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={profileDetails.name}
                      onChange={(e) => setProfileDetails({ ...profileDetails, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#698156]/25 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Gender
                    </label>
                    <select
                      value={profileDetails.gender}
                      onChange={(e) => setProfileDetails({ ...profileDetails, gender: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#698156]/25 outline-none transition-all cursor-pointer text-gray-900"
                    >
                      <option value="" disabled>
                        Select Gender
                      </option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number (10 digits)"
                      value={profileDetails.phone}
                      onChange={(e) => setProfileDetails({ ...profileDetails, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#698156]/25 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Email ID */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Email ID
                    </label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      value={profileDetails.email}
                      onChange={(e) => setProfileDetails({ ...profileDetails, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#698156]/25 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Shipping Address */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
                      Shipping Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      placeholder="Enter complete shipping address (House/Flat No, Landmark, City, PIN)"
                      value={profileDetails.address}
                      rows={3}
                      onChange={(e) => setProfileDetails({ ...profileDetails, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-100 focus:bg-white focus:ring-2 focus:ring-[#698156]/25 outline-none transition-all resize-none text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <motion.button
                      type="button"
                      onClick={handleSave}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-[#F4F6F2] border border-[#DCE4D7] text-[#698156] font-black rounded-xl text-xs uppercase tracking-wider shadow-sm hover:bg-[#EBF0E6] hover:border-[#698156]/30 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <span>{actionButtonText}</span>
                      <ArrowRight className="w-4 h-4 text-[#698156]" />
                    </motion.button>
                  </div>

                  {user && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          onClose();
                          await signOut();
                        }}
                        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100/90 border border-rose-200 text-rose-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out of Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
