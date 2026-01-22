import { User, Users, ChevronDown, Baby, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePatientProfile } from "@/hooks/use-patient-profile";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

function getRelationshipIcon(relationship: string) {
  switch (relationship) {
    case "self": return User;
    case "child": return Baby;
    case "spouse": return Heart;
    case "parent": return Users;
    default: return User;
  }
}

export function PatientProfileSelector() {
  const { user } = useAuth();
  const { selectedProfile, profiles, isLoading, selectProfile } = usePatientProfile();

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Users className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (profiles.length === 0) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/profile" data-testid="link-add-profile">
          <Users className="h-4 w-4 mr-2" />
          Add Profile
        </Link>
      </Button>
    );
  }

  const Icon = selectedProfile ? getRelationshipIcon(selectedProfile.relationship) : Users;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" data-testid="button-profile-selector">
          <Icon className="h-4 w-4 mr-2" />
          <span className="max-w-[120px] truncate">
            {selectedProfile?.name || "Select Profile"}
          </span>
          <ChevronDown className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuLabel>Patient Profiles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.map((profile) => {
          const ProfileIcon = getRelationshipIcon(profile.relationship);
          return (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => selectProfile(profile)}
              className={selectedProfile?.id === profile.id ? "bg-accent" : ""}
              data-testid={`menu-profile-${profile.id}`}
            >
              <ProfileIcon className="h-4 w-4 mr-2" />
              <span className="flex-1 truncate">{profile.name}</span>
              {profile.isDefault && (
                <span className="text-xs text-muted-foreground ml-2">Default</span>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" data-testid="link-manage-profiles">
            Manage Profiles
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
