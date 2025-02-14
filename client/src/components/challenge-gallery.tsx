import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { CustomChallenge } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, ChevronDown, ChevronUp, Dumbbell, Droplet, Book, Camera } from "lucide-react";
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

export function ChallengeGallery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedCustomChallenge, setSelectedCustomChallenge] = useState<CustomChallenge | null>(null);

  const builtInVariants = {
    "75hard": {
      name: "75 Hard Challenge",
      description: "The original challenge: 2 workouts (one outdoors), strict diet, daily progress photo, no alcohol",
      features: ["2 workouts daily", "One outdoor workout", "Strict diet", "Daily progress photo"],
    },
    "75soft": {
      name: "75 Soft Challenge",
      description: "Modified version: 1 workout (45 min), flexible diet, no progress photo required",
      features: ["1 workout daily", "Flexible diet", "No photo required"],
    },
  };

  const updateVariantMutation = useMutation({
    mutationFn: async (variant: string) => {
      const res = await apiRequest("PATCH", "/api/user/challenge", { 
        challengeType: variant,
        currentDay: 1,
        customChallengeId: selectedCustomChallenge?.id
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
      setIsExpanded(false);
    },
  });

  const handleVariantSelect = (variant: string, customChallenge?: CustomChallenge) => {
    if (variant === user?.challengeType && 
        (!customChallenge || customChallenge.id === user.currentCustomChallengeId)) return;
    setSelectedVariant(variant);
    setSelectedCustomChallenge(customChallenge || null);
    setShowConfirmDialog(true);
  };

  const getFeaturesList = (challenge: CustomChallenge) => {
    const features = [];
    if (challenge.workouts > 0) features.push(`${challenge.workouts} workout${challenge.workouts > 1 ? 's' : ''} daily`);
    if (challenge.outdoorWorkout) features.push('Outdoor workout required');
    if (challenge.waterAmount > 0) features.push(`${challenge.waterAmount} gallon${challenge.waterAmount > 1 ? 's' : ''} of water`);
    if (challenge.readingMinutes > 0) features.push(`${challenge.readingMinutes} minutes reading`);
    if (challenge.dietType !== 'none') features.push(`${challenge.dietType} diet`);
    if (challenge.requirePhoto) features.push('Daily progress photo');
    if (challenge.customTasks.length > 0) features.push(`${challenge.customTasks.length} custom tasks`);
    return features;
  };

  const customChallenges = user?.customChallenges as CustomChallenge[] || [];

  return (
    <>
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          className="w-full justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Challenge Settings</span>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {isExpanded && (
          <div className="space-y-4 pt-2">
            <h3 className="font-medium">Built-in Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(builtInVariants).map(([value, variant]) => (
                <Card
                  key={value}
                  className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                    value === user?.challengeType ? 'border-primary' : ''
                  }`}
                  onClick={() => handleVariantSelect(value)}
                >
                  <h4 className="font-medium">{variant.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{variant.description}</p>
                  <ul className="mt-2 space-y-1">
                    {variant.features.map((feature, i) => (
                      <li key={i} className="text-sm flex items-center space-x-2">
                        <span className="w-1 h-1 bg-primary rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>

            {customChallenges.length > 0 && (
              <>
                <h3 className="font-medium pt-4">Custom Challenges</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customChallenges.map((challenge) => (
                    <Card
                      key={challenge.id}
                      className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                        user?.challengeType === 'custom' && user.currentCustomChallengeId === challenge.id
                          ? 'border-primary'
                          : ''
                      }`}
                      onClick={() => handleVariantSelect('custom', challenge)}
                    >
                      <h4 className="font-medium">{challenge.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{challenge.description}</p>
                      <ul className="mt-2 space-y-1">
                        {getFeaturesList(challenge).map((feature, i) => (
                          <li key={i} className="text-sm flex items-center space-x-2">
                            <span className="w-1 h-1 bg-primary rounded-full" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Challenge Type?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCustomChallenge?.description || 
                (selectedVariant && builtInVariants[selectedVariant as keyof typeof builtInVariants]?.description)}
              <br /><br />
              This will reset your progress to Day 1. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedVariant || selectedCustomChallenge) {
                updateVariantMutation.mutate(selectedVariant || "custom");
              }
              setShowConfirmDialog(false);
            }}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
