// src/lib/compress-image.js
//
// Downscale + re-encode an image on the client BEFORE upload. A phone photo is
// 3-8 MB at full resolution; a profile picture or event cover is only ever
// shown small, so shipping the original wastes the whole client -> server ->
// Cloudinary transfer. Capping the longest edge and re-encoding as JPEG turns
// a multi-MB file into a couple hundred KB, which is the bulk of the perceived
// "image update is slow". Canvas-based, no dependency.
//
// HEIC note: browsers can't decode HEIC, so a HEIC file must be converted to a
// JPEG/PNG blob (via heic2any) BEFORE being passed here.

const DEFAULTS = { maxDimension: 1600, quality: 0.82, mimeType: "image/jpeg" };

/**
 * @param {File|Blob} input - a browser-decodable image (jpeg/png/webp).
 * @param {{maxDimension?:number, quality?:number, mimeType?:string, fileName?:string}} opts
 * @returns {Promise<File>} the compressed image (falls back to the input on any failure).
 */
export async function compressImage(input, opts = {}) {
  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...opts };
  const fileName = opts.fileName || (input.name ?? "image").replace(/\.[^.]+$/, "") + ".jpg";

  try {
    const bitmap = await createImageBitmap(input);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob) return input;

    // If re-encoding somehow produced a bigger file (tiny/already-optimized
    // images), keep the original.
    if (input.size && blob.size >= input.size) return input;

    return new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
  } catch {
    // Any decode/encode failure: upload the original rather than block the user.
    return input;
  }
}
