import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

interface ThemeSettings {
  appearance: "light" | "dark" | "system";
  primary: string;
}

// Available colors with their HSL values
const themeColors = {
  "Blue": "hsl(220, 90%, 60%)",
  "Purple": "hsl(270, 90%, 60%)",
  "Green": "hsl(150, 90%, 40%)",
  "Red": "hsl(0, 90%, 60%)",
  "Orange": "hsl(30, 90%, 60%)",
  "Pink": "hsl(330, 90%, 60%)",
  "Teal": "hsl(180, 90%, 40%)",
  "Indigo": "hsl(240, 90%, 60%)",
};

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeSettings>({
    appearance: "system",
    primary: themeColors.Blue,
  });

  useEffect(() => {
    // Load the current theme from theme.json
    fetch("/theme.json")
      .then(res => res.json())
      .then(data => setTheme(data));
  }, []);

  const updateTheme = async (newTheme: Partial<ThemeSettings>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    await fetch("/api/theme", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTheme),
    });
  };

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => updateTheme({ appearance: "light" })}>
            <Sun className="h-4 w-4 mr-2" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateTheme({ appearance: "dark" })}>
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateTheme({ appearance: "system" })}>
            <Monitor className="h-4 w-4 mr-2" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            style={{ color: theme.primary }}
          >
            <Palette className="h-5 w-5" />
            <span className="sr-only">Choose theme color</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Theme Color</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(themeColors).map(([name, color]) => (
            <DropdownMenuItem
              key={name}
              onClick={() => updateTheme({ primary: color })}
              className="flex items-center gap-2"
            >
              <div 
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}