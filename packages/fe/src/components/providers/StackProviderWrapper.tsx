import { StackProvider } from "@stackframe/react";
import { ReactNode } from "react";
import { stackClientApp } from "@/lib/stack";

interface StackProviderWrapperProps {
  children: ReactNode;
}

export function StackProviderWrapper({
  children,
}: StackProviderWrapperProps) {
  // Always provide StackProvider, even if config is missing
  // Stack will handle missing config gracefully, and this prevents
  // "useStackApp must be used within a StackProvider" errors
  if (!stackClientApp.projectId) {
    console.warn(
      "Stack Auth is not configured. Please set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY in your .env file. Authentication features will not work."
    );
  }

  return <StackProvider app={stackClientApp}>{children}</StackProvider>;
}

