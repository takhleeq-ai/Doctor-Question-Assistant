import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  User,
  Plus,
  Trash2,
  Loader2,
  Edit2,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  Building2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HealthcareProvider } from "@shared/schema";

const providerTypes = [
  { value: "gp", label: "General Practitioner (GP)" },
  { value: "dentist", label: "Dentist" },
  { value: "optometrist", label: "Optometrist" },
  { value: "specialist", label: "Specialist" },
  { value: "physiotherapist", label: "Physiotherapist" },
  { value: "psychologist", label: "Psychologist" },
  { value: "pharmacist", label: "Pharmacist" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  type: z.string().min(1, "Select a provider type"),
  name: z.string().min(2, "Provider name is required"),
  specialty: z.string().optional(),
  practice: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

function getProviderTypeLabel(type: string): string {
  return providerTypes.find(t => t.value === type)?.label || type;
}

function ProviderCard({ 
  provider, 
  onDelete,
  onEdit 
}: { 
  provider: HealthcareProvider;
  onDelete: (id: number) => void;
  onEdit: (provider: HealthcareProvider) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{provider.name}</h3>
                <Badge variant="outline">{getProviderTypeLabel(provider.type)}</Badge>
              </div>
              
              {provider.specialty && (
                <p className="text-sm text-muted-foreground">
                  {provider.specialty}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                {provider.practice && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {provider.practice}
                  </span>
                )}
                {provider.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {provider.phone}
                  </span>
                )}
                {provider.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {provider.email}
                  </span>
                )}
              </div>

              {provider.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  {provider.address}
                </p>
              )}

              {provider.notes && (
                <p className="text-sm text-muted-foreground mt-2 italic">
                  {provider.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(provider)}
              data-testid={`button-edit-provider-${provider.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  data-testid={`button-delete-provider-${provider.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Healthcare Provider</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {provider.name} from your providers? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(provider.id)}>
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

function ProviderForm({ 
  onSubmit, 
  onCancel,
  isPending,
  defaultValues,
  isEditing
}: { 
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  defaultValues?: Partial<FormData>;
  isEditing?: boolean;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      name: "",
      specialty: "",
      practice: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-provider-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {providerTypes.map((type) => (
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Dr. Smith" 
                  data-testid="input-provider-name"
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
              <FormLabel>Specialty (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Cardiology, Family Medicine" 
                  data-testid="input-provider-specialty"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="practice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Practice/Clinic Name (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., City Medical Center" 
                  data-testid="input-provider-practice"
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(555) 123-4567" 
                    data-testid="input-provider-phone"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="doctor@clinic.com" 
                    data-testid="input-provider-email"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="123 Medical Way, Suite 100, City, State 12345" 
                  className="resize-none"
                  data-testid="input-provider-address"
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information about this provider" 
                  className="resize-none"
                  data-testid="input-provider-notes"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-provider">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Save Changes" : "Add Provider"}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Profile() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<HealthcareProvider | null>(null);

  const { data: providers, isLoading: providersLoading } = useQuery<HealthcareProvider[]>({
    queryKey: ["/api/providers"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/providers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await apiRequest("PATCH", `/api/providers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setEditingProvider(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
    },
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to access your profile</h2>
            <p className="text-muted-foreground mb-4 text-center">
              Create an account or sign in to manage your healthcare providers and personalize your experience.
            </p>
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || user.email?.[0] || "U"}`.toUpperCase();

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account and healthcare providers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
              <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user.email || "User"}
              </h3>
              {user.email && (
                <p className="text-muted-foreground">{user.email}</p>
              )}
            </div>
            <Button variant="outline" onClick={() => logout()} data-testid="button-logout">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Healthcare Providers</h2>
            <p className="text-sm text-muted-foreground">
              Keep track of your doctors, dentists, and other healthcare providers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-provider">
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Healthcare Provider</DialogTitle>
                <DialogDescription>
                  Add a new doctor, dentist, or other healthcare provider to your records.
                </DialogDescription>
              </DialogHeader>
              <ProviderForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setDialogOpen(false)}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {providersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid gap-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={(p) => setEditingProvider(p)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No providers yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your GP, dentist, specialists, and other healthcare providers to keep all your medical contacts in one place.
              </p>
              <Button onClick={() => setDialogOpen(true)} data-testid="button-add-first-provider">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Provider
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!editingProvider} onOpenChange={(open) => !open && setEditingProvider(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Healthcare Provider</DialogTitle>
            <DialogDescription>
              Update the information for this healthcare provider.
            </DialogDescription>
          </DialogHeader>
          {editingProvider && (
            <ProviderForm
              onSubmit={(data) => updateMutation.mutate({ id: editingProvider.id, data })}
              onCancel={() => setEditingProvider(null)}
              isPending={updateMutation.isPending}
              defaultValues={{
                type: editingProvider.type,
                name: editingProvider.name,
                specialty: editingProvider.specialty || "",
                practice: editingProvider.practice || "",
                phone: editingProvider.phone || "",
                email: editingProvider.email || "",
                address: editingProvider.address || "",
                notes: editingProvider.notes || "",
              }}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
