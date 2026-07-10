/**
 * Compresses an image file using HTML5 Canvas.
 * Automatically downscales dimensions while preserving aspect ratio and outputs a lightweight JPEG.
 * * @param file The raw input File from the input element
 * @param maxWidth Target maximum bounding width (default: 1920px)
 * @param maxHeight Target maximum bounding height (default: 1080px)
 * @param quality Compression quality metric between 0.0 and 1.0 (default: 0.8)
 */
export function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate optimal downscaling proportions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Initialize off-screen hardware-accelerated canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas Context Context2D instantiation failed.'));
        }

        // Draw image asset onto calculated bounds
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas data into highly compressed JPEG binary stream
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas serialization to Blob failed.'));
            }

            // Remap original metadata onto the new optimized binary package
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}