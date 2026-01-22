import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PatientProfileProvider } from "@/hooks/use-patient-profile";
import { PatientProfileSelector } from "@/components/patient-profile-selector";
import { OfflineIndicator } from "@/components/offline-indicator";
import { UpdateNotification } from "@/components/update-notification";
import { PermissionManager } from "@/components/permission-manager";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import QuestionsGenerator from "@/pages/questions-generator";
import Appointments from "@/pages/appointments";
import Symptoms from "@/pages/symptoms";
import Readings from "@/pages/readings";
import Timeline from "@/pages/timeline";
import Reminders from "@/pages/reminders";
import Profile from "@/pages/profile";
import NearbyServices from "@/pages/nearby-services";
import ExportData from "@/pages/export-data";

function Router() {
  return (
    <Switch>
      <Route path="/" component={QuestionsGenerator} />
      <Route path="/appointments" component={Appointments} />
      <Route path="/symptoms" component={Symptoms} />
      <Route path="/readings" component={Readings} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/nearby" component={NearbyServices} />
      <Route path="/export" component={ExportData} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <PatientProfileProvider>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <header className="flex items-center justify-between gap-2 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="flex items-center gap-2">
                <OfflineIndicator />
                <PatientProfileSelector />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <Router />
            </main>
          </div>
        </div>
        <PermissionManager />
      </SidebarProvider>
    </PatientProfileProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let hiddenTimeout: NodeJS.Timeout | null = null;

    const handleAutoLogout = () => {
      logout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Start 1 minute timeout when app is hidden
        hiddenTimeout = setTimeout(() => {
          handleAutoLogout();
        }, 60000);
      } else {
        // Clear timeout if app becomes visible again
        if (hiddenTimeout) {
          clearTimeout(hiddenTimeout);
          hiddenTimeout = null;
        }
      }
    };

    const handleOnlineStatus = () => {
      if (!navigator.onLine) {
        handleAutoLogout();
      }
    };

    window.addEventListener("pagehide", handleAutoLogout);
    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("offline", handleOnlineStatus);

    return () => {
      if (hiddenTimeout) clearTimeout(hiddenTimeout);
      window.removeEventListener("pagehide", handleAutoLogout);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, [isAuthenticated, logout]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="healthprep-theme">
        <TooltipProvider>
          <AppContent />
          <Toaster />
          <UpdateNotification />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
