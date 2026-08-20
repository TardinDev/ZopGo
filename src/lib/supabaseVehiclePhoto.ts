import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { logError } from '../utils/errorHandler';

/**
 * Photo du vehicule du chauffeur (bucket public `vehicle-photos`, migration 044).
 * Le client la voit sur le detail du trajet pour reconnaitre la voiture au
 * point de rendez-vous.
 */
const BUCKET = 'vehicle-photos';

/**
 * Depose la photo du vehicule dans Supabase Storage.
 *
 * IMPORTANT — le chemin porte la securite : les policies RLS du bucket
 * autorisent INSERT/UPDATE/DELETE seulement si
 *   (storage.foldername(name))[1] = auth.jwt() ->> 'sub'
 * Le premier segment DOIT donc rester le clerkId, sinon la production
 * rejette tous les depots. Format impose : `{clerkId}/{timestamp}.{ext}`.
 *
 * @param clerkId - ID Clerk du chauffeur (= `sub` du JWT, cadrage RLS)
 * @param imageUri - URI locale de l'image (ImagePicker)
 * @returns URL publique de la photo, ou null en cas d'erreur
 */
export async function uploadVehiclePhoto(
  clerkId: string,
  imageUri: string
): Promise<string | null> {
  try {
    // Lecture en base64 (fiable en React Native, contrairement a fetch+blob)
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Nom de fichier unique, cadre par le clerkId (voir note RLS ci-dessus)
    const fileExt = imageUri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${clerkId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      logError(error, 'uploadVehiclePhoto: Storage upload failed');
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    logError(err, 'uploadVehiclePhoto');
    return null;
  }
}

/**
 * Supprime une photo de vehicule de Supabase Storage.
 *
 * @param url - URL publique complete de la photo
 * @returns true si supprimee, false si l'URL est etrangere au bucket ou en cas d'erreur
 */
export async function deleteVehiclePhoto(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url);
    const pathMatch = parsed.pathname.match(/\/vehicle-photos\/(.+)$/);

    if (!pathMatch) {
      return false;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

    if (error) {
      logError(error, 'deleteVehiclePhoto');
      return false;
    }

    return true;
  } catch (err) {
    logError(err, 'deleteVehiclePhoto');
    return false;
  }
}
