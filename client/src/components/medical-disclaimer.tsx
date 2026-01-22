import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function MedicalDisclaimer() {
  return (
    <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertTitle className="text-amber-800 dark:text-amber-400">Important Notice</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        This tool helps you prepare questions for your doctor. It does not provide medical diagnosis, 
        treatment recommendations, or replace professional medical advice. Always consult with your 
        healthcare provider for medical decisions.
      </AlertDescription>
    </Alert>
  );
}
