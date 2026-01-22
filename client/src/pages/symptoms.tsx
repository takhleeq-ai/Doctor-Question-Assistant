import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Symptom, Appointment } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(2, "Symptom name is required"),
  severity: z.number().min(1).max(10),
  notes: z.string().optional(),
  appointmentId: z.number().optional().nullable(),
});

type FormData = z.infer<typeof formSchema>;

const commonSymptoms = [
  "Headache",
  "Fatigue",
  "Nausea",
  "Dizziness",
  "Pain",
  "Shortness of breath",
  "Chest pain",
  "Back pain",
  "Joint pain",
  "Muscle ache",
  "Fever",
  "Chills",
  "Cough",
  "Sore throat",
  "Congestion",
  "Anxiety",
  "Insomnia",
  "Loss of appetite",
];

function getSeverityLabel(severity: number): string {
  if (severity <= 3) return "Mild";
  if (severity <= 6) return "Moderate";
  if (severity <= 8) return "Severe";
  return "Very Severe";
}

function getSeverityColor(severity: number): string {
  if (severity <= 3) return "bg-green-500";
  if (severity <= 6) return "bg-yellow-500";
  if (severity <= 8) return "bg-orange-500";
  return "bg-red-500";
}

function SymptomCard({ 
  symptom, 
  onDelete 
}: { 
  symptom: Symptom;
  onDelete: (id: number) => void;
}) {
  const recordedAt = new Date(symptom.recordedAt);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-medium text-sm",
              getSeverityColor(symptom.severity)
            )}>
              {symptom.severity}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{symptom.name}</h3>
                <Badge variant="outline">{getSeverityLabel(symptom.severity)}</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {format(recordedAt, "MMM d, yyyy 'at' h:mm a")} ({formatDistanceToNow(recordedAt, { addSuffix: true })})
              </p>

              {symptom.notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  {symptom.notes}
                </p>
              )}
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid={`button-delete-symptom-${symptom.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Symptom Entry</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this symptom entry? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(symptom.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function SymptomForm({ 
  onSubmit, 
  onCancel,
  isPending,
  appointments 
}: { 
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  appointments?: Appointment[];
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      severity: 5,
      notes: "",
      appointmentId: null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symptom</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Input 
                    placeholder="Describe your symptom" 
                    data-testid="input-symptom-name"
                    {...field} 
                  />
                  <div className="flex flex-wrap gap-1">
                    {commonSymptoms.slice(0, 8).map((symptom) => (
                      <Badge
                        key={symptom}
                        variant="outline"
                        className="cursor-pointer hover-elevate"
                        onClick={() => form.setValue("name", symptom)}
                      >
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Severity: {field.value} - {getSeverityLabel(field.value)}
              </FormLabel>
              <FormControl>
                <div className="pt-2 pb-1">
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[field.value]}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="w-full"
                    data-testid="slider-severity"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Severe</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appointmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link to Appointment (Optional)</FormLabel>
              <Select 
                onValueChange={(v) => field.onChange(v && v !== "none" ? parseInt(v) : null)} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-symptom-appointment">
                    <SelectValue placeholder="Select an appointment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No appointment</SelectItem>
                  {appointments?.map((apt) => (
                    <SelectItem key={apt.id} value={apt.id.toString()}>
                      {apt.title} - {format(new Date(apt.appointmentDate), "MMM d")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Track this symptom for a specific appointment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional details about this symptom..." 
                  className="resize-none"
                  data-testid="input-symptom-notes"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-symptom">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Symptom
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Symptoms() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: symptoms, isLoading } = useQuery<Symptom[]>({
    queryKey: ["/api/symptoms"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const sanitizedData = {
        ...data,
        appointmentId: data.appointmentId && data.appointmentId !== null ? data.appointmentId : null,
      };
      return apiRequest("POST", "/api/symptoms", sanitizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/symptoms"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/symptoms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/symptoms"] });
    },
  });

  const handleSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const sortedSymptoms = symptoms?.sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const recentSevereSymptoms = symptoms?.filter(s => s.severity >= 7).slice(0, 3);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Symptom Tracker</h1>
          </div>
          <p className="text-muted-foreground">
            Log and track your symptoms over time
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-symptom">
              <Plus className="mr-2 h-4 w-4" />
              Log Symptom
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Symptom</DialogTitle>
              <DialogDescription>
                Record a symptom you're experiencing
              </DialogDescription>
            </DialogHeader>
            <SymptomForm
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              isPending={createMutation.isPending}
              appointments={appointments}
            />
          </DialogContent>
        </Dialog>
      </div>

      {recentSevereSymptoms && recentSevereSymptoms.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Recent Severe Symptoms
            </CardTitle>
            <CardDescription>
              Consider discussing these with your doctor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSevereSymptoms.map((symptom) => (
                <Badge key={symptom.id} variant="destructive">
                  {symptom.name} (severity: {symptom.severity})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sortedSymptoms && sortedSymptoms.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Entries</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {symptoms?.length} total entries
            </div>
          </div>
          <div className="space-y-3">
            {sortedSymptoms.map((symptom) => (
              <SymptomCard
                key={symptom.id}
                symptom={symptom}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">No symptoms logged</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking your symptoms to share with your doctor
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setDialogOpen(true)}
              data-testid="button-add-first-symptom"
            >
              <Plus className="mr-2 h-4 w-4" />
              Log Your First Symptom
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
