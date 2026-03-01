"use client";

import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onSelect, className }: TabsProps) {
  return (
    <div className={cn("border-b border-slate-200", className)}>
      <nav className="flex gap-6" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeId === tab.id
                ? "border-mahogany text-mahogany"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
