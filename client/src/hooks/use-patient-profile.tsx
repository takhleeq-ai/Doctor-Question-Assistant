import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PatientProfile } from "@shared/schema";
import { useAuth } from "./use-auth";

interface PatientProfileContextType {
  selectedProfile: PatientProfile | null;
  profiles: PatientProfile[];
  isLoading: boolean;
  selectProfile: (profile: PatientProfile) => void;
}

const PatientProfileContext = createContext<PatientProfileContextType | undefined>(undefined);

export function PatientProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);

  const { data: profiles = [], isLoading } = useQuery<PatientProfile[]>({
    queryKey: ["/api/patient-profiles"],
    enabled: !!user,
  });

  useEffect(() => {
    if (profiles.length > 0 && !selectedProfile) {
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      setSelectedProfile(defaultProfile);
    }
  }, [profiles, selectedProfile]);

  useEffect(() => {
    if (selectedProfile && profiles.length > 0) {
      const updated = profiles.find(p => p.id === selectedProfile.id);
      if (updated) {
        setSelectedProfile(updated);
      }
    }
  }, [profiles, selectedProfile]);

  const selectProfile = (profile: PatientProfile) => {
    setSelectedProfile(profile);
  };

  return (
    <PatientProfileContext.Provider value={{ selectedProfile, profiles, isLoading, selectProfile }}>
      {children}
    </PatientProfileContext.Provider>
  );
}

export function usePatientProfile() {
  const context = useContext(PatientProfileContext);
  if (context === undefined) {
    throw new Error("usePatientProfile must be used within a PatientProfileProvider");
  }
  return context;
}
