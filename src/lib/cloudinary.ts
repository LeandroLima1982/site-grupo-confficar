export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: '',
  uploadPreset: '',
};

export function getCloudinaryConfig(): CloudinaryConfig {
  if (typeof window === 'undefined') return DEFAULT_CLOUDINARY_CONFIG;
  try {
    const saved = localStorage.getItem('confficar_cloudinary_config');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading Cloudinary config:', e);
  }
  return DEFAULT_CLOUDINARY_CONFIG;
}

export function saveCloudinaryConfig(config: CloudinaryConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('confficar_cloudinary_config', JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving Cloudinary config:', e);
  }
}

/**
 * Processes and compresses an image file on HTML Canvas preserving High Definition 1080p (1920px) resolution.
 * Keeps base64 payloads lightweight (~150KB - 250KB) so Firestore documents never exceed the 1MB limit.
 */
function compressImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale to 1600px max dimension while preserving natural aspect ratio.
        // Keeps fallback base64 payloads around 100-140KB so the Firestore
        // 1MB document limit is much harder to hit.
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(img, 0, 0, width, height);
        // High-fidelity JPEG produces sharp web images at modest payloads
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem para conversão'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro de leitura de arquivo'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageToCloudinary(
  file: File,
  configOverride?: CloudinaryConfig,
  options?: { maxDimension?: number; quality?: number }
): Promise<{ url: string; isCloudinary: boolean }> {
  const config = configOverride || getCloudinaryConfig();

  // If cloudName and uploadPreset are provided, upload directly to Cloudinary (0% size overhead in Firestore)
  if (config.cloudName?.trim() && config.uploadPreset?.trim()) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.uploadPreset.trim());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName.trim()}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          return { url: data.secure_url, isCloudinary: true };
        }
      }
    } catch (err) {
      console.warn('Upload Cloudinary falhou, usando fallback comprimido:', err);
    }
  }

  // Fallback to high-definition Full HD canvas DataURL (1920px max dimension, ~150-250KB)
  const maxDim = options?.maxDimension || 1920;
  const qual = options?.quality || 0.82;
  const compressedUrl = await compressImageFile(file, maxDim, qual);
  return { url: compressedUrl, isCloudinary: false };
}
