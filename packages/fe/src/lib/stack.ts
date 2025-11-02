"use client";

import { StackClientApp } from "@stackframe/react";

export const stackClientApp = new StackClientApp({
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "",
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "",
  tokenStore: "cookie",
  // For Next.js, we use window redirect method (works with App Router)
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

