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
  Users,
  Baby,
  Heart,
  Star,
  Calendar,
  AlertTriangle,
  Pill,
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
import type { HealthcareProvider, PatientProfile } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const relationshipTypes = [
  { value: "self", label: "Myself" },
  { value: "child", label: "Child" },
  { value: "spouse", label: "Spouse/Partner" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const bloodTypeOptions = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "unknown", label: "Unknown" },
];

const patientProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  conditions: z.string().optional(),
  medications: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type PatientProfileFormData = z.infer<typeof patientProfileSchema>;

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

function getRelationshipLabel(relationship: string): string {
  return relationshipTypes.find(r => r.value === relationship)?.label || relationship;
}

function getRelationshipIcon(relationship: string) {
  switch (relationship) {
    case "self": return User;
    case "child": return Baby;
    case "spouse": return Heart;
    case "parent": return Users;
    default: return User;
  }
}

function PatientProfileCard({
  profile,
  onDelete,
  onEdit,
  onSetDefault,
}: {
  profile: PatientProfile;
  onDelete: (id: number) => void;
  onEdit: (profile: PatientProfile) => void;
  onSetDefault: (id: number) => void;
}) {
  const Icon = getRelationshipIcon(profile.relationship);
  
  return (
    <Card className={profile.isDefault ? "border-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${profile.isDefault ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium">{profile.name}</h3>
                <Badge variant="outline">{getRelationshipLabel(profile.relationship)}</Badge>
                {profile.isDefault && (
                  <Badge variant="default" className="gap-1">
                    <Star className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                {profile.dateOfBirth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(profile.dateOfBirth).toLocaleDateString()}
                  </span>
                )}
                {profile.bloodType && profile.bloodType !== "unknown" && (
                  <span className="flex items-center gap-1">
                    Blood: {profile.bloodType}
                  </span>
                )}
              </div>

              {profile.allergies && (
                <p className="text-sm text-destructive flex items-start gap-1 mt-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  Allergies: {profile.allergies}
                </p>
              )}

              {profile.conditions && (
                <p className="text-sm text-muted-foreground mt-1">
                  Conditions: {profile.conditions}
                </p>
              )}

              {profile.medications && (
                <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                  <Pill className="h-3 w-3 mt-0.5 shrink-0" />
                  {profile.medications}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {!profile.isDefault && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSetDefault(profile.id)}
                title="Set as default"
                data-testid={`button-set-default-profile-${profile.id}`}
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(profile)}
              data-testid={`button-edit-profile-${profile.id}`}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid={`button-delete-profile-${profile.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Patient Profile</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {profile.name} from your profiles? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(profile.id)}>
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

function PatientProfileForm({
  onSubmit,
  onCancel,
  isPending,
  defaultValues,
  isEditing,
}: {
  onSubmit: (data: PatientProfileFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  defaultValues?: Partial<PatientProfileFormData>;
  isEditing?: boolean;
}) {
  const form = useForm<PatientProfileFormData>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      name: "",
      relationship: "",
      dateOfBirth: "",
      gender: "",
      bloodType: "",
      allergies: "",
      conditions: "",
      medications: "",
      emergencyContact: "",
      emergencyPhone: "",
      notes: "",
      isDefault: false,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Full name"
                    data-testid="input-profile-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {relationshipTypes.map((type) => (
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    data-testid="input-profile-dob"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
          name="bloodType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Type (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-blood-type">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {bloodTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Known Allergies (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Penicillin, Peanuts, Latex"
                  className="resize-none"
                  data-testid="input-profile-allergies"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="conditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical Conditions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Diabetes Type 2, Hypertension"
                  className="resize-none"
                  data-testid="input-profile-conditions"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Medications (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Metformin 500mg, Lisinopril 10mg"
                  className="resize-none"
                  data-testid="input-profile-medications"
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
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Contact (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Contact name"
                    data-testid="input-profile-emergency-contact"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergencyPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Phone (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(555) 123-4567"
                    data-testid="input-profile-emergency-phone"
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional health information"
                  className="resize-none"
                  data-testid="input-profile-notes"
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
          <Button type="submit" disabled={isPending} data-testid="button-save-profile">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Saving..." : "Adding..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Save Changes" : "Add Profile"}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
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
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<HealthcareProvider | null>(null);
  const [editingProfile, setEditingProfile] = useState<PatientProfile | null>(null);

  // Providers queries
  const { data: providers, isLoading: providersLoading } = useQuery<HealthcareProvider[]>({
    queryKey: ["/api/providers"],
    enabled: !!user,
  });

  // Patient profiles queries
  const { data: patientProfiles, isLoading: profilesLoading } = useQuery<PatientProfile[]>({
    queryKey: ["/api/patient-profiles"],
    enabled: !!user,
  });

  // Provider mutations
  const createProviderMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/providers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setProviderDialogOpen(false);
    },
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const response = await apiRequest("PATCH", `/api/providers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      setEditingProvider(null);
    },
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
    },
  });

  // Patient profile mutations
  const createProfileMutation = useMutation({
    mutationFn: async (data: PatientProfileFormData) => {
      const response = await apiRequest("POST", "/api/patient-profiles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-profiles"] });
      setProfileDialogOpen(false);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PatientProfileFormData }) => {
      const response = await apiRequest("PATCH", `/api/patient-profiles/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-profiles"] });
      setEditingProfile(null);
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/patient-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-profiles"] });
    },
  });

  const setDefaultProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/patient-profiles/${id}/set-default`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-profiles"] });
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

      <Tabs defaultValue="profiles" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profiles" data-testid="tab-patient-profiles">
            <Users className="mr-2 h-4 w-4" />
            Patient Profiles
          </TabsTrigger>
          <TabsTrigger value="providers" data-testid="tab-providers">
            <Stethoscope className="mr-2 h-4 w-4" />
            Healthcare Providers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Patient Profiles</h2>
              <p className="text-sm text-muted-foreground">
                Manage health information for yourself and family members
              </p>
            </div>
            <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-profile">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Patient Profile</DialogTitle>
                  <DialogDescription>
                    Add a new profile for yourself or a family member to track their health information separately.
                  </DialogDescription>
                </DialogHeader>
                <PatientProfileForm
                  onSubmit={(data) => createProfileMutation.mutate(data)}
                  onCancel={() => setProfileDialogOpen(false)}
                  isPending={createProfileMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>

          {profilesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : patientProfiles && patientProfiles.length > 0 ? (
            <div className="grid gap-4">
              {patientProfiles.map((profile) => (
                <PatientProfileCard
                  key={profile.id}
                  profile={profile}
                  onDelete={(id) => deleteProfileMutation.mutate(id)}
                  onEdit={(p) => setEditingProfile(p)}
                  onSetDefault={(id) => setDefaultProfileMutation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No patient profiles yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create a profile for yourself or add family members to track health information for everyone.
                </p>
                <Button onClick={() => setProfileDialogOpen(true)} data-testid="button-add-first-profile">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Healthcare Providers</h2>
              <p className="text-sm text-muted-foreground">
                Keep track of your doctors, dentists, and other healthcare providers
              </p>
            </div>
            <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
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
                  onSubmit={(data) => createProviderMutation.mutate(data)}
                  onCancel={() => setProviderDialogOpen(false)}
                  isPending={createProviderMutation.isPending}
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
                  onDelete={(id) => deleteProviderMutation.mutate(id)}
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
                <Button onClick={() => setProviderDialogOpen(true)} data-testid="button-add-first-provider">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Provider
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
              onSubmit={(data) => updateProviderMutation.mutate({ id: editingProvider.id, data })}
              onCancel={() => setEditingProvider(null)}
              isPending={updateProviderMutation.isPending}
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

      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient Profile</DialogTitle>
            <DialogDescription>
              Update the health information for this profile.
            </DialogDescription>
          </DialogHeader>
          {editingProfile && (
            <PatientProfileForm
              onSubmit={(data) => updateProfileMutation.mutate({ id: editingProfile.id, data })}
              onCancel={() => setEditingProfile(null)}
              isPending={updateProfileMutation.isPending}
              defaultValues={{
                name: editingProfile.name,
                relationship: editingProfile.relationship,
                dateOfBirth: editingProfile.dateOfBirth ? new Date(editingProfile.dateOfBirth).toISOString().split('T')[0] : "",
                gender: editingProfile.gender || "",
                bloodType: editingProfile.bloodType || "",
                allergies: editingProfile.allergies || "",
                conditions: editingProfile.conditions || "",
                medications: editingProfile.medications || "",
                emergencyContact: editingProfile.emergencyContact || "",
                emergencyPhone: editingProfile.emergencyPhone || "",
                notes: editingProfile.notes || "",
                isDefault: editingProfile.isDefault || false,
              }}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
