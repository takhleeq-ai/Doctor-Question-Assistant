import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  Loader2,
  AlertCircle,
  Building2,
  Pill,
  Stethoscope,
  Hospital,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  openingHours?: string;
  isOpen?: boolean;
  website?: string;
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  isManual: boolean;
}

const SERVICE_TYPES = [
  { key: "pharmacy", label: "Pharmacy", icon: Pill },
  { key: "gp", label: "GP / Doctor", icon: Stethoscope },
  { key: "dentist", label: "Dentist", icon: Building2 },
  { key: "optician", label: "Optician", icon: Eye },
  { key: "hospital", label: "A&E / Hospital", icon: Hospital },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

export default function NearbyServices() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    isManual: false,
  });
  const [activeTab, setActiveTab] = useState("pharmacy");
  const [manualLocation, setManualLocation] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const requestGeolocation = () => {
    setLocation({ ...location, loading: true, error: null });
    
    if (!navigator.geolocation) {
      setLocation({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser. Please enter a location manually.",
        loading: false,
        isManual: false,
      });
      setShowManualInput(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          isManual: false,
        });
        setShowManualInput(false);
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        setLocation({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
          isManual: false,
        });
        setShowManualInput(true);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  useEffect(() => {
    requestGeolocation();
  }, []);

  const { data: places, isLoading: placesLoading, refetch, isRefetching, error: queryError } = useQuery<NearbyPlace[]>({
    queryKey: ["/api/nearby", activeTab, location.latitude, location.longitude],
    queryFn: async () => {
      if (!location.latitude || !location.longitude) return [];
      const response = await fetch(
        `/api/nearby?type=${activeTab}&lat=${location.latitude}&lon=${location.longitude}`
      );
      if (!response.ok) throw new Error("Failed to fetch nearby places");
      const data = await response.json();
      return data.map((place: NearbyPlace) => ({
        ...place,
        distance: calculateDistance(
          location.latitude!,
          location.longitude!,
          place.lat,
          place.lon
        ),
      })).sort((a: NearbyPlace, b: NearbyPlace) => a.distance - b.distance);
    },
    enabled: !!location.latitude && !!location.longitude,
    staleTime: 300000,
    retry: 2,
  });

  const handleManualLocationSubmit = async () => {
    if (!manualLocation.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setLocation({
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          error: null,
          loading: false,
          isManual: true,
        });
        setShowManualInput(false);
      } else {
        setLocation({
          ...location,
          error: "Could not find that location. Please try a different address or postcode.",
          loading: false,
        });
      }
    } catch {
      setLocation({
        ...location,
        error: "Failed to search for location. Please try again.",
        loading: false,
      });
    }
  };

  const openInMaps = (place: NearbyPlace) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
    window.open(url, "_blank");
  };

  const handleRefresh = () => {
    refetch();
  };

  if (location.loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Getting your location...</p>
        </div>
      </div>
    );
  }

  if (location.error && !location.latitude) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Nearby Services</h1>
            <p className="text-muted-foreground">
              Find pharmacies, doctors, dentists, and hospitals near you
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Location Error</AlertTitle>
            <AlertDescription>{location.error}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enter Your Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your address, city, or postcode to find nearby services:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., London, W1A 1AA, or 123 High Street"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualLocationSubmit()}
                  data-testid="input-manual-location"
                />
                <Button onClick={handleManualLocationSubmit} data-testid="button-search-location">
                  <MapPin className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={requestGeolocation} data-testid="button-retry-location">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Automatic Location Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">Nearby Services</h1>
            <p className="text-muted-foreground">
              Find pharmacies, doctors, dentists, and hospitals near you
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location.isManual ? "Manual location" : "Location active"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualInput(!showManualInput)}
              data-testid="button-change-location"
            >
              Change Location
            </Button>
          </div>
        </div>

        {showManualInput && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter address, city, or postcode..."
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualLocationSubmit()}
                  data-testid="input-change-location"
                />
                <Button onClick={handleManualLocationSubmit} data-testid="button-update-location">
                  <MapPin className="h-4 w-4 mr-2" />
                  Update
                </Button>
                <Button variant="outline" onClick={requestGeolocation} data-testid="button-use-gps">
                  Use GPS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {queryError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>
              Failed to search for nearby services. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {SERVICE_TYPES.map((service) => (
              <TabsTrigger
                key={service.key}
                value={service.key}
                className="flex items-center gap-2"
                data-testid={`tab-${service.key}`}
              >
                <service.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{service.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SERVICE_TYPES.map((service) => (
            <TabsContent key={service.key} value={service.key} className="mt-6">
              {placesLoading || isRefetching ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !places || places.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Results</AlertTitle>
                  <AlertDescription>
                    No {service.label.toLowerCase()} found within 10km of your location.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4">
                  {places.map((place) => (
                    <Card key={place.id} className="hover-elevate" data-testid={`card-place-${place.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                              <service.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{place.name || "Unknown"}</CardTitle>
                              {place.address && (
                                <p className="text-sm text-muted-foreground mt-1">{place.address}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0">
                            {formatDistance(place.distance)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          {place.phone && (
                            <a
                              href={`tel:${place.phone}`}
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              <Phone className="h-4 w-4" />
                              {place.phone}
                            </a>
                          )}
                          {place.openingHours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {place.openingHours}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openInMaps(place)}
                            data-testid={`button-directions-${place.id}`}
                          >
                            <Navigation className="h-4 w-4 mr-2" />
                            Get Directions
                          </Button>
                          {place.phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              data-testid={`button-call-${place.id}`}
                            >
                              <a href={`tel:${place.phone}`}>
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
