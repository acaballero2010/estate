import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const appHostingWebConfig = (() => {
  if (typeof process !== "undefined" && process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG) as Partial<
        Record<string, string>
      >;
    } catch {
      return {};
    }
  }
  return {};
})();

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    appHostingWebConfig.apiKey ||
    "AIzaSyDsJdY0UiNIgJ-N-kjfmtsj7Pqt-igPPuA",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    appHostingWebConfig.authDomain ||
    "propflow-crm-estate-2026.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    appHostingWebConfig.projectId ||
    "propflow-crm-estate-2026",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    appHostingWebConfig.storageBucket ||
    "propflow-crm-estate-2026.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    appHostingWebConfig.messagingSenderId ||
    "495877269210",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    appHostingWebConfig.appId ||
    "1:495877269210:web:71e8c54f7ef6dcf03727e3",
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firestoreDb: Firestore = getFirestore(firebaseApp);
export const firebaseStorage: FirebaseStorage = getStorage(firebaseApp);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: "select_account",
});

