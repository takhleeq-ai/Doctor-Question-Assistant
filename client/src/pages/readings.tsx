import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Thermometer,
  Plus,
  Trash2,
  Loader2,
  Heart,
  Droplet,
  Scale,
  Wind,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Reading, Appointment } from "@shared/schema";

const readingTypes = [
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: Heart, hasSecondary: true },
  { value: "blood_glucose", label: "Blood Glucose", unit: "mg/dL", icon: Droplet, hasSecondary: false },
  { value: "temperature", label: "Temperature", unit: "°F", icon: Thermometer, hasSecondary: false },
  { value: "weight", label: "Weight", unit: "lbs", icon: Scale, hasSecondary: false },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Activity, hasSecondary: false },
  { value: "oxygen_saturation", label: "Oxygen Saturation", unit: "%", icon: Wind, hasSecondary: false },
];

const formSchema = z.object({
  type: z.string().min(1, "Select a reading type"),
  value: z.number({ required_error: "Value is required" }).min(0),
  secondaryValue: z.number().optional().nullable(),
  unit: z.string().min(1),
  notes: z.string().optional(),
  appointmentId: z.number().optional().nullable(),
  recordedDate: z.string().min(1, "Date is required"),
  recordedTime: z.string().min(1, "Time is required"),
});

type FormData = z.infer<typeof formSchema>;

function getReadingTypeInfo(type: string) {
  return readingTypes.find(t => t.value === type) || readingTypes[0];
}

function formatReadingValue(reading: Reading): string {
  const typeInfo = getReadingTypeInfo(reading.type);
  if (typeInfo.hasSecondary && reading.secondaryValue) {
    return `${reading.value}/${reading.secondaryValue} ${reading.unit}`;
  }
  return `${reading.value} ${reading.unit}`;
}

function ReadingCard({ 
  reading, 
  onDelete 
}: { 
  reading: Reading;
  onDelete: (id: number) => void;
}) {
  const recordedAt = new Date(reading.recordedAt);
  const typeInfo = getReadingTypeInfo(reading.type);
  const IconComponent = typeInfo.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{typeInfo.label}</h3>
                <Badge variant="secondary" className="font-mono">
                  {formatReadingValue(reading)}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {format(recordedAt, "MMM d, yyyy 'at' h:mm a")} ({formatDistanceToNow(recordedAt, { addSuffix: true })})
              </p>

              {reading.notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  {reading.notes}
                </p>
              )}
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                data-testid={`button-delete-reading-${reading.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Reading</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this reading? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(reading.id)}>
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

function ReadingForm({ 
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
  const now = new Date();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      value: undefined,
      secondaryValue: null,
      unit: "",
      notes: "",
      appointmentId: null,
      recordedDate: format(now, "yyyy-MM-dd"),
      recordedTime: format(now, "HH:mm"),
    },
  });

  const selectedType = form.watch("type");
  const typeInfo = getReadingTypeInfo(selectedType);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reading Type</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  const info = getReadingTypeInfo(value);
                  form.setValue("unit", info.unit);
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-reading-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {readingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {typeInfo.hasSecondary ? "Systolic" : "Value"}
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={typeInfo.hasSecondary ? "120" : "Enter value"}
                          data-testid="input-reading-value"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                        <span className="text-sm text-muted-foreground shrink-0">
                          {typeInfo.unit}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {typeInfo.hasSecondary && (
                <FormField
                  control={form.control}
                  name="secondaryValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diastolic</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="80"
                            data-testid="input-reading-secondary"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                          />
                          <span className="text-sm text-muted-foreground shrink-0">
                            {typeInfo.unit}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recordedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        data-testid="input-reading-date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recordedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        data-testid="input-reading-time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

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
                  <SelectTrigger data-testid="select-reading-appointment">
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
                Track this reading for a specific appointment
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
                  placeholder="Any additional context..." 
                  className="resize-none"
                  data-testid="input-reading-notes"
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
          <Button type="submit" disabled={isPending} data-testid="button-save-reading">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log Reading
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Readings() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const { data: readings, isLoading } = useQuery<Reading[]>({
    queryKey: ["/api/readings"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const recordedAt = new Date(`${data.recordedDate}T${data.recordedTime}`);
      const sanitizedData = {
        type: data.type,
        value: data.value,
        secondaryValue: data.secondaryValue,
        unit: data.unit,
        notes: data.notes,
        appointmentId: data.appointmentId && data.appointmentId !== null ? data.appointmentId : null,
        recordedAt: recordedAt.toISOString(),
      };
      return apiRequest("POST", "/api/readings", sanitizedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/readings"] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/readings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/readings"] });
    },
  });

  const handleSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const filteredReadings = readings?.filter(r => 
    activeTab === "all" || r.type === activeTab
  ).sort((a, b) => 
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );

  const stats = useMemo(() => {
    if (!readings || activeTab === "all") return null;
    
    const typeReadings = readings
      .filter(r => r.type === activeTab)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    
    if (typeReadings.length === 0) return null;

    const values = typeReadings.map(r => r.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    let trend: "up" | "down" | "stable" = "stable";
    if (typeReadings.length >= 2) {
      const last = typeReadings[typeReadings.length - 1].value;
      const prev = typeReadings[typeReadings.length - 2].value;
      if (last > prev) trend = "up";
      else if (last < prev) trend = "down";
    }

    const chartData = typeReadings.map(r => ({
      date: format(new Date(r.recordedAt), "MMM d"),
      value: r.value,
      secondary: r.secondaryValue,
      fullDate: format(new Date(r.recordedAt), "PPP p"),
    }));

    return { avg, min, max, trend, chartData };
  }, [readings, activeTab]);

  const readingCounts = readings?.reduce((acc, r) => {
    acc[r.type] = (acc[r.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Thermometer className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Health Readings</h1>
          </div>
          <p className="text-muted-foreground">
            Log blood pressure, glucose, temperature, and more
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-reading">
              <Plus className="mr-2 h-4 w-4" />
              Log Reading
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Log Health Reading</DialogTitle>
              <DialogDescription>
                Record a new health measurement
              </DialogDescription>
            </DialogHeader>
            <ReadingForm
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
              isPending={createMutation.isPending}
              appointments={appointments}
            />
          </DialogContent>
        </Dialog>
      </div>

      {readings && readings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {readingTypes.map((type) => {
            const count = readingCounts?.[type.value] || 0;
            const latestReading = readings
              .filter(r => r.type === type.value)
              .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
            
            return (
              <Card 
                key={type.value} 
                className={`cursor-pointer transition-all ${activeTab === type.value ? 'ring-2 ring-primary' : 'hover-elevate'}`}
                onClick={() => setActiveTab(activeTab === type.value ? "all" : type.value)}
              >
                <CardContent className="p-3 text-center">
                  <type.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium truncate">{type.label}</p>
                  <p className="text-lg font-bold mt-1">
                    {latestReading ? (
                      type.hasSecondary && latestReading.secondaryValue
                        ? `${latestReading.value}/${latestReading.secondaryValue}`
                        : latestReading.value
                    ) : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground">{count} readings</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab !== "all" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">{getReadingTypeInfo(activeTab).unit}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Range (Min/Max)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.min.toFixed(1)} - {stats.max.toFixed(1)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold">
                {stats.trend === "up" && <TrendingUp className="text-destructive h-6 w-6" />}
                {stats.trend === "down" && <TrendingDown className="text-blue-500 h-6 w-6" />}
                {stats.trend === "stable" && <Minus className="text-muted-foreground h-6 w-6" />}
                <span className="capitalize">{stats.trend}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>History Trend</CardTitle>
              <CardDescription>Visual trend of your {getReadingTypeInfo(activeTab).label.toLowerCase()} readings</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={getReadingTypeInfo(activeTab).hasSecondary ? "Systolic" : "Reading"}
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                  {getReadingTypeInfo(activeTab).hasSecondary && (
                    <Line 
                      type="monotone" 
                      dataKey="secondary" 
                      name="Diastolic"
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: "hsl(var(--destructive))" }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredReadings && filteredReadings.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {activeTab === "all" ? "All Readings" : getReadingTypeInfo(activeTab).label}
            </h2>
            {activeTab !== "all" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveTab("all")}
              >
                Show All
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {filteredReadings.map((reading) => (
              <ReadingCard
                key={reading.id}
                reading={reading}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Thermometer className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">No readings logged</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking your health metrics
            </p>
            <Button 
              className="mt-4" 
              onClick={() => setDialogOpen(true)}
              data-testid="button-add-first-reading"
            >
              <Plus className="mr-2 h-4 w-4" />
              Log Your First Reading
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
