"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  variant?: "default" | "navbar" | "sidebar" | "footer" | "hero";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  default: "text-foreground",
  navbar: "text-gray-800 hover:text-primary dark:text-dark dark:hover:text-primary",
  sidebar: "text-muted-foreground hover:text-foreground",
  footer: "text-muted-foreground hover:text-white dark:text-gray-400 dark:hover:text-white",
  hero: "text-white hover:text-primary-foreground",
};

const sizeStyles = {
  sm: "h-4 w-4",
  md: "h-[1.2rem] w-[1.2rem]",
  lg: "h-6 w-6",
};

export function ThemeToggle({ variant = "default", size = "md" }: ThemeToggleProps) {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full size-10 border dark:border-gray-600 dark:hover:bg-gray-100"
        >
          <Sun
            className={`${sizeStyles[size]} scale-100 rotate-0 transition-all ${variantStyles[variant]} dark:scale-0 dark:-rotate-90`}
          />
          <Moon
            className={`absolute ${sizeStyles[size]} scale-0 rotate-90 transition-all ${variantStyles[variant]} dark:scale-100 dark:rotate-0`}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
