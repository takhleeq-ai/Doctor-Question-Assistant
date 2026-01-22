import { WifiOff, CloudOff, RefreshCw, Check } from "lucide-react";
import { useOnlineStatus, useOfflineSync } from "@/hooks/use-offline-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function OfflineIndicator() {
  const online = useOnlineStatus();
  const { syncing, pendingCount, syncNow } = useOfflineSync();

  if (online && pendingCount === 0) {
    return null;
  }

  if (!online) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" data-testid="badge-offline">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>You're offline. Changes will sync when you're back online.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (syncing) {
    return (
      <Badge variant="secondary" className="gap-1" data-testid="badge-syncing">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Syncing...
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={syncNow}
            className="h-7 gap-1 text-xs"
            data-testid="button-sync"
          >
            <CloudOff className="h-3 w-3" />
            {pendingCount} pending
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to sync {pendingCount} pending changes</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return null;
}
