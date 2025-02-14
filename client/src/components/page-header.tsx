import { ThemeSwitcher } from "./theme-switcher";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="bg-background border-b px-4 py-3 sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeSwitcher />
          {children}
        </div>
      </div>
    </div>
  );
}
