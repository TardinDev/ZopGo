import { supabase } from './supabase';
import { decode as atob } from 'base-64';
import { logError } from '../utils/errorHandler';

/**
 * Upload avatar image to Supabase Storage
 * @param userId - User ID (Clerk ID or Supabase ID)
 * @param imageUri - Local image URI from ImagePicker
 * @returns Public URL of the uploaded image or null on error
 */
export async function uploadAvatar(userId: string, imageUri: string): Promise<string | null> {
  try {
    // Fetch the image file
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Generate unique filename
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: `image/${fileExt}`,
        upsert: true, // Replace if exists
      });

    if (error) {
      logError(error, 'uploadAvatar: Storage upload failed');
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    logError(err, 'uploadAvatar');
    return null;
  }
}

/**
 * Delete avatar from Supabase Storage
 * @param avatarUrl - Full URL of the avatar to delete
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const url = new URL(avatarUrl);
    const pathMatch = url.pathname.match(/\/avatars\/(.+)$/);

    if (!pathMatch) {
      return false;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      logError(error, 'deleteAvatar');
      return false;
    }

    return true;
  } catch (err) {
    logError(err, 'deleteAvatar');
    return false;
  }
}

/**
 * Generate avatar URL from initials and color
 * Fallback when no photo is uploaded
 */
export function generateAvatarPlaceholder(name: string, userId: string): string {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color from userId
  const colors = [
    '4F46E5', // Indigo
    '7C3AED', // Purple
    'DB2777', // Pink
    'DC2626', // Red
    'EA580C', // Orange
    'CA8A04', // Yellow
    '16A34A', // Green
    '0891B2', // Cyan
    '2563EB', // Blue
  ];

  const colorIndex = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  // Use UI Avatars API
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=200&bold=true`;
}
