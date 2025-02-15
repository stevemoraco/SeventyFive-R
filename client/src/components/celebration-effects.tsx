import { useCallback, useEffect, useState } from "react";
import ReactConfetti from "react-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trophy } from "lucide-react";

interface TaskCompletionProps {
  x: number;
  y: number;
}

export function TaskCompletion({ x, y }: TaskCompletionProps) {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsActive(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isActive) return null;

  return (
    <ReactConfetti
      width={window.innerWidth}
      height={window.innerHeight}
      numberOfPieces={50}
      recycle={false}
      confettiSource={{
        x,
        y,
        w: 10,
        h: 10
      }}
    />
  );
}

interface DayCompletionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DayCompletion({ open, onOpenChange }: DayCompletionProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={200}
          recycle={true}
        />
      )}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Day Complete!</DialogTitle>
            <DialogDescription>
              Congratulations! You've completed all your tasks for today.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Keep up the great work! Every day completed brings you closer to your goals.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}