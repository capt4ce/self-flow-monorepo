"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter } from "@/lib/api-client";

// Import Stack Auth hooks - ensure @stackframe/react is properly installed
import { useUser } from "@stackframe/react";

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
  // Hooks must be called unconditionally - they require StackProvider above this component
  // StackProvider should be wrapped in StackProviderWrapper (client component) in layout.tsx
  const user = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stack Auth loads synchronously, but we need to wait for initial check
    setLoading(false);
  }, []);

  const signOut = async () => {
    if (!user) {
      console.error("User is not available for sign out");
      return;
    }
    await user.signOut();
  };

  const getToken = async () => {
    try {
      if (!user) {
        console.error("User is not available");
        return null;
      }

      // Get access token from Stack Auth
      // Stack Auth tokens are JWTs that can be verified by the backend
      const tokens = await user.currentSession.getTokens();

      if (!tokens || !tokens.accessToken) {
        console.warn(
          "Stack Auth getTokens returned null/undefined accessToken"
        );
        return null;
      }

      return tokens.accessToken;
    } catch (error: any) {
      console.error("Error getting token from Stack Auth:", error);
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
    user: user ? { id: user.id, email: user.primaryEmail } : null,
    loading,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
