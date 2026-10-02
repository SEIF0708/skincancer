import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionItemProps {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AccordionItem({
  title,
  children,
  isOpen = false,
  onToggle,
}: AccordionItemProps) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left font-medium text-slate-800 transition hover:text-[#0F52BA]"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0F52BA]" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-3 pt-1 text-xs text-slate-600 space-y-2 animate-in fade-in-50 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

export function Accordion({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`divide-y divide-slate-100 ${className}`}>{children}</div>;
}
