"use client";

import * as React from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
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
  avatarUrl?: string;
  isPlatformAdmin?: boolean;
  subscriptionTier?: "STARTER" | "PRO" | "ENTERPRISE";
  subscriptionStatus?: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED";
  subscriptionRenewsAt?: string;
  prcLicenseNumber: string;
  prcExpiryDate?: string;
  dhsudRegistrationNo?: string;
  dhsudExpiryDate?: string;
  licensingBodyLogoUrl?: string;
  boardAffiliation?: string;
  awards?: string[];
  bioHeadline?: string;
  phone: string;
  agencyName: string;
  facebookUrl?: string;
  messengerUrl?: string;
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
  updateProfile: (updates: Partial<AgentProfile>) => Promise<void>;
  updateSubscription: (
    tier: "STARTER" | "PRO" | "ENTERPRISE",
    cycle?: "MONTHLY" | "ANNUAL"
  ) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);

const DEFAULT_FALLBACK_AGENT: AgentProfile = {
  uid: "demo-agent-marco",
  email: "marco.reyes@propflow.ph",
  fullName: "Marco Reyes, REB",
  role: "ADMIN",
  avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
  isPlatformAdmin: true,
  subscriptionTier: "PRO",
  subscriptionStatus: "ACTIVE",
  subscriptionRenewsAt: "2027-01-01",
  prcLicenseNumber: "PRC #0031842",
  prcExpiryDate: "2027-11-30",
  dhsudRegistrationNo: "DHSUD-NCR-B-08/24-1190",
  dhsudExpiryDate: "2026-12-31",
  boardAffiliation: "PAREB - Pasig Realtors Board (PRB)",
  licensingBodyLogoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Professional_Regulation_Commission_%28PRC%29.svg/240px-Professional_Regulation_Commission_%28PRC%29.svg.png",
  bioHeadline: "Licensed Real Estate Broker & Certified Investment Advisor specializing in high-yield Metro Manila masterplanned estates.",
  awards: [
    "🏆 Ayala Premier Top Producer 2025",
    "⭐ ₱500M+ Closed Sales Volume Club",
    "🎖️ PAREB Leadership Excellence Award",
    "🛡️ 100% Verified PRC & DHSUD Credentialed",
  ],
  phone: "+63 917 880 1122",
  agencyName: "PropFlow Realty Group",
};

function setSessionCookie(hasSession: boolean, isAdmin?: boolean) {
  if (typeof document !== "undefined") {
    if (hasSession) {
      document.cookie =
        "propflow_auth_session=1; path=/; max-age=2592000; SameSite=Lax";
      if (isAdmin) {
        document.cookie =
          "propflow_is_admin=1; path=/; max-age=2592000; SameSite=Lax";
      } else {
        document.cookie =
          "propflow_is_admin=; path=/; max-age=0; SameSite=Lax";
      }
    } else {
      document.cookie =
        "propflow_auth_session=; path=/; max-age=0; SameSite=Lax";
      document.cookie =
        "propflow_is_admin=; path=/; max-age=0; SameSite=Lax";
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
          prcLicenseNumber: "PRC Pending Verification",
          phone: "+63 917 000 0000",
          agencyName: "PropFlow Realty Group",
        };
      }
    },
    []
  );

  React.useEffect(() => {
    try {
      const cached = localStorage.getItem("propflow_agent_profile");
      if (cached) {
        const parsed = JSON.parse(cached) as AgentProfile;
        setAgentProfile(parsed);
        const isAdmin = Boolean(parsed.role === "ADMIN" || parsed.isPlatformAdmin);
        setSessionCookie(true, isAdmin);
      }
    } catch {
      // Non-blocking
    }

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          const profile = await fetchOrCreateAgentProfile(currentUser);
          setAgentProfile(profile);
          const isAdmin = Boolean(profile.role === "ADMIN" || profile.isPlatformAdmin);
          setSessionCookie(true, isAdmin);
          try {
            localStorage.setItem(
              "propflow_agent_profile",
              JSON.stringify(profile)
            );
          } catch {
            // Non-blocking localStorage error
          }
          await useCrmStore.getState().syncWithAgentAccount(currentUser.uid);
        } else {
          setAgentProfile(null);
          setSessionCookie(false, false);
          try {
            localStorage.removeItem("propflow_agent_profile");
          } catch {
            // Non-blocking localStorage error
          }
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
    const profile = await fetchOrCreateAgentProfile(credential.user);
    const isAdmin = Boolean(profile.role === "ADMIN" || profile.isPlatformAdmin);
    setSessionCookie(true, isAdmin);
    setAgentProfile(profile);
    try {
      localStorage.setItem("propflow_agent_profile", JSON.stringify(profile));
    } catch {
      // Non-blocking
    }
  };

  const registerAgent = async (payload: RegisterAgentPayload) => {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      payload.email,
      payload.password
    );

    await updateFirebaseProfile(credential.user, {
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

    const isAdmin = Boolean(newProfile.role === "ADMIN" || newProfile.isPlatformAdmin);
    setSessionCookie(true, isAdmin);

    try {
      await setDoc(doc(firestoreDb, "agents", credential.user.uid), {
        ...newProfile,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Non-blocking if Firestore is still provisioning
    }

    setAgentProfile(newProfile);
    try {
      localStorage.setItem(
        "propflow_agent_profile",
        JSON.stringify(newProfile)
      );
    } catch {
      // Non-blocking
    }
  };

  const signInWithGoogle = async () => {
    const credential = await signInWithPopup(firebaseAuth, googleAuthProvider);
    const profile = await fetchOrCreateAgentProfile(credential.user);
    const isAdmin = Boolean(profile.role === "ADMIN" || profile.isPlatformAdmin);
    setSessionCookie(true, isAdmin);
    setAgentProfile(profile);
    try {
      localStorage.setItem("propflow_agent_profile", JSON.stringify(profile));
    } catch {
      // Non-blocking
    }
  };

  const signOut = async () => {
    setSessionCookie(false, false);
    await firebaseSignOut(firebaseAuth);
    setUser(null);
    setAgentProfile(null);
    try {
      localStorage.removeItem("propflow_agent_profile");
    } catch {
      // Non-blocking
    }
  };

  const updateProfile = async (updates: Partial<AgentProfile>) => {
    const current = agentProfile || DEFAULT_FALLBACK_AGENT;
    const updated: AgentProfile = {
      ...current,
      ...updates,
    };
    setAgentProfile(updated);
    const isAdm = Boolean(updated.role === "ADMIN" || updated.isPlatformAdmin);
    setSessionCookie(true, isAdm);
    try {
      localStorage.setItem("propflow_agent_profile", JSON.stringify(updated));
    } catch {
      // Non-blocking
    }

    const targetUid = user?.uid || current.uid;
    if (targetUid) {
      try {
        await setDoc(doc(firestoreDb, "agents", targetUid), updated, {
          merge: true,
        });
      } catch (err) {
        console.warn("Could not persist agent profile update to Firestore:", err);
      }
    }
  };

  const updateSubscription = async (
    tier: "STARTER" | "PRO" | "ENTERPRISE",
    cycle: "MONTHLY" | "ANNUAL" = "MONTHLY"
  ) => {
    const renewsDate = new Date();
    if (cycle === "ANNUAL") {
      renewsDate.setFullYear(renewsDate.getFullYear() + 1);
    } else {
      renewsDate.setMonth(renewsDate.getMonth() + 1);
    }

    await updateProfile({
      subscriptionTier: tier,
      subscriptionStatus: "ACTIVE",
      subscriptionRenewsAt: renewsDate.toISOString().slice(0, 10),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        agentProfile,
        loading,
        signInWithEmail,
        registerAgent,
        signInWithGoogle,
        signOut,
        updateProfile,
        updateSubscription,
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

