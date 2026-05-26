import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { logError } from '../utils/errorHandler';

// Mirrors the supabaseAvatar helper but targets the public 'agency-logos'
// bucket created in migration 027. Storage policies require the uploader's
// profile to have role='agence' (enforced via storage.foldername(name)[1]
// matching the profile id) — so the path MUST start with the profile id.

/**
 * Upload an agency logo to Supabase Storage. Returns the public URL on
 * success, or null on any failure (storage error, malformed file, etc.).
 *
 * @param profileId - The Supabase profile id of the agency (NOT the Clerk id)
 * @param imageUri  - Local image URI from expo-image-picker
 */
export async function uploadAgencyLogo(
  profileId: string,
  imageUri: string
): Promise<string | null> {
  try {
    // Read as base64 because fetch+blob is broken in React Native's
    // network stack and silently uploads zero-byte files.
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'png';
    // Path shape MUST be `<profileId>/...` — RLS on the agency-logos bucket
    // matches storage.foldername(name)[1] against the caller's profile.
    const fileName = `${profileId}/logo-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('agency-logos')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      logError(error, 'uploadAgencyLogo: Storage upload failed');
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('agency-logos').getPublicUrl(data.path);
    return publicUrl;
  } catch (err) {
    logError(err, 'uploadAgencyLogo');
    return null;
  }
}

/**
 * Delete an agency logo from Storage. Best-effort — failure is logged but
 * does not throw, so callers can chain it before re-uploading without
 * worrying about an in-between transient error.
 */
export async function deleteAgencyLogo(logoUrl: string): Promise<boolean> {
  try {
    const url = new URL(logoUrl);
    const match = url.pathname.match(/\/agency-logos\/(.+)$/);
    if (!match) return false;
    const filePath = match[1];

    const { error } = await supabase.storage.from('agency-logos').remove([filePath]);
    if (error) {
      logError(error, 'deleteAgencyLogo');
      return false;
    }
    return true;
  } catch (err) {
    logError(err, 'deleteAgencyLogo');
    return false;
  }
}

/**
 * Persist the new logo URL on the profile row. Splits this out of the
 * upload step so the auth/profile flow can decide when (or whether) to
 * commit a change (e.g. you might upload to preview before saving).
 */
export async function setAgencyLogoUrl(
  clerkId: string,
  logoUrl: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ agency_logo_url: logoUrl })
    .eq('clerk_id', clerkId);
  if (error) {
    logError(error, 'setAgencyLogoUrl');
    return false;
  }
  return true;
}
