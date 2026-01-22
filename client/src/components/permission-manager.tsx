import { useState, useEffect } from "react";
import { Bell, MapPin, X, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PermissionStatus {
  notifications: PermissionState | "unsupported";
  location: PermissionState | "unsupported";
}

const PERMISSION_PROMPTED_KEY = "healthprep-permissions-prompted";

export function PermissionManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [permissions, setPermissions] = useState<PermissionStatus>({
    notifications: "prompt",
    location: "prompt",
  });
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const status: PermissionStatus = {
      notifications: "unsupported",
      location: "unsupported",
    };

    if ("Notification" in window) {
      status.notifications = Notification.permission as PermissionState;
    }

    if ("geolocation" in navigator && "permissions" in navigator) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        status.location = result.state;
      } catch {
        status.location = "prompt";
      }
    }

    setPermissions(status);

    const alreadyPrompted = localStorage.getItem(PERMISSION_PROMPTED_KEY);
    const needsPrompt = 
      (status.notifications === "prompt" || status.location === "prompt") &&
      !alreadyPrompted;

    if (needsPrompt) {
      setTimeout(() => setShowDialog(true), 2000);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;

    setRequesting("notifications");
    try {
      const result = await Notification.requestPermission();
      setPermissions(prev => ({ ...prev, notifications: result as PermissionState }));
    } catch (error) {
      console.error("Failed to request notification permission:", error);
    }
    setRequesting(null);
  };

  const requestLocationPermission = async () => {
    if (!("geolocation" in navigator)) return;

    setRequesting("location");
    try {
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          maximumAge: 0,
        });
      });
      setPermissions(prev => ({ ...prev, location: "granted" }));
    } catch (error: any) {
      if (error.code === 1) {
        setPermissions(prev => ({ ...prev, location: "denied" }));
      }
    }
    setRequesting(null);
  };

  const handleClose = () => {
    localStorage.setItem(PERMISSION_PROMPTED_KEY, "true");
    setShowDialog(false);
  };

  const handleEnableAll = async () => {
    if (permissions.notifications === "prompt") {
      await requestNotificationPermission();
    }
    if (permissions.location === "prompt") {
      await requestLocationPermission();
    }
    handleClose();
  };

  const allGranted = 
    (permissions.notifications === "granted" || permissions.notifications === "unsupported") &&
    (permissions.location === "granted" || permissions.location === "unsupported");

  const getStatusIcon = (status: PermissionState | "unsupported") => {
    if (status === "granted") return <Check className="h-4 w-4 text-green-600" />;
    if (status === "denied") return <X className="h-4 w-4 text-red-500" />;
    return <ChevronRight className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = (status: PermissionState | "unsupported") => {
    if (status === "granted") return "Enabled";
    if (status === "denied") return "Blocked";
    if (status === "unsupported") return "Not available";
    return "Not set";
  };

  if (allGranted && !showDialog) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable App Features</DialogTitle>
          <DialogDescription>
            Allow these permissions to get the most out of HealthPrep
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {permissions.notifications !== "unsupported" && (
            <Card 
              className={`cursor-pointer transition-colors ${permissions.notifications === "granted" ? "bg-green-50 dark:bg-green-950 border-green-200" : ""}`}
              onClick={permissions.notifications === "prompt" ? requestNotificationPermission : undefined}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for appointments and health tracking
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {requesting === "notifications" ? (
                    <span className="text-sm text-muted-foreground">Requesting...</span>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">{getStatusText(permissions.notifications)}</span>
                      {getStatusIcon(permissions.notifications)}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {permissions.location !== "unsupported" && (
            <Card 
              className={`cursor-pointer transition-colors ${permissions.location === "granted" ? "bg-green-50 dark:bg-green-950 border-green-200" : ""}`}
              onClick={permissions.location === "prompt" ? requestLocationPermission : undefined}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Location</h4>
                  <p className="text-sm text-muted-foreground">
                    Find nearby pharmacies, doctors, and hospitals
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {requesting === "location" ? (
                    <span className="text-sm text-muted-foreground">Requesting...</span>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">{getStatusText(permissions.location)}</span>
                      {getStatusIcon(permissions.location)}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1" data-testid="button-skip-permissions">
            Maybe Later
          </Button>
          <Button onClick={handleEnableAll} className="flex-1" data-testid="button-enable-permissions">
            Enable All
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          You can change these anytime in your browser settings
        </p>
      </DialogContent>
    </Dialog>
  );
}
