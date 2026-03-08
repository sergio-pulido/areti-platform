type AuthDividerProps = {
  label?: string;
};

export function AuthDivider({ label = "or" }: AuthDividerProps) {
  return (
    <div className="relative py-1" role="separator" aria-label={label}>
      <div className="border-t border-night-700/80" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-night-900 px-2 text-xs uppercase tracking-[0.18em] text-night-300">
        {label}
      </span>
    </div>
  );
}
