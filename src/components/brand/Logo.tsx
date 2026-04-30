import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "default" | "light" | "dark";
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  className,
  variant = "default",
  showText = true,
  size = "md",
}: LogoProps) {
  const sizes = {
    sm: { box: "h-7 w-7", icon: "h-4 w-4", text: "text-base" },
    md: { box: "h-9 w-9", icon: "h-5 w-5", text: "text-lg" },
    lg: { box: "h-12 w-12", icon: "h-7 w-7", text: "text-2xl" },
  };

  const textColor =
    variant === "light"
      ? "text-white"
      : variant === "dark"
        ? "text-secondary"
        : "text-foreground";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-elegant)]",
          sizes[size].box,
        )}
      >
        <Zap className={cn(sizes[size].icon, "fill-current")} strokeWidth={2.5} />
      </div>
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            sizes[size].text,
            textColor,
          )}
        >
          PEDI<span className="text-primary">HUB</span>
        </span>
      )}
    </div>
  );
}
