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
 * Normalizes and validates property image URLs.
 * If URL is missing, empty, or has common typos (like images.unsplash.cc),
 * safely returns the curated category fallback.
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
  if (trimmed.length < 8 || !trimmed.startsWith("http")) {
    return fallback;
  }

  // Fix common typo `.unsplash.cc` -> `.unsplash.com`
  if (trimmed.includes("unsplash.cc")) {
    return trimmed.replace("unsplash.cc", "unsplash.com");
  }

  return trimmed;
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
