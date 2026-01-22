import { useLocation, Link } from "wouter";
import {
  Stethoscope,
  ClipboardList,
  Activity,
  Thermometer,
  Calendar,
  Bell,
  Clock,
  Heart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainNavItems = [
  {
    title: "Questions Generator",
    url: "/",
    icon: ClipboardList,
    description: "Generate questions for your doctor",
  },
  {
    title: "Appointments",
    url: "/appointments",
    icon: Calendar,
    description: "Manage upcoming appointments",
  },
  {
    title: "Symptom Tracker",
    url: "/symptoms",
    icon: Activity,
    description: "Track your symptoms over time",
  },
  {
    title: "Health Readings",
    url: "/readings",
    icon: Thermometer,
    description: "Log blood pressure, glucose, etc.",
  },
  {
    title: "Timeline",
    url: "/timeline",
    icon: Clock,
    description: "View your health history",
  },
  {
    title: "Reminders",
    url: "/reminders",
    icon: Bell,
    description: "Set up reading reminders",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">HealthPrep</span>
            <span className="text-xs text-muted-foreground">Doctor Visit Companion</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    tooltip={item.description}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "") || "home"}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2 rounded-md bg-accent/50 p-3">
          <Heart className="h-4 w-4 text-destructive" />
          <p className="text-xs text-muted-foreground">
            For informational purposes only. Not medical advice.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
