import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function ChallengeVariantSelector() {
  const { user } = useAuth();

  const updateVariantMutation = useMutation({
    mutationFn: async (variant: string) => {
      const res = await apiRequest("PATCH", "/api/user/challenge", { challengeType: variant });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  const variants = {
    "75hard": "75 Hard",
    "75soft": "75 Soft",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {variants[user?.challengeType as keyof typeof variants]}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(variants).map(([value, label]) => (
          <DropdownMenuItem
            key={value}
            onClick={() => updateVariantMutation.mutate(value)}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
