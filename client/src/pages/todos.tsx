import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckSquare,
  Plus,
  Trash2,
  Loader2,
  Circle,
  CheckCircle2,
  Flag,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const priorityConfig = {
  high: { label: "High", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  low: { label: "Low", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
};

function TodoItem({
  todo,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const priority = (todo.priority ?? "medium") as "low" | "medium" | "high";
  const pc = priorityConfig[priority];
  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;

  return (
    <Card className={cn(todo.completed && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onToggle(todo.id, !todo.completed)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
            data-testid={`button-toggle-todo-${todo.id}`}
          >
            {todo.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="min-w-0 flex-1 space-y-1">
            <p className={cn("font-medium leading-snug", todo.completed && "line-through text-muted-foreground")}>
              {todo.title}
            </p>
            {todo.description && (
              <p className="text-sm text-muted-foreground">{todo.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge className={pc.className}>
                <Flag className="mr-1 h-3 w-3" />
                {pc.label}
              </Badge>
              {dueDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(dueDate, "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                data-testid={`button-delete-todo-${todo.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(todo.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function TodoForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", priority: "medium", dueDate: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Pick up prescription" data-testid="input-todo-title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any details..."
                  className="resize-none"
                  rows={3}
                  data-testid="input-todo-description"
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
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-todo-priority">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" data-testid="input-todo-due-date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-todo">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Task
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Todos() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      };
      return apiRequest("POST", "/api/todos", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setDialogOpen(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      apiRequest("PATCH", `/api/todos/${id}`, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/todos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

  const pending = todos?.filter((t) => !t.completed) ?? [];
  const completed = todos?.filter((t) => t.completed) ?? [];

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">To-Do List</h1>
          </div>
          <p className="text-muted-foreground">Track health-related tasks and reminders</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-todo">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
              <DialogDescription>Add a health-related task to your list</DialogDescription>
            </DialogHeader>
            <TodoForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setDialogOpen(false)}
              isPending={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                Tasks <span className="text-muted-foreground font-normal text-base">({pending.length})</span>
              </h2>
              <div className="space-y-2">
                {pending.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={(id, completed) => toggleMutation.mutate({ id, completed })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">
                Completed <span className="font-normal text-base">({completed.length})</span>
              </h2>
              <div className="space-y-2">
                {completed.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={(id, comp) => toggleMutation.mutate({ id, completed: comp })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {(!todos || todos.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">No tasks yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add tasks like picking up prescriptions or scheduling follow-ups
                </p>
                <Button className="mt-4" onClick={() => setDialogOpen(true)} data-testid="button-add-first-todo">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
