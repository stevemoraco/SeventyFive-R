import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { CustomChallenge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";

const customChallengeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  workouts: z.number().min(0).max(5),
  outdoorWorkout: z.boolean(),
  waterAmount: z.number().min(0),
  readingMinutes: z.number().min(0),
  requirePhoto: z.boolean(),
  dietType: z.enum(["strict", "flexible", "none"]),
  customTasks: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Task name is required"),
    description: z.string(),
  })),
});

type CustomChallengeForm = z.infer<typeof customChallengeSchema>;

export function CustomChallengeCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<CustomChallengeForm>({
    resolver: zodResolver(customChallengeSchema),
    defaultValues: {
      workouts: 1,
      outdoorWorkout: false,
      waterAmount: 1,
      readingMinutes: 10,
      requirePhoto: false,
      dietType: "flexible",
      customTasks: [],
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challenge: CustomChallenge) => {
      const res = await apiRequest(
        "POST",
        "/api/challenges/custom",
        challenge
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Challenge Created",
        description: "Your custom challenge has been created successfully.",
      });
      setIsEditing(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCustomTask = () => {
    const currentTasks = form.getValues("customTasks");
    form.setValue("customTasks", [
      ...currentTasks,
      { id: nanoid(), name: "", description: "" },
    ]);
  };

  const removeCustomTask = (index: number) => {
    const currentTasks = form.getValues("customTasks");
    form.setValue(
      "customTasks",
      currentTasks.filter((_, i) => i !== index)
    );
  };

  const onSubmit = (data: CustomChallengeForm) => {
    createChallengeMutation.mutate({
      id: nanoid(),
      ...data,
    });
  };

  if (!isEditing) {
    return (
      <Button
        onClick={() => setIsEditing(true)}
        className="w-full"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Custom Challenge
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Challenge</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Custom Challenge" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your challenge rules and goals..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="workouts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Workouts</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="waterAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Water (Gallons)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="readingMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reading (Minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dietType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diet Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full h-10 px-3 border rounded-md"
                      >
                        <option value="strict">Strict</option>
                        <option value="flexible">Flexible</option>
                        <option value="none">None</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="outdoorWorkout"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Require Outdoor Workout
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirePhoto"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Require Progress Photo
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Custom Tasks</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomTask}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {form.watch("customTasks").map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Task {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomTask(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <FormField
                    control={form.control}
                    name={`customTasks.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Task name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`customTasks.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Task description"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createChallengeMutation.isPending}
              >
                Create Challenge
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
