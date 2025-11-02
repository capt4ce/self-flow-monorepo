"use client";

import { useStackApp } from "@stackframe/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const app = useStackApp();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    async function handleCallback() {
      try {
        const success = await app.callOAuthCallback();
        if (success) {
          setStatus("success");
          // Redirect to home page after successful OAuth callback
          router.push("/");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
      }
    }

    handleCallback();
  }, [app, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to complete sign in.</p>
          <button
            onClick={() => router.push("/auth/sign-in")}
            className="text-primary hover:underline"
          >
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  return null;
}

