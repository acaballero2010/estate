/**
 * Curated high-resolution architectural fallback imagery
 * for accredited real estate categories.
 */
export const PROPERTY_CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  CONDOMINIUM:
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80", // Modern glass high-rise
  HOUSE_AND_LOT:
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", // Luxury modern villa
  TOWNHOUSE:
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80", // Premium urban townhouse
  RESIDENTIAL_LOT:
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80", // Masterplanned estate grounds
  COMMERCIAL_UNIT:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", // Contemporary commercial high-rise
};

export const DEFAULT_PROPERTY_FALLBACK_IMAGE: string =
  PROPERTY_CATEGORY_FALLBACK_IMAGES.CONDOMINIUM!;

/**
 * Normalizes cloud storage share URLs (Google Drive, Dropbox, OneDrive)
 * into direct browser-renderable image stream URLs.
 */
export function normalizeCloudImageUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  let url = rawUrl.trim();

  // 1. Google Drive:
  // e.g. https://drive.google.com/file/d/1XyZ123abc456/view?usp=sharing
  // or https://drive.google.com/open?id=1XyZ123abc456
  // or https://drive.google.com/uc?id=1XyZ123abc456
  const gDriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gDriveFileMatch && gDriveFileMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveFileMatch[1]}`;
  }

  const gDriveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (gDriveOpenMatch && gDriveOpenMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveOpenMatch[1]}`;
  }

  const gDriveUcMatch = url.match(/drive\.google\.com\/uc\?(?:export=view&)?id=([a-zA-Z0-9_-]+)/);
  if (gDriveUcMatch && gDriveUcMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${gDriveUcMatch[1]}`;
  }

  // 2. Dropbox:
  // e.g. https://www.dropbox.com/s/xyz/photo.jpg?dl=0 -> replace dl=0 with raw=1
  if (url.includes("dropbox.com")) {
    if (url.includes("dl=0")) {
      return url.replace("dl=0", "raw=1");
    }
    if (!url.includes("raw=1") && !url.includes("dl=1")) {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}raw=1`;
    }
  }

  // 3. OneDrive:
  // Replace view.aspx or redir with embed if resid is present
  if (url.includes("onedrive.live.com") && url.includes("resid=")) {
    if (!url.includes("embed")) {
      return url.replace("/redir?", "/embed?").replace("/view.aspx?", "/embed?");
    }
  }

  // 4. Fix common typos
  if (url.includes("unsplash.cc")) {
    return url.replace("unsplash.cc", "unsplash.com");
  }

  return url;
}

/**
 * Normalizes and validates property image URLs.
 * If URL is missing, empty, or unparseable, safely returns the curated category fallback.
 */
export function getSafePropertyImageUrl(
  candidateUrl?: string | null,
  propertyType?: string | null
): string {
  const fallback =
    (propertyType ? PROPERTY_CATEGORY_FALLBACK_IMAGES[propertyType] : undefined) ??
    DEFAULT_PROPERTY_FALLBACK_IMAGE;

  if (!candidateUrl || typeof candidateUrl !== "string") {
    return fallback;
  }

  const trimmed = candidateUrl.trim();
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.length < 8 || !trimmed.startsWith("http")) {
    return fallback;
  }

  return normalizeCloudImageUrl(trimmed);
}

/**
 * React onError handler helper to swap broken / 404 images to the category fallback
 */
export function handleImageFallbackError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  propertyType?: string | null
) {
  const fallback =
    (propertyType ? PROPERTY_CATEGORY_FALLBACK_IMAGES[propertyType] : undefined) ??
    DEFAULT_PROPERTY_FALLBACK_IMAGE;
  if (event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback;
  }
}
