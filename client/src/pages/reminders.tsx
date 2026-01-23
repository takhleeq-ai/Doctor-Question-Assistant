import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow, addHours } from "date-fns";
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  BellRing,
  BellOff,
  Clock,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reminder } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  type: z.string().min(1, "Select a reminder type"),
  intervalHours: z.number().min(1, "Interval must be at least 1 hour"),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

const reminderTypes = [
  { value: "blood_pressure", label: "Blood Pressure" },
  { value: "blood_glucose", label: "Blood Glucose" },
  { value: "medication", label: "Medication" },
  { value: "temperature", label: "Temperature" },
  { value: "weight", label: "Weight" },
  { value: "exercise", label: "Exercise" },
  { value: "water_intake", label: "Water Intake" },
  { value: "custom", label: "Custom" },
];

const intervalOptions = [
  { value: 1, label: "Every hour" },
  { value: 2, label: "Every 2 hours" },
  { value: 4, label: "Every 4 hours" },
  { value: 6, label: "Every 6 hours" },
  { value: 8, label: "Every 8 hours" },
  { value: 12, label: "Every 12 hours" },
  { value: 24, label: "Once a day" },
  { value: 48, label: "Every 2 days" },
  { value: 168, label: "Once a week" },
];

function ReminderCard({ 
  reminder, 
  onToggle,
  onDelete 
}: { 
  reminder: Reminder;
  onToggle: (id: number, isActive: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const typeInfo = reminderTypes.find(t => t.value === reminder.type);
  const intervalInfo = intervalOptions.find(i => i.value === reminder.intervalHours);
  const nextTrigger = reminder.nextTrigger ? new Date(reminder.nextTrigger) : null;

  return (
    <Card className={cn(!reminder.isActive && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              reminder.isActive ? "bg-primary/10" : "bg-muted"
            )}>
              {reminder.isActive ? (
                <BellRing className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{reminder.title}</h3>
                <Badge variant="outline">{typeInfo?.label || reminder.type}</Badge>
                {reminder.isActive ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Paused</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {intervalInfo?.label || `Every ${reminder.intervalHours} hours`}
                </span>
                {nextTrigger && reminder.isActive && (
                  <span>
                    Next: {formatDistanceToNow(nextTrigger, { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={reminder.isActive ?? false}
              onCheckedChange={(checked) => onToggle(reminder.id, checked)}
              data-testid={`switch-reminder-${reminder.id}`}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  data-testid={`button-delete-reminder-${reminder.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this reminder? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(reminder.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReminderForm({ 
  onSubmit, 
  onCancel,
  isPending 
}: { 
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "",
      intervalHours: 6,
      isActive: true,
    },
  });

  const selectedType = form.watch("type");

  useEffect(() => {
    if (selectedType && selectedType !== "custom") {
      const typeInfo = reminderTypes.find(t => t.value === selectedType);
      if (typeInfo && !form.getValues("title")) {
        form.setValue("title", `${typeInfo.label} Reminder`);
      }
    }
  }, [selectedType, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-reminder-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {reminderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reminder Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Take morning blood pressure" 
                  data-testid="input-reminder-title"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="intervalHours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select 
                onValueChange={(v) => field.onChange(parseInt(v))} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-interval">
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {intervalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                How often should you be reminded?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-reminder">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Reminder
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Reminders() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const nextTrigger = addHours(new Date(), data.intervalHours);
      return apiRequest("POST", "/api/reminders", {
        ...data,
        nextTrigger: nextTrigger.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setDialogOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/reminders/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    },
  });

  const handleSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleToggle = (id: number, isActive: boolean) => {
    toggleMutation.mutate({ id, isActive });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const activeReminders = reminders?.filter(r => r.isActive);
  const pausedReminders = reminders?.filter(r => !r.isActive);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          </div>
          <p className="text-muted-foreground">
            Set up periodic reminders to log readings
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reminder">
              <Plus className="mr-2 h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Reminder</DialogTitle>
              <DialogDescription>
                Set up a new periodic reminder
              </DialogDescription>
            </DialogHeader>
            <ReminderForm
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {notificationPermission !== "granted" && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Enable Notifications</AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
            <span>
              Allow browser notifications to receive reminder alerts even when this tab is in the background.
            </span>
            <Button 
              size="sm" 
              onClick={requestNotificationPermission}
              data-testid="button-enable-notifications"
            >
              Enable Notifications
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {notificationPermission === "granted" && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-400">Notifications Enabled</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            You'll receive browser notifications for your reminders.
          </AlertDescription>
        </Alert>
      )}

      {notificationPermission === "denied" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Notifications Blocked</AlertTitle>
          <AlertDescription>
            Browser notifications are blocked. Please enable them in your browser settings to receive reminder alerts.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeReminders && activeReminders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                Active Reminders
              </h2>
              <div className="space-y-3">
                {activeReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {pausedReminders && pausedReminders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                <BellOff className="h-5 w-5" />
                Paused Reminders
              </h2>
              <div className="space-y-3">
                {pausedReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {(!reminders || reminders.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No reminders set up</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create reminders to help you log readings regularly
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setDialogOpen(true)}
                  data-testid="button-add-first-reminder"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Reminder
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
