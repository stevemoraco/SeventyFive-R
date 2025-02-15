import { useQuery } from "@tanstack/react-query";
import { UserProgress } from "@shared/schema";
import { BottomNav } from "@/components/bottom-nav";
import { ProgressComparison } from "@/components/progress-comparison";
import { ProgressGallery } from "@/components/progress-gallery";
import { AdvancedStats } from "@/components/advanced-stats";
import { PageHeader } from "@/components/page-header";

export default function ProgressPage() {
  const { data: progress } = useQuery<UserProgress>({
    queryKey: ["/api/progress"],
  });

  if (!progress) return null;

  return (
    <div className="pb-20">
      <PageHeader title="Progress" />

      <div className="p-4 space-y-6">
        <ProgressComparison />
        <AdvancedStats progress={progress} />
        <ProgressGallery />
      </div>

      <BottomNav />
    </div>
  );
}