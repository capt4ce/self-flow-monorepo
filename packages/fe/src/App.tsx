import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { StackProviderWrapper } from "@/components/providers/StackProviderWrapper";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubtasksProvider } from "@/contexts/SubtasksContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import HomePage from "@/pages/HomePage";
import TasksPage from "@/pages/TasksPage";
import GoalsPage from "@/pages/GoalsPage";
import EnergyLogsPage from "@/pages/EnergyLogsPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";

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
                    <Route path="/handler/oauth-callback" element={<OAuthCallbackPage />} />
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

