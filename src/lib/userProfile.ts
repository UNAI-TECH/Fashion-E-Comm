import { supabase } from './supabase';

export interface UserProfileDetails {
  name: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  pincode?: string;
  state?: string;
}

export const USER_PROFILE_STORAGE_KEY = 'user_profile_details';
export const USER_PROFILE_IMAGE_KEY = 'user_profile_image';

export function getUserProfileDetails(): UserProfileDetails {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || parsed.fullName || '',
        gender: parsed.gender || '',
        phone: parsed.phone || '',
        email: parsed.email || '',
        address: parsed.address || '',
        city: parsed.city || '',
        pincode: parsed.pincode || '',
        state: parsed.state || ''
      };
    }
  } catch (e) {
    console.warn('Error reading user profile from localStorage:', e);
  }

  return {
    name: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    state: ''
  };
}

export function getUserProfileImage(): string {
  try {
    return localStorage.getItem(USER_PROFILE_IMAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveUserProfileDetails(details: UserProfileDetails, profileImage?: string): void {
  try {
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(details));
    if (profileImage !== undefined) {
      if (profileImage) {
        localStorage.setItem(USER_PROFILE_IMAGE_KEY, profileImage);
      } else {
        localStorage.removeItem(USER_PROFILE_IMAGE_KEY);
      }
    }
    // Dispatch custom event so other components immediately react
    window.dispatchEvent(
      new CustomEvent('user_profile_updated', {
        detail: { details, profileImage: profileImage ?? getUserProfileImage() }
      })
    );

    // Asynchronously update Supabase profiles table
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').update({
          full_name: details.name,
          phone: details.phone,
          avatar_url: profileImage || null,
          updated_at: new Date()
        }).eq('id', user.id).then(() => {});
      }
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

export function isUserProfileComplete(details?: Partial<UserProfileDetails>): boolean {
  try {
    const data = details || getUserProfileDetails();
    const hasName = Boolean(data.name && data.name.trim().length > 0);
    const cleanPhone = (data.phone || '').replace(/\D/g, '');
    const hasPhone = Boolean(cleanPhone.length >= 10);
    const hasAddress = Boolean(data.address && data.address.trim().length > 0);
    return Boolean(hasName && hasPhone && hasAddress);
  } catch {
    return false;
  }
}
