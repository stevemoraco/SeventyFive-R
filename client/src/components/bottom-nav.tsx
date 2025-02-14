import { Home, ChartBar, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: typeof Home; label: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <button
          className={cn(
            "flex flex-col items-center w-full",
            isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-6 w-6" />
          <span className="text-xs mt-1">{label}</span>
        </button>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around items-center h-16 px-4 pb-safe">
      <NavLink href="/" icon={Home} label="Today" />
      <NavLink href="/progress" icon={ChartBar} label="Progress" />
      <NavLink href="/profile" icon={User} label="Profile" />
    </nav>
  );
}