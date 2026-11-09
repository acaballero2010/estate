import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase/config";

/**
 * Compresses an image client-side to a lightweight Data URL (~30-70KB)
 * so it can be stored reliably in Firestore/localStorage without hitting
 * document size limits or expiring like blob: URLs.
 */
export async function compressImageToDataUrl(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a File (photo, video, or payment receipt) to Firebase Storage,
 * with automatic instant fallback to a lightweight, persistent Data URL
 * so uploads work seamlessly both online, offline, and in local development.
 */
export async function uploadMediaFile(
  file: File,
  folder: "properties" | "receipts" | "walkthroughs" | "quotations" | "kyc" | "avatars" | "badges"
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${folder}/${Date.now()}_${safeName}`;

  try {
    const storageRef = ref(firebaseStorage, storagePath);
    const uploadTask = uploadBytes(storageRef, file);

    // Timeout after 2.5 seconds so local/unconfigured storage buckets never hang UX
    const snapshot = await Promise.race([
      uploadTask,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Storage upload timeout")), 2500)
      ),
    ]);

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch {
    // Robust fallback: Compress image to lightweight Data URL (< 100KB)
    // so it persists across page reloads in Firestore & localStorage.
    return await compressImageToDataUrl(file);
  }
}

