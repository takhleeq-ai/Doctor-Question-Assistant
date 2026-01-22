import { WifiOff, CloudOff, RefreshCw, Check, Download, Clock } from "lucide-react";
import { useOnlineStatus, useOfflineSync } from "@/hooks/use-offline-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatLastSync(timestamp: number | null): string {
  if (!timestamp) return "Never synced";
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

export function OfflineIndicator() {
  const online = useOnlineStatus();
  const { syncing, pendingCount, lastSync, refreshing, syncNow, refreshFromServer } = useOfflineSync();

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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-1.5 text-xs"
          data-testid="button-sync-menu"
        >
          {syncing || refreshing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">Syncing...</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <CloudOff className="h-3.5 w-3.5 text-amber-600" />
              <span className="hidden sm:inline">{pendingCount} pending</span>
              <span className="sm:hidden">{pendingCount}</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span className="hidden sm:inline">Synced</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Sync Status</h4>
            {pendingCount === 0 ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Check className="h-3 w-3 mr-1" />
                Up to date
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {pendingCount} pending
              </Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Last synced: {formatLastSync(lastSync)}
          </div>

          <div className="border-t pt-3 space-y-2">
            {pendingCount > 0 && (
              <Button 
                onClick={syncNow} 
                disabled={syncing}
                className="w-full"
                size="sm"
                data-testid="button-sync-now"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CloudOff className="h-4 w-4 mr-2" />
                    Sync {pendingCount} Changes
                  </>
                )}
              </Button>
            )}

            <Button 
              onClick={refreshFromServer} 
              disabled={refreshing || syncing}
              variant="outline"
              className="w-full"
              size="sm"
              data-testid="button-refresh-server"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Refresh from Server
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Use "Refresh from Server" to get the latest data from other devices.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
