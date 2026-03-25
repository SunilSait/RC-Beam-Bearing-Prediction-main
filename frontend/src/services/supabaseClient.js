import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ====================================================
// STORAGE: Upload & Delete Images
// ====================================================

/**
 * Upload a crack image to Supabase Storage.
 * @returns {{ url: string, path: string }}
 */
export async function uploadCrackImage(file, fileName) {
    if (!supabase) throw new Error('Supabase not configured');

    const timestamp = Date.now();
    const name = fileName || `crack_${timestamp}.jpg`;
    const filePath = `captures/${name}`;

    const { data, error } = await supabase.storage
        .from('crack-images')
        .upload(filePath, file, {
            contentType: file.type || 'image/jpeg',
            upsert: false,
        });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const { data: urlData } = supabase.storage
        .from('crack-images')
        .getPublicUrl(data.path);

    return { url: urlData.publicUrl, path: data.path };
}

/**
 * Delete a crack image from Supabase Storage.
 */
export async function deleteCrackImage(storagePath) {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.storage
        .from('crack-images')
        .remove([storagePath]);

    if (error) throw new Error(`Delete failed: ${error.message}`);
}

// ====================================================
// DATABASE: Analysis Results (crack_results table)
// ====================================================

/**
 * Save crack analysis result to the database.
 */
export async function saveCrackResult({ imageUrl, storagePath, crackType, confidence, features }) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
        .from('crack_results')
        .insert([{
            image_url: imageUrl,
            storage_path: storagePath,
            crack_type: crackType,
            confidence: confidence,
            mean_area: features?.mean_area || 0,
            mean_eccentricity: features?.mean_eccentricity || 0,
            mean_major_axis: features?.mean_major_axis || 0,
            mean_minor_axis: features?.mean_minor_axis || 0,
        }])
        .select();

    if (error) throw new Error(`Save result failed: ${error.message}`);
    return data?.[0];
}

/**
 * List all crack results from the database, sorted by newest first.
 */
export async function listCrackResults(limit = 20) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('crack_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to list crack results:', error);
        return [];
    }

    return data || [];
}

/**
 * Delete a crack result from the database and its image from storage.
 */
export async function deleteCrackResult(id, storagePath) {
    if (!supabase) throw new Error('Supabase not configured');

    // Delete DB row
    const { error: dbError } = await supabase
        .from('crack_results')
        .delete()
        .eq('id', id);

    if (dbError) throw new Error(`Delete result failed: ${dbError.message}`);

    // Delete from storage (ignore errors if file already gone)
    if (storagePath) {
        await supabase.storage.from('crack-images').remove([storagePath]).catch(() => {});
    }
}
