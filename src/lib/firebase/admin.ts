import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "propflow-crm-estate-2026";

function getAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0 && existingApps[0]) {
    return existingApps[0];
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountJson) {
    try {
      const parsedKey = JSON.parse(serviceAccountJson);
      return initializeApp({
        credential: cert(parsedKey),
        projectId: PROJECT_ID,
      });
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
    }
  }

  // Fallback to Google Application Default Credentials or standard projectId initialization
  return initializeApp({
    projectId: PROJECT_ID,
  });
}

const adminApp = getAdminApp();

export const adminFirestore: Firestore = getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);

