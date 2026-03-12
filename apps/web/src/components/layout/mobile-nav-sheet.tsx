"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MobileContextualNavigation } from "@/components/layout/mobile-contextual-navigation";
import type { UserRole } from "@/lib/navigation";

type MobileNavSheetProps = {
  role: UserRole;
};

export function MobileNavSheet({ role }: MobileNavSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sand-100 ${
          isOpen
            ? "border-sage-400/70 bg-sage-500/15 hover:bg-sage-500/20"
            : "border-night-700 bg-night-900/80 hover:border-night-600"
        }`}
        aria-label={isOpen ? "Close mobile navigation" : "Open mobile navigation"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-sheet"
      >
        {isOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      {isOpen ? (
        <div
          id="mobile-navigation-sheet"
          className="fixed inset-x-0 top-14 z-30 h-[calc(100dvh-56px)] border-t border-night-800/80 bg-night-950/98 lg:hidden"
        >
          <div className="h-full overflow-y-auto px-4 py-4 pb-6">
            <MobileContextualNavigation role={role} onNavigate={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
