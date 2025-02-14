import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProgressPage from "@/pages/progress-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import { MetaTags } from "@/components/meta-tags";
import { useLocation } from "wouter";

function Router() {
  const [location] = useLocation();

  // Define meta tags for each route
  const routeMeta = {
    "/": {
      title: "SeventyFive - 75 Hard Challenge Tracker",
      description: "Transform your life with the 75 Hard Challenge. Track your daily tasks, workouts, and progress all in one place.",
    },
    "/progress": {
      title: "Track Your Progress - SeventyFive",
      description: "View your 75 Hard Challenge progress, achievements, and transformation photos. Stay motivated with visual progress tracking.",
    },
    "/profile": {
      title: "Your Profile - SeventyFive",
      description: "Manage your 75 Hard Challenge settings, preferences, and customize your challenge experience.",
    },
    "/auth": {
      title: "Sign In - SeventyFive",
      description: "Join the community of 75 Hard Challenge participants. Sign in or create an account to start tracking your progress.",
    }
  };

  // Get meta data for current route
  const currentMeta = routeMeta[location as keyof typeof routeMeta] || {
    title: "Page Not Found - SeventyFive",
    description: "The page you're looking for doesn't exist. Return to the 75 Hard Challenge tracker."
  };

  return (
    <>
      <MetaTags {...currentMeta} />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;