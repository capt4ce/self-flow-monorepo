import { StackClientApp } from "@stackframe/react";

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID || "",
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || "",
  tokenStore: "cookie",
  // For plain React, we use window redirect method
  redirectMethod: "window",
  // Configure auth URLs
  urls: {
    signIn: window.location.origin + "/auth/sign-in",
    signUp: window.location.origin + "/auth/sign-up",
    signOut: window.location.origin + "/auth/sign-out",
    afterSignIn: window.location.origin + "/",
    afterSignUp: window.location.origin + "/",
  },
});
