import { Home, ChartBar, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function BottomNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 px-4 pb-safe">
      <Link href="/">
        <a className={`flex flex-col items-center ${location === '/' ? 'text-primary' : 'text-gray-500'}`}>
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Today</span>
        </a>
      </Link>
      <Link href="/progress">
        <a className={`flex flex-col items-center ${location === '/progress' ? 'text-primary' : 'text-gray-500'}`}>
          <ChartBar className="h-6 w-6" />
          <span className="text-xs mt-1">Progress</span>
        </a>
      </Link>
      <button 
        onClick={() => logoutMutation.mutate()}
        className="flex flex-col items-center text-gray-500"
      >
        <LogOut className="h-6 w-6" />
        <span className="text-xs mt-1">Logout</span>
      </button>
    </nav>
  );
}