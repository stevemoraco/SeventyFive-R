import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { CustomChallenge } from "@shared/schema";

export function ChallengeVariantSelector() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedCustomChallenge, setSelectedCustomChallenge] = useState<CustomChallenge | null>(null);

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

  const builtInVariants = {
    "75hard": {
      label: "75 Hard",
      description: "The original challenge: 2 workouts (one outdoors), strict diet, daily progress photo, no alcohol",
    },
    "75soft": {
      label: "75 Soft",
      description: "Modified version: 1 workout (45 min), flexible diet, no progress photo required",
    },
  };

  const customChallenges = user?.customChallenges as CustomChallenge[] || [];

  const handleVariantSelect = (variant: string, customChallenge?: CustomChallenge) => {
    if (variant === user?.challengeType && !customChallenge) return;
    setSelectedVariant(variant);
    setSelectedCustomChallenge(customChallenge || null);
    setShowConfirmDialog(true);
  };

  const getCurrentChallengeLabel = () => {
    if (user?.challengeType === "custom") {
      const currentCustomChallenge = customChallenges.find(c => c.id === user.currentCustomChallengeId);
      return currentCustomChallenge?.name || "Custom Challenge";
    }
    return builtInVariants[user?.challengeType as keyof typeof builtInVariants]?.label || "Select Challenge";
  };

  const getDescription = () => {
    if (selectedCustomChallenge) {
      return selectedCustomChallenge.description;
    }
    return selectedVariant ? builtInVariants[selectedVariant as keyof typeof builtInVariants]?.description : "";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {getCurrentChallengeLabel()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(builtInVariants).map(([value, { label }]) => (
            <DropdownMenuItem
              key={value}
              onClick={() => handleVariantSelect(value)}
            >
              {label}
            </DropdownMenuItem>
          ))}

          {customChallenges.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {customChallenges.map((challenge) => (
                <DropdownMenuItem
                  key={challenge.id}
                  onClick={() => handleVariantSelect("custom", challenge)}
                >
                  {challenge.name}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Challenge Type?</AlertDialogTitle>
            <AlertDialogDescription>
              {getDescription()}
              <br /><br />
              This will reset your progress to Day 1. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedVariant || selectedCustomChallenge) {
                updateVariantMutation.mutate(selectedVariant || "custom"); //Mutate with "custom" if custom challenge selected
              }
              setShowConfirmDialog(false);
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}