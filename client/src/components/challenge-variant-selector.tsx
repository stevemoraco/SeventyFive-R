import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function ChallengeVariantSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const updateVariantMutation = useMutation({
    mutationFn: async (variant: string) => {
      const res = await apiRequest("PATCH", "/api/user/challenge", { 
        challengeType: variant,
        currentDay: 1 // Reset progress to day 1
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Challenge Updated",
        description: "Your challenge type has been updated and progress has been reset to Day 1.",
      });
      setShowConfirmDialog(false);
    },
  });

  const variants = {
    "75hard": {
      label: "75 Hard",
      description: "The original challenge: 2 workouts (one outdoors), strict diet, daily progress photo, no alcohol",
    },
    "75soft": {
      label: "75 Soft",
      description: "Modified version: 1 workout (45 min), flexible diet, no progress photo required",
    },
  };

  const handleVariantSelect = (variant: string) => {
    if (variant === user?.challengeType) return;
    setSelectedVariant(variant);
    setShowConfirmDialog(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {variants[user?.challengeType as keyof typeof variants]?.label}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(variants).map(([value, { label }]) => (
            <DropdownMenuItem
              key={value}
              onClick={() => handleVariantSelect(value)}
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Challenge Type?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedVariant && variants[selectedVariant as keyof typeof variants]?.description}
              <br /><br />
              This will reset your progress to Day 1. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedVariant) {
                updateVariantMutation.mutate(selectedVariant);
              }
              setShowConfirmDialog(false);
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}