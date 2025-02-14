import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { user } = useAuth();

  return (
    <div className="bg-background border-b px-4 py-3 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {children}
          {!user && (
            <Link href="/auth">
              <Button variant="default" size="sm" className="font-medium">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}