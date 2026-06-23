// Shared input/file validation helpers so rules are consistent across screens.

// Indian mobile: 10 digits starting 6-9. Accepts input with spaces/+91 prefix.
export function normalizeMobile(raw: string): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function isValidMobile(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobile(raw));
}

/** Returns an error string for an invalid non-empty mobile, or null when empty/valid. */
export function mobileError(raw: string): string | null {
  if (!raw || !raw.trim()) return null; // empty is allowed (optional field)
  return isValidMobile(raw) ? null : 'Enter a valid 10-digit mobile number';
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_UPLOAD_MIME = /^(image\/(jpeg|jpg|png|gif|webp|heic)|application\/pdf)$/i;
const ALLOWED_UPLOAD_EXT = /\.(jpe?g|png|gif|webp|heic|pdf)$/i;

export interface UploadAsset {
  uri?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  fileName?: string | null;
}

/** Returns an error string if the picked file can't be uploaded, or null when OK. */
export function uploadAssetError(asset: UploadAsset | null | undefined): string | null {
  if (!asset?.uri) return 'No file selected.';
  if (asset.fileSize != null && asset.fileSize > MAX_UPLOAD_BYTES) {
    return `File is too large (max ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB).`;
  }
  const mime = asset.mimeType ?? '';
  const name = asset.fileName ?? '';
  const typeOk = mime ? ALLOWED_UPLOAD_MIME.test(mime) : ALLOWED_UPLOAD_EXT.test(name);
  if (!typeOk) return 'Unsupported file type. Use an image or PDF.';
  return null;
}
