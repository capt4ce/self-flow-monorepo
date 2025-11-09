import { StackClientApp } from "@stackframe/react";

export const stackClientApp = new StackClientApp({
  projectId: import.meta.env.VITE_STACK_PROJECT_ID || "",
  publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY || "",
  tokenStore: "cookie",
  // For plain React, we use window redirect method
  redirectMethod: "window",
  // Configure auth URLs
  urls: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
    signOut: "/auth/sign-out",
    afterSignIn: "/",
    afterSignUp: "/",
  },
});
