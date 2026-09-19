/**
 * Storage Service for managing uploads to Supabase Storage.
 * Handles bucket uploads with automatic graceful fallback for offline / missing bucket cases.
 */

/**
 * Converts a base64 data URL to a binary Blob for storage upload.
 */
export function dataURLtoBlob(dataurl) {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) {
    return null;
  }
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.warn('Failed converting dataURL to Blob:', err);
    return null;
  }
}

/**
 * Uploads a payment slip to the Supabase Storage 'slips' bucket.
 * 
 * @param {object} supabase - Supabase client
 * @param {File|Blob|string} fileOrDataUrl - File object or base64 data URL
 * @param {object} options - Upload options { folder, bookingId, txnId, fileName }
 * @returns {Promise<{ success: boolean, publicUrl: string|null, error: string|null }>}
 */
export async function uploadSlipToStorage(supabase, fileOrDataUrl, options = {}) {
  const {
    folder = 'monthly',
    bookingId = 'general',
    txnId = Date.now().toString(),
    fileName = 'slip.jpg'
  } = options;

  if (!supabase || !fileOrDataUrl) {
    return { success: false, publicUrl: null, error: 'Missing client or file' };
  }

  let fileToUpload = fileOrDataUrl;
  let fileExt = 'jpg';

  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
    fileToUpload = dataURLtoBlob(fileOrDataUrl);
    if (!fileToUpload) {
      return { success: false, publicUrl: null, error: 'Invalid base64 slip string' };
    }
    const extMatch = fileOrDataUrl.match(/^data:image\/([a-zA-Z0-9]+);/);
    if (extMatch && extMatch[1]) {
      fileExt = extMatch[1] === 'jpeg' ? 'jpg' : extMatch[1];
    }
  } else if (fileOrDataUrl instanceof File) {
    const parts = fileOrDataUrl.name.split('.');
    if (parts.length > 1) {
      fileExt = parts.pop().toLowerCase();
    }
  }

  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${bookingId}/${txnId}_${cleanFileName}.${fileExt}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('slips')
      .upload(path, fileToUpload, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileToUpload.type || `image/${fileExt}`
      });

    if (uploadError) {
      console.warn('⚠️ Supabase Storage "slips" upload failed:', uploadError.message);
      return { success: false, publicUrl: null, error: uploadError.message };
    }

    const { data: publicData } = supabase.storage
      .from('slips')
      .getPublicUrl(path);

    return {
      success: true,
      publicUrl: publicData?.publicUrl || null,
      error: null
    };
  } catch (err) {
    console.warn('⚠️ Exception uploading slip to Supabase Storage:', err);
    return { success: false, publicUrl: null, error: err.message };
  }
}
