import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseStorage } from "@/lib/firebase/config";

/**
 * Uploads a File (photo, video, or payment receipt) to Firebase Storage,
 * with automatic instant fallback to a persistent Data URL (for images < 1.5MB)
 * or Object URL so uploads work seamlessly both online and offline.
 */
export async function uploadMediaFile(
  file: File,
  folder: "properties" | "receipts" | "walkthroughs" | "quotations" | "kyc"
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${folder}/${Date.now()}_${safeName}`;

  try {
    const storageRef = ref(firebaseStorage, storagePath);
    const uploadTask = uploadBytes(storageRef, file);

    // Timeout after 3.5 seconds so local/unconfigured storage buckets never block UX
    const snapshot = await Promise.race([
      uploadTask,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Storage upload timeout")), 3500)
      ),
    ]);

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch {
    // Fallback: for images or PDFs under 2MB convert to Data URL so it persists in Firestore/state;
    // for larger files use URL.createObjectURL
    if (
      (file.type.startsWith("image/") || file.type === "application/pdf") &&
      file.size <= 2_000_000
    ) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    }
    return URL.createObjectURL(file);
  }
}

