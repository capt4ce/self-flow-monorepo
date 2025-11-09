import React, { createContext, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter } from "@/lib/api-client";

// Import Stack Auth hooks - ensure @stackframe/react is properly installed
import { useUser } from "@stackframe/react";

interface AuthContextType {
  user: { id: string; email: string | null } | null;
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
  // StackProvider is always provided by StackProviderWrapper, even if config is missing
  const user = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Stack Auth loads synchronously, but we need to wait for initial check
    setLoading(false);
  }, []);

  const signOut = async () => {
    if (!user) {
      console.warn("User is not available for sign out - Stack Auth may not be configured");
      return;
    }
    try {
      await user.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getToken = async () => {
    try {
      if (!user) {
        // Silent return when user is not available (e.g., Stack Auth not configured)
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
    } catch (error: unknown) {
      console.error("Error getting token from Stack Auth:", error);
      return null;
    }
  };

  // Set token getter globally for API client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthTokenGetter(getToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = {
    user: user ? { id: user.id, email: user.primaryEmail } : null,
    loading,
    signOut,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
