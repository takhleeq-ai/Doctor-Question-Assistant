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
import NotFound from "@/pages/not-found";
import QuestionsGenerator from "@/pages/questions-generator";
import Appointments from "@/pages/appointments";
import Symptoms from "@/pages/symptoms";
import Readings from "@/pages/readings";
import Timeline from "@/pages/timeline";
import Reminders from "@/pages/reminders";
import Profile from "@/pages/profile";
import NearbyServices from "@/pages/nearby-services";

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
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="healthprep-theme">
        <TooltipProvider>
          <PatientProfileProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <div className="flex h-screen w-full">
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                  <header className="flex items-center justify-between gap-2 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="flex items-center gap-2">
                      <PatientProfileSelector />
                      <ThemeToggle />
                    </div>
                  </header>
                  <main className="flex-1 overflow-auto">
                    <Router />
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </PatientProfileProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
