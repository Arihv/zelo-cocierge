import { Link } from "@tanstack/react-router";

export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-3 hover:opacity-90 transition-opacity ${className || ""}`}>
      <img 
        src="/zelo-logo.png" 
        alt="Zelo Logo" 
        className="h-10 w-10 object-contain rounded-lg border border-[#c6a35d]/30 shadow-sm"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="flex flex-col text-left">
        <span className="font-serif font-bold text-lg tracking-widest text-[#10382e] dark:text-[#e8d5a7]">
          ZELO
        </span>
        <span className="text-[10px] tracking-wider uppercase text-muted-foreground -mt-1">
          Concierge & Hospitality
        </span>
      </div>
    </Link>
  );
}