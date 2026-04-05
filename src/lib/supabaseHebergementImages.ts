import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { logError } from '../utils/errorHandler';

/**
 * Upload a hebergement image to Supabase Storage
 * @param hebergementId - Hebergement ID
 * @param imageUri - Local image URI from ImagePicker
 * @returns Public URL of the uploaded image or null on error
 */
export async function uploadHebergementImage(
  hebergementId: string,
  imageUri: string
): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${hebergementId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('hebergements')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: false,
      });

    if (error) {
      logError(error, 'uploadHebergementImage: Storage upload failed');
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('hebergements').getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    logError(err, 'uploadHebergementImage');
    return null;
  }
}

/**
 * Delete a hebergement image from Supabase Storage
 * @param imageUrl - Full URL of the image to delete
 */
export async function deleteHebergementImage(imageUrl: string): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/hebergements\/(.+)$/);

    if (!pathMatch) {
      return false;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from('hebergements')
      .remove([filePath]);

    if (error) {
      logError(error, 'deleteHebergementImage');
      return false;
    }

    return true;
  } catch (err) {
    logError(err, 'deleteHebergementImage');
    return false;
  }
}

/**
 * Update the images column for a hebergement
 * @param hebergementId - Hebergement ID
 * @param images - Array of image URLs
 */
export async function updateHebergementImages(
  hebergementId: string,
  images: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('hebergements')
      .update({ images })
      .eq('id', hebergementId);

    if (error) {
      logError(error, 'updateHebergementImages');
      return false;
    }

    return true;
  } catch (err) {
    logError(err, 'updateHebergementImages');
    return false;
  }
}
