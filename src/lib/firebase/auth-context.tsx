"use client";

import * as React from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  firebaseAuth,
  firestoreDb,
  googleAuthProvider,
} from "@/lib/firebase/config";
import { useCrmStore } from "@/lib/store/crm-store";

export interface AgentProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "AGENT" | "TEAM_LEADER" | "BROKER" | "ADMIN";
  prcLicenseNumber: string;
  dhsudRegistrationNo?: string;
  phone: string;
  agencyName: string;
  createdAt?: string;
}

export interface RegisterAgentPayload {
  email: string;
  password: string;
  fullName: string;
  role: "AGENT" | "TEAM_LEADER" | "BROKER";
  prcLicenseNumber: string;
  phone: string;
  agencyName: string;
}

interface AuthContextValue {
  user: User | null;
  agentProfile: AgentProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  registerAgent: (payload: RegisterAgentPayload) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);

const DEFAULT_FALLBACK_AGENT: AgentProfile = {
  uid: "demo-agent-marco",
  email: "marco.reyes@propflow.ph",
  fullName: "Marco Reyes, REB",
  role: "BROKER",
  prcLicenseNumber: "PRC #0031842",
  phone: "+63 917 880 1122",
  agencyName: "PropFlow Realty Group",
};

function setSessionCookie(hasSession: boolean) {
  if (typeof document !== "undefined") {
    if (hasSession) {
      document.cookie =
        "propflow_auth_session=1; path=/; max-age=2592000; SameSite=Lax";
    } else {
      document.cookie =
        "propflow_auth_session=; path=/; max-age=0; SameSite=Lax";
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [agentProfile, setAgentProfile] = React.useState<AgentProfile | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);

  const fetchOrCreateAgentProfile = React.useCallback(
    async (firebaseUser: User): Promise<AgentProfile> => {
      try {
        const ref = doc(firestoreDb, "agents", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Omit<AgentProfile, "uid">;
          return {
            uid: firebaseUser.uid,
            ...data,
          };
        }

        const defaultProfile: AgentProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          fullName: firebaseUser.displayName || "Licensed Real Estate Agent",
          role: "AGENT",
          prcLicenseNumber: "PRC Pending Verification",
          phone: firebaseUser.phoneNumber || "+63 917 000 0000",
          agencyName: "PropFlow Realty Group",
        };

        await setDoc(ref, {
          ...defaultProfile,
          createdAt: serverTimestamp(),
        });

        return defaultProfile;
      } catch {
        // Fallback if Firestore rules are still deploying
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          fullName: firebaseUser.displayName || "Real Estate Agent",
          role: "AGENT",
          prcLicenseNumber: "PRC #0031842",
          phone: "+63 917 000 0000",
          agencyName: "PropFlow Realty Group",
        };
      }
    },
    []
  );

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        setUser(currentUser);
        setSessionCookie(Boolean(currentUser));
        if (currentUser) {
          const profile = await fetchOrCreateAgentProfile(currentUser);
          setAgentProfile(profile);
          await useCrmStore.getState().syncWithAgentAccount(currentUser.uid);
        } else {
          setAgentProfile(null);
          await useCrmStore.getState().syncWithAgentAccount(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [fetchOrCreateAgentProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    setSessionCookie(true);
    const profile = await fetchOrCreateAgentProfile(credential.user);
    setAgentProfile(profile);
  };

  const registerAgent = async (payload: RegisterAgentPayload) => {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      payload.email,
      payload.password
    );
    setSessionCookie(true);

    await updateProfile(credential.user, {
      displayName: payload.fullName,
    });

    const newProfile: AgentProfile = {
      uid: credential.user.uid,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      prcLicenseNumber: payload.prcLicenseNumber || "PRC Under Review",
      phone: payload.phone,
      agencyName: payload.agencyName || "PropFlow Realty Group",
    };

    try {
      await setDoc(doc(firestoreDb, "agents", credential.user.uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking if Firestore is still provisioning
    }

    setAgentProfile(newProfile);
  };

  const signInWithGoogle = async () => {
    const credential = await signInWithPopup(firebaseAuth, googleAuthProvider);
    setSessionCookie(true);
    const profile = await fetchOrCreateAgentProfile(credential.user);
    setAgentProfile(profile);
  };

  const signOut = async () => {
    setSessionCookie(false);
    await firebaseSignOut(firebaseAuth);
    setUser(null);
    setAgentProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        agentProfile: agentProfile ?? (user ? DEFAULT_FALLBACK_AGENT : null),
        loading,
        signInWithEmail,
        registerAgent,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

