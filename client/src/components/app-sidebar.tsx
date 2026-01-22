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
  User,
  LogIn,
  Loader2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, isLoading } = useAuth();

  const userInitials = user 
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || user.email?.[0] || "U"}`.toUpperCase()
    : "?";

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

      <SidebarFooter className="p-4 space-y-3">
        <div className="flex items-center gap-2 rounded-md bg-accent/50 p-3">
          <Heart className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-muted-foreground">
            For informational purposes only. Not medical advice.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : user ? (
          <Link href="/profile">
            <div className="flex items-center gap-3 rounded-md p-2 hover-elevate cursor-pointer" data-testid="nav-profile">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">View Profile</span>
              </div>
            </div>
          </Link>
        ) : (
          <Button asChild variant="outline" className="w-full" data-testid="nav-login">
            <a href="/api/login">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </a>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
