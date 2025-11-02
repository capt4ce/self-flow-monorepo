"use client";

import { StackProvider } from "@stackframe/react";
import { ReactNode } from "react";
import { stackClientApp } from "@/lib/stack";

interface StackProviderWrapperProps {
  children: ReactNode;
}

export function StackProviderWrapper({
  children,
}: StackProviderWrapperProps) {
  if (!stackClientApp.projectId) {
    console.error(
      "StackProvider requires valid configuration. Please set NEXT_PUBLIC_STACK_PROJECT_ID and NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY in your .env.local file."
    );
    // Return children without StackProvider if configuration is missing
    // This allows the app to render, though auth won't work
    return <>{children}</>;
  }

  return <StackProvider app={stackClientApp}>{children}</StackProvider>;
}

