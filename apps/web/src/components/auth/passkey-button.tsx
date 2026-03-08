import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type PasskeyButtonProps = {
  onClick: () => void;
  pending: boolean;
  disabled?: boolean;
};

export function PasskeyButton({ onClick, pending, disabled }: PasskeyButtonProps) {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        variant="secondary"
        size="lg"
        className="h-11 w-full border-night-600/90 bg-night-900/85 font-medium hover:border-sage-300"
      >
        <KeyRound size={16} aria-hidden="true" />
        {pending ? "Opening secure sign-in..." : "Continue with passkey"}
      </Button>
      <p className="text-center text-xs text-night-300">Use your device&apos;s secure sign-in method.</p>
    </div>
  );
}
