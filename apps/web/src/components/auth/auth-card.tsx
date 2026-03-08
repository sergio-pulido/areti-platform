import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="animate-fade-in-up w-full max-w-md rounded-[1.75rem] border border-night-700/80 bg-night-900/72 p-6 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-8">
      {children}
    </div>
  );
}
