import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PatientProfile } from "@shared/schema";
import { useAuth } from "./use-auth";

function calculateAge(dateOfBirth: Date | string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

interface PatientProfileContextType {
  selectedProfile: PatientProfile | null;
  profiles: PatientProfile[];
  isLoading: boolean;
  isChildMode: boolean;
  patientAge: number | null;
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

  const patientAge = calculateAge(selectedProfile?.dateOfBirth);
  const isChildMode = patientAge !== null && patientAge < 15;

  useEffect(() => {
    if (isChildMode) {
      document.documentElement.classList.add("child-mode");
    } else {
      document.documentElement.classList.remove("child-mode");
    }
    return () => {
      document.documentElement.classList.remove("child-mode");
    };
  }, [isChildMode]);

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
    <PatientProfileContext.Provider value={{ selectedProfile, profiles, isLoading, isChildMode, patientAge, selectProfile }}>
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
