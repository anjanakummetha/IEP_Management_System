import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn("rounded-2xl shadow-sm p-6 bg-white border border-sand", className)}>
      {children}
    </div>
  );
}
