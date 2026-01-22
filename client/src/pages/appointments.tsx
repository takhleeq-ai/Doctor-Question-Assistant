import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  User,
  Stethoscope,
  Bell,
  BellOff,
  Trash2,
  Edit,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Appointment } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  doctorName: z.string().optional(),
  specialty: z.string().optional(),
  appointmentDate: z.date({ required_error: "Please select a date and time" }),
  location: z.string().optional(),
  notes: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
  reminderDaysBefore: z.number().min(1).max(30).default(1),
});

type FormData = z.infer<typeof formSchema>;

const specialties = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Pulmonology",
  "Rheumatology",
  "Urology",
  "Other",
];

function AppointmentCard({ 
  appointment, 
  onEdit, 
  onDelete 
}: { 
  appointment: Appointment; 
  onEdit: (apt: Appointment) => void;
  onDelete: (id: number) => void;
}) {
  const appointmentDate = new Date(appointment.appointmentDate);
  const isUpcoming = isFuture(appointmentDate);
  const isPastAppointment = isPast(appointmentDate);

  return (
    <Card className={cn(
      "transition-all",
      isPastAppointment && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-md",
              isUpcoming ? "bg-primary/10" : "bg-muted"
            )}>
              <Calendar className={cn(
                "h-5 w-5",
                isUpcoming ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{appointment.title}</h3>
                {isUpcoming && (
                  <Badge variant="secondary" className="shrink-0">
                    {formatDistanceToNow(appointmentDate, { addSuffix: true })}
                  </Badge>
                )}
                {isPastAppointment && (
                  <Badge variant="outline" className="shrink-0">Past</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(appointmentDate, "MMM d, yyyy 'at' h:mm a")}
                </span>
                {appointment.doctorName && (
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {appointment.doctorName}
                  </span>
                )}
                {appointment.specialty && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-3.5 w-3.5" />
                    {appointment.specialty}
                  </span>
                )}
                {appointment.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {appointment.location}
                  </span>
                )}
              </div>

              {appointment.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {appointment.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {appointment.reminderEnabled ? (
              <Bell className="h-4 w-4 text-primary" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onEdit(appointment)}
              data-testid={`button-edit-appointment-${appointment.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  data-testid={`button-delete-appointment-${appointment.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this appointment? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(appointment.id)}>
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

function AppointmentForm({ 
  appointment, 
  onSubmit, 
  onCancel,
  isPending 
}: { 
  appointment?: Appointment | null;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: appointment?.title || "",
      doctorName: appointment?.doctorName || "",
      specialty: appointment?.specialty || "",
      appointmentDate: appointment?.appointmentDate ? new Date(appointment.appointmentDate) : undefined,
      location: appointment?.location || "",
      notes: appointment?.notes || "",
      reminderEnabled: appointment?.reminderEnabled ?? true,
      reminderDaysBefore: appointment?.reminderDaysBefore || 1,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appointment Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Annual Checkup, Follow-up Visit" 
                  data-testid="input-appointment-title"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="doctorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doctor Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Dr. Smith" 
                    data-testid="input-doctor-name"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specialty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-specialty">
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="appointmentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date and Time</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal justify-start",
                        !field.value && "text-muted-foreground"
                      )}
                      data-testid="button-select-date"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(field.value, "PPP 'at' h:mm a")
                      ) : (
                        <span>Pick a date and time</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const newDate = new Date(date);
                        if (field.value) {
                          newDate.setHours(field.value.getHours());
                          newDate.setMinutes(field.value.getMinutes());
                        } else {
                          newDate.setHours(9);
                          newDate.setMinutes(0);
                        }
                        field.onChange(newDate);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  <Separator />
                  <div className="p-3">
                    <FormLabel className="text-sm">Time</FormLabel>
                    <Input
                      type="time"
                      className="mt-1"
                      value={field.value ? format(field.value, "HH:mm") : "09:00"}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = field.value ? new Date(field.value) : new Date();
                        newDate.setHours(parseInt(hours));
                        newDate.setMinutes(parseInt(minutes));
                        field.onChange(newDate);
                      }}
                      data-testid="input-appointment-time"
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Clinic name or address" 
                  data-testid="input-location"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional notes..." 
                  className="resize-none"
                  data-testid="input-appointment-notes"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <FormLabel>Reminder</FormLabel>
            <FormDescription>
              Get notified before your appointment
            </FormDescription>
          </div>
          <FormField
            control={form.control}
            name="reminderEnabled"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-reminder"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {form.watch("reminderEnabled") && (
          <FormField
            control={form.control}
            name="reminderDaysBefore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remind me</FormLabel>
                <Select 
                  onValueChange={(v) => field.onChange(parseInt(v))} 
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-reminder-days">
                      <SelectValue placeholder="Select when" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="2">2 days before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-appointment">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {appointment ? "Update" : "Create"} Appointment
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Appointments() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/appointments", {
        ...data,
        appointmentDate: data.appointmentDate.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      return apiRequest("PATCH", `/api/appointments/${id}`, {
        ...data,
        appointmentDate: data.appointmentDate.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setDialogOpen(false);
      setEditingAppointment(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    },
  });

  const handleSubmit = (data: FormData) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (apt: Appointment) => {
    setEditingAppointment(apt);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const upcomingAppointments = appointments?.filter(apt => 
    isFuture(new Date(apt.appointmentDate))
  ).sort((a, b) => 
    new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
  );

  const pastAppointments = appointments?.filter(apt => 
    isPast(new Date(apt.appointmentDate))
  ).sort((a, b) => 
    new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
  );

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your upcoming doctor visits and get reminders
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingAppointment(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-appointment">
              <Plus className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingAppointment ? "Edit Appointment" : "New Appointment"}
              </DialogTitle>
              <DialogDescription>
                {editingAppointment 
                  ? "Update your appointment details"
                  : "Schedule a new doctor's appointment"}
              </DialogDescription>
            </DialogHeader>
            <AppointmentForm
              appointment={editingAppointment}
              onSubmit={handleSubmit}
              onCancel={() => {
                setDialogOpen(false);
                setEditingAppointment(null);
              }}
              isPending={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        appointments && appointments.length > 0 && (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-3">
              {upcomingAppointments && upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No upcoming appointments
                </div>
              )}
            </TabsContent>
            <TabsContent value="past" className="space-y-3">
              {pastAppointments && pastAppointments.length > 0 ? (
                pastAppointments.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No past appointments
                </div>
              )}
            </TabsContent>
          </Tabs>
        )
      )}

      {(!appointments || appointments.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">No appointments scheduled</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first appointment to get started
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setDialogOpen(true)}
              data-testid="button-add-first-appointment"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Appointment
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
