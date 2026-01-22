import { 
  ClipboardList, 
  Calendar, 
  Activity, 
  Thermometer, 
  Bell, 
  MapPin, 
  Share2,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Heart,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Questions",
    description: "Get personalized questions to ask your doctor based on your symptoms and conditions",
  },
  {
    icon: Calendar,
    title: "Appointment Tracker",
    description: "Never miss a doctor visit with appointment scheduling and reminders",
  },
  {
    icon: Activity,
    title: "Symptom Logging",
    description: "Track symptoms over time with severity ratings to share with your healthcare provider",
  },
  {
    icon: Thermometer,
    title: "Health Readings",
    description: "Record blood pressure, glucose, temperature, weight, and more",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Set customizable reminders to log readings and take medications",
  },
  {
    icon: MapPin,
    title: "Nearby Services",
    description: "Find pharmacies, doctors, dentists, and hospitals near you",
  },
  {
    icon: Users,
    title: "Family Profiles",
    description: "Manage health data for your whole family - children, spouse, parents",
  },
  {
    icon: Share2,
    title: "Export & Share",
    description: "Download or email health reports to share with your doctor",
  },
];

const benefits = [
  "Prepare better questions for doctor visits",
  "Track health data between appointments",
  "Keep all medical info in one place",
  "Never forget important symptoms",
  "Manage health for your whole family",
];

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">HealthPrep</span>
          </div>
          <Button onClick={handleLogin} data-testid="button-login-header">
            Sign In
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Secure & Private
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Prepare for Doctor Visits with{" "}
              <span className="text-primary">Confidence</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              HealthPrep helps you track symptoms, manage appointments, and generate 
              AI-powered questions to make the most of every healthcare visit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleLogin} data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive health tracking tools to help you stay on top of your wellbeing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover-elevate">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <ClipboardList className="h-12 w-12 mx-auto opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Take Control of Your Health?
            </h2>
            <p className="text-lg opacity-90">
              Join HealthPrep today and never walk into a doctor's office unprepared again.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={handleLogin}
              data-testid="button-signup-cta"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Heart className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">HealthPrep</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted companion for doctor visits
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
