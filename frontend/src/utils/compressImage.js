/**
 * compressImage.js
 *
 * Client-side image compression using the Canvas API.
 * Resizes and re-encodes to JPEG before uploading to Supabase Storage.
 *
 * Target: ≤ 800 KB output, max 1280 px on the longest side.
 * GIFs are returned as-is (canvas strips animation).
 */

const MAX_LONG_SIDE = 1280;   // px — longest dimension after resize
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55]; // try each until size fits
const TARGET_BYTES  = 800 * 1024;                // 800 KB

/**
 * Compress a browser File to a smaller JPEG File.
 * Returns the original file unchanged if it is already small enough,
 * is a GIF, or the browser does not support OffscreenCanvas / canvas.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function compressImage(file) {
  // Skip GIFs (canvas kills animation) and already-small files
  if (file.type === "image/gif") return file;
  if (file.size <= TARGET_BYTES)  return file;

  try {
    const bitmap = await createImageBitmap(file);

    // Calculate new dimensions, keeping aspect ratio
    let { width, height } = bitmap;
    if (Math.max(width, height) > MAX_LONG_SIDE) {
      if (width >= height) {
        height = Math.round((height / width) * MAX_LONG_SIDE);
        width  = MAX_LONG_SIDE;
      } else {
        width  = Math.round((width / height) * MAX_LONG_SIDE);
        height = MAX_LONG_SIDE;
      }
    }

    const canvas  = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Try progressively lower quality until we're under the target
    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (blob.size <= TARGET_BYTES || quality === QUALITY_STEPS.at(-1)) {
        const ext      = "jpg";
        const baseName = file.name.replace(/\.[^.]+$/, "");
        return new File([blob], `${baseName}.${ext}`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      }
    }
  } catch {
    // Canvas not supported or bitmap decode failed — use original
  }

  return file;
}

/**
 * Compress an array of Files, preserving order.
 * @param {File[]} files
 * @returns {Promise<File[]>}
 */
export async function compressImages(files) {
  return Promise.all(files.map((f) => compressImage(f)));
}

// ── Helper ────────────────────────────────────────────────────────────────────
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}
