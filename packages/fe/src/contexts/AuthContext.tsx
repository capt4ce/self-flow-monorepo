"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import * as Clerk from "@clerk/nextjs";
import { setAuthTokenGetter } from "@/lib/api-client";

interface AuthContextType {
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoaded: userLoaded } = Clerk.useUser();
  const { signOut: clerkSignOut, getToken: clerkGetToken } =
    Clerk.useAuth() as any;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoaded) {
      setLoading(false);
    }
  }, [userLoaded]);

  const signOut = async () => {
    await clerkSignOut();
  };

  const getToken = async () => {
    try {
      const token = await clerkGetToken();
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  // Set token getter globally for API client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthTokenGetter(getToken);
    }
  }, [getToken]);

  const value = {
    user: user
      ? { id: user.id, email: user.primaryEmailAddress?.emailAddress }
      : null,
    loading,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
