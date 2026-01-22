import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow, startOfDay, isSameDay } from "date-fns";
import {
  Clock,
  Activity,
  Thermometer,
  Calendar,
  ClipboardList,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Symptom, Reading, Appointment, QuestionSet } from "@shared/schema";

interface TimelineItem {
  id: string;
  type: "symptom" | "reading" | "appointment" | "questions";
  timestamp: Date;
  data: Symptom | Reading | Appointment | QuestionSet;
}

function getTimelineIcon(type: string) {
  switch (type) {
    case "symptom":
      return Activity;
    case "reading":
      return Thermometer;
    case "appointment":
      return Calendar;
    case "questions":
      return ClipboardList;
    default:
      return Clock;
  }
}

function getTimelineColor(type: string) {
  switch (type) {
    case "symptom":
      return "bg-orange-500";
    case "reading":
      return "bg-blue-500";
    case "appointment":
      return "bg-green-500";
    case "questions":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

function TimelineItemCard({ item }: { item: TimelineItem }) {
  const IconComponent = getTimelineIcon(item.type);
  
  const renderContent = () => {
    switch (item.type) {
      case "symptom": {
        const symptom = item.data as Symptom;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{symptom.name}</span>
              <Badge variant="outline">Severity: {symptom.severity}/10</Badge>
            </div>
            {symptom.notes && (
              <p className="text-sm text-muted-foreground">{symptom.notes}</p>
            )}
          </div>
        );
      }
      case "reading": {
        const reading = item.data as Reading;
        const value = reading.secondaryValue 
          ? `${reading.value}/${reading.secondaryValue}` 
          : reading.value;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium capitalize">{reading.type.replace("_", " ")}</span>
              <Badge variant="secondary" className="font-mono">
                {value} {reading.unit}
              </Badge>
            </div>
            {reading.notes && (
              <p className="text-sm text-muted-foreground">{reading.notes}</p>
            )}
          </div>
        );
      }
      case "appointment": {
        const appointment = item.data as Appointment;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{appointment.title}</span>
              {appointment.doctorName && (
                <Badge variant="outline">{appointment.doctorName}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointment.appointmentDate), "h:mm a")}
              {appointment.location && ` at ${appointment.location}`}
            </p>
          </div>
        );
      }
      case "questions": {
        const questionSet = item.data as QuestionSet;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Questions Generated</span>
              <Badge variant="outline">{questionSet.condition}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {questionSet.symptoms}
            </p>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
          getTimelineColor(item.type)
        )}>
          <IconComponent className="h-4 w-4" />
        </div>
        <div className="flex-1 w-px bg-border mt-2" />
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground">
            {format(item.timestamp, "h:mm a")}
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {item.type}
          </Badge>
        </div>
        <Card>
          <CardContent className="p-3">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DayGroup({ date, items }: { date: Date; items: TimelineItem[] }) {
  const isToday = isSameDay(date, new Date());
  
  return (
    <div className="mb-6">
      <div className="sticky top-0 z-10 bg-background py-2 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {isToday ? "Today" : format(date, "EEEE, MMMM d")}
          </h3>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
        <Separator className="mt-2" />
      </div>
      <div className="space-y-0">
        {items.map((item, index) => (
          <TimelineItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function Timeline() {
  const { data: symptoms } = useQuery<Symptom[]>({
    queryKey: ["/api/symptoms"],
  });

  const { data: readings } = useQuery<Reading[]>({
    queryKey: ["/api/readings"],
  });

  const { data: appointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: questionSets } = useQuery<QuestionSet[]>({
    queryKey: ["/api/questions"],
  });

  const isLoading = !symptoms && !readings && !appointments && !questionSets;

  const allItems: TimelineItem[] = [
    ...(symptoms?.map(s => ({
      id: `symptom-${s.id}`,
      type: "symptom" as const,
      timestamp: new Date(s.recordedAt),
      data: s,
    })) || []),
    ...(readings?.map(r => ({
      id: `reading-${r.id}`,
      type: "reading" as const,
      timestamp: new Date(r.recordedAt),
      data: r,
    })) || []),
    ...(appointments?.map(a => ({
      id: `appointment-${a.id}`,
      type: "appointment" as const,
      timestamp: new Date(a.appointmentDate),
      data: a,
    })) || []),
    ...(questionSets?.map(q => ({
      id: `questions-${q.id}`,
      type: "questions" as const,
      timestamp: new Date(q.createdAt),
      data: q,
    })) || []),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const groupedByDay = allItems.reduce((groups, item) => {
    const dayKey = startOfDay(item.timestamp).toISOString();
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(item);
    return groups;
  }, {} as Record<string, TimelineItem[]>);

  const sortedDays = Object.keys(groupedByDay).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Health Timeline</h1>
        </div>
        <p className="text-muted-foreground">
          View your complete health history in chronological order
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          <span className="text-sm text-muted-foreground">Symptoms</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm text-muted-foreground">Readings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-sm text-muted-foreground">Appointments</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-purple-500" />
          <span className="text-sm text-muted-foreground">Questions</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : allItems.length > 0 ? (
        <div className="space-y-0">
          {sortedDays.map((dayKey) => (
            <DayGroup 
              key={dayKey} 
              date={new Date(dayKey)} 
              items={groupedByDay[dayKey]} 
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">No health data yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Start tracking symptoms, logging readings, or scheduling appointments 
              to see your health timeline.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
