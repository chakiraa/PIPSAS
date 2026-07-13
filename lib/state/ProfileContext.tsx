"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PROFILE_KEY } from "@/lib/storage/keys";

interface ProfileContextValue {
  fullName: string;
  setFullName: (name: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [fullName, setFullNameState] = useState("");

  useEffect(() => {
    try {
      setFullNameState(localStorage.getItem(PROFILE_KEY) || "");
    } catch {
      // ignore
    }
  }, []);

  const setFullName = (name: string) => {
    setFullNameState(name);
    try {
      localStorage.setItem(PROFILE_KEY, name);
    } catch {
      // ignore
    }
  };

  return <ProfileContext.Provider value={{ fullName, setFullName }}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
