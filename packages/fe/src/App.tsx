import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { StackProviderWrapper } from "@/components/providers/StackProviderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubtasksProvider } from "@/contexts/SubtasksContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
const HomePage = lazy(() => import("@/pages/HomePage"));
const TasksPage = lazy(() => import("@/pages/TasksPage"));
const GoalsPage = lazy(() => import("@/pages/GoalsPage"));
const EnergyLogsPage = lazy(() => import("@/pages/EnergyLogsPage"));
const SignInPage = lazy(() => import("@/pages/SignInPage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const OAuthCallbackPage = lazy(() => import("@/pages/OAuthCallbackPage"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <TooltipProvider>
          <StackProviderWrapper>
            <AuthProvider>
              <SubtasksProvider>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/energy-logs" element={<EnergyLogsPage />} />
                    <Route path="/auth/sign-in" element={<SignInPage />} />
                    <Route path="/auth/sign-up" element={<SignUpPage />} />
                    <Route
                      path="/handler/oauth-callback"
                      element={<OAuthCallbackPage />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </SubtasksProvider>
            </AuthProvider>
          </StackProviderWrapper>
        </TooltipProvider>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
