import { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        setShowUpdate(true);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        setRegistration(reg);
        
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      }
    });

    const checkForUpdates = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().catch(() => {});
        }
      });
    };

    checkForUpdates();
    const interval = setInterval(checkForUpdates, 60000);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="font-medium">Update Available</h4>
            <p className="text-sm opacity-90 mt-1">
              A new version of HealthPrep is available. Refresh to get the latest features.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={handleDismiss}
            data-testid="button-dismiss-update"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleUpdate}
            className="flex-1"
            data-testid="button-refresh-app"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-primary-foreground hover:bg-primary-foreground/20"
            data-testid="button-later"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
